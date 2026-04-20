import OpenAI from 'openai';
import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel, JiraTaskType, Project } from '../../types';
import { marked } from 'marked';
import { sanitizeHTML } from '../../utils/sanitize';
import { AIService } from './aiServiceInterface';
import { getFormattedContext } from './documentContextService';
import {
  buildBddOnlyPrompt,
  buildComplementaryDocumentSection,
  buildStrategyOnlyPrompt,
  buildTestCasesOnlyPrompt,
  buildTestGenerationRolePreamble,
  formatBusinessRulesForPrompt,
  shouldGenerateTestCasesAndBdd,
} from './testGenerationPrompts';
import { normalizeStrategyReferences } from './testGenerationValidators';
import { logger } from '../../utils/logger';
import { retryWithBackoff } from '../../utils/retry';
import { getGeminiConfig } from '../geminiConfigService';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

// Verificar se há alguma chave de IA disponível (OpenAI, Gemini no ambiente ou Gemini nas Configurações)
const hasAnyAIKey = () => {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  const geminiUiKey = getGeminiConfig()?.apiKey?.trim();
  return !!(openaiKey || geminiKey || geminiUiKey);
};

let openai: OpenAI | null = null;

if (API_KEY) {
  openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true // Necessário para uso no browser
  });
} else {
  if (!hasAnyAIKey()) {
    console.info(
      '[QA Agile Guide] Nenhuma chave de IA (OpenAI ou Gemini) está configurada. Os recursos de modelo generativo permanecem desligados até você adicionar uma chave — comportamento esperado em desenvolvimento.'
    );
  }
}

const getOpenAI = () => {
  if (!openai) {
    throw new Error(
      'O provedor OpenAI não está disponível: defina VITE_OPENAI_API_KEY (ou OPENAI_API_KEY) no .env para usar este serviço. Se você usa apenas o Gemini, configure a chave do Gemini nas Configurações ou no .env; este trecho do código exige cliente OpenAI.'
    );
  }
  return openai;
};

/** True se houver chave OpenAI no ambiente (fallback quando o Gemini retorna 429/cota). */
export function isOpenAIEnvApiKeyConfigured(): boolean {
  return !!((import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '').trim());
}

/** Considera 429, 503 e 5xx como retentáveis para chamadas à API OpenAI */
function isOpenAIRetryable(error: unknown): boolean {
  const err = error as { status?: number; statusCode?: number; message?: string };
  const status = err?.status ?? err?.statusCode;
  if (typeof status === 'number' && (status === 429 || status === 503 || (status >= 500 && status < 600))) {
    return true;
  }
  if (error instanceof Error) {
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) return true;
    if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) return true;
  }
  return false;
}

type CallApiOptions = {
  responseFormat?: { type: 'json_object' };
  /** Padrão 0.7; geração de artefatos de teste usa valor mais baixo para aderência. */
  temperature?: number;
};

type OpenAiStrategyRow = {
  testType?: string;
  description?: string;
  howToExecute?: string[];
  tools?: string;
};

type OpenAiBddRow = { title?: string; gherkin?: string };

type OpenAiTestCaseRow = {
  description?: string;
  steps?: string[];
  expectedResult?: string;
  strategies?: string[];
  isAutomated?: boolean;
  preconditions?: string;
  testSuite?: string;
  testEnvironment?: string;
  priority?: string;
};

export class OpenAIService implements AIService {
  private async callAPI(prompt: string, options?: CallApiOptions): Promise<string> {
    const client = getOpenAI();
    const temperature = options?.temperature ?? 0.7;
    const responseFormat = options?.responseFormat;

    const response = await retryWithBackoff(
      () =>
        client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em garantia de qualidade de software (QA) e análise de projetos. Sempre responda em português brasileiro.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: responseFormat,
          temperature,
        }),
      { isRetryable: isOpenAIRetryable, maxRetries: 3, initialDelay: 1000 }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }
    return content;
  }

  private mapStrategyFromResponse(items: unknown[]): TestStrategy[] {
    return (items as OpenAiStrategyRow[]).map((item) => ({
      testType: item.testType ?? '',
      description: item.description ?? '',
      howToExecute: Array.isArray(item.howToExecute) ? item.howToExecute : [],
      tools: item.tools ?? '',
    }));
  }

  private mapBddFromResponse(items: unknown[], baseTs: number): BddScenario[] {
    return (items as OpenAiBddRow[]).map((item, index) => ({
      id: `bdd-${baseTs}-${index}`,
      title: item.title ?? '',
      gherkin: item.gherkin ?? '',
    }));
  }

  private mapTestCasesFromResponse(
    items: unknown[],
    strategy: TestStrategy[],
    baseTs: number
  ): TestCase[] {
    return (items as OpenAiTestCaseRow[]).map((item, index) => ({
      id: `tc-${baseTs}-${index}`,
      description: item.description ?? '',
      steps: Array.isArray(item.steps) ? item.steps : [],
      expectedResult: item.expectedResult ?? '',
      status: 'Not Run' as const,
      strategies: normalizeStrategyReferences(item.strategies, strategy),
      isAutomated: typeof item.isAutomated === 'boolean' ? item.isAutomated : false,
      preconditions: item.preconditions || undefined,
      testSuite: item.testSuite || undefined,
      testEnvironment: item.testEnvironment || undefined,
      priority:
        item.priority === 'Baixa' ||
        item.priority === 'Média' ||
        item.priority === 'Alta' ||
        item.priority === 'Urgente'
          ? item.priority
          : undefined,
    }));
  }

  /** Mesmo pipeline em 3 chamadas do Gemini, com temperatura mais baixa para aderência. */
  async generateTestCasesForTask(
    title: string,
    description: string,
    bddScenarios?: BddScenario[],
    detailLevel: TestCaseDetailLevel = 'Padrão',
    taskType?: JiraTaskType,
    project?: Project | null,
    task?: JiraTask | null,
    attachmentsContext?: string
  ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[]; bddScenarios: BddScenario[] }> {
    const shouldCases = shouldGenerateTestCasesAndBdd(taskType);
    const baseTs = Date.now();
    const jsonOpts = { responseFormat: { type: 'json_object' as const }, temperature: 0.35 };

    try {
      const strategyPrompt = await buildStrategyOnlyPrompt(
        title,
        description,
        taskType,
        project ?? null,
        attachmentsContext,
        task
      );
      const strategyJson = await this.callAPI(strategyPrompt, jsonOpts);
      const strategyParsed = JSON.parse(strategyJson);
      if (!strategyParsed || !Array.isArray(strategyParsed.strategy)) {
        logger.error('Resposta da IA com strategy inválida', 'openaiService', strategyParsed);
        throw new Error('Resposta da IA com estrutura inválida (strategy).');
      }
      const strategy = this.mapStrategyFromResponse(strategyParsed.strategy);

      if (!shouldCases) {
        return { strategy, testCases: [], bddScenarios: [] };
      }

      let bddOut: BddScenario[];
      if (bddScenarios && bddScenarios.length > 0) {
        bddOut = bddScenarios;
      } else {
        const bddPrompt = await buildBddOnlyPrompt(
          title,
          description,
          taskType,
          project ?? null,
          strategy,
          attachmentsContext,
          task
        );
        const bddJson = await this.callAPI(bddPrompt, jsonOpts);
        const bddParsed = JSON.parse(bddJson);
        if (!bddParsed || !Array.isArray(bddParsed.bddScenarios)) {
          logger.error('Resposta da IA com bddScenarios inválidos', 'openaiService', bddParsed);
          throw new Error('Resposta da IA com estrutura inválida (bddScenarios).');
        }
        bddOut = this.mapBddFromResponse(bddParsed.bddScenarios, baseTs);
      }

      const tcPrompt = await buildTestCasesOnlyPrompt(
        title,
        description,
        taskType,
        detailLevel,
        project ?? null,
        strategy,
        bddOut,
        attachmentsContext,
        task
      );
      const tcJson = await this.callAPI(tcPrompt, jsonOpts);
      const tcParsed = JSON.parse(tcJson);
      if (!tcParsed || !Array.isArray(tcParsed.testCases)) {
        logger.error('Resposta da IA com testCases inválidos', 'openaiService', tcParsed);
        throw new Error('Resposta da IA com estrutura inválida (testCases).');
      }
      const testCases = this.mapTestCasesFromResponse(tcParsed.testCases, strategy, baseTs);

      return { strategy, testCases, bddScenarios: bddOut };
    } catch (error) {
      logger.error('Erro ao gerar casos de teste', 'openaiService', error);
      throw new Error('Failed to communicate with the OpenAI API.');
    }
  }

  async analyzeDocumentContent(content: string, project?: Project | null): Promise<string> {
    const documentContext = await getFormattedContext(project || null);
    const prompt = `${documentContext}
    Aja como um analista de QA sênior. Analise o seguinte documento de requisitos do projeto.
    Sua tarefa é fornecer uma análise estruturada e fácil de ler.
    Formate TODA a sua resposta usando Markdown e siga esta estrutura EXATAMENTE:

    ### Resumo e Pontos Principais
    - (Use uma lista de marcadores para resumir os principais requisitos e objetivos)

    ### Ambigüidades e Riscos
    - (Use uma lista de marcadores para listar quaisquer pontos que estejam pouco claros, ambíguos ou ausentes)
    - (Identifique potenciais riscos de qualidade com base na análise)

    ### Recomendações de Teste
    - (Use uma lista de marcadores para sugerir áreas-chave e tipos de teste que são cruciais)

    Conteúdo do Documento:
    ---
    ${content}
    ---
    `;

    try {
        const markdownText = await this.callAPI(prompt);
        const html = marked(markdownText) as string;
        return sanitizeHTML(html);
    } catch (error) {
        logger.error("Erro ao analisar documento", 'openaiService', error);
        throw new Error("Failed to communicate with the OpenAI API for document analysis.");
    }
  }

  async generateTaskFromDocument(documentContent: string, project?: Project | null): Promise<{ task: Omit<JiraTask, 'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'>, strategy: TestStrategy[], testCases: TestCase[] }> {
    const documentContext = await getFormattedContext(project || null);
    const prompt = `${documentContext}
    Aja como um Product Owner e um Analista de QA Sênior. A partir do documento de requisitos fornecido, gere um objeto JSON estruturado.

    O JSON deve ter três chaves principais: "taskDetails", "strategy" e "testCases".

    1.  **taskDetails**: Um objeto contendo:
        *   **title**: Um título claro e conciso para uma tarefa do tipo "História", resumindo o principal requisito do documento.
        *   **description**: Uma descrição detalhada no formato de história de usuário ("Como um [tipo de usuário], eu quero [objetivo] para que [benefício]").
        *   **type**: O valor deve ser sempre "História".

    2.  **strategy**: Uma lista de estratégias de teste recomendadas. Para cada estratégia, especifique testType, description, howToExecute (array de strings), e tools (string).

    3.  **testCases**: Deve ser sempre um array vazio [], pois tarefas do tipo "História" não devem ter casos de teste. Apenas estratégias de teste são necessárias.

    Conteúdo do Documento:
    ---
    ${documentContent}
    ---

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { responseFormat: { type: 'json_object' } });
        const parsedResponse = JSON.parse(jsonString);
        
        // Histórias não devem ter casos de teste, apenas estratégias
        const testCases: TestCase[] = [];
        
        const strategy: TestStrategy[] = parsedResponse.strategy.map((item: any) => ({
          ...item,
          howToExecute: item.howToExecute,
        }));

        return {
            task: { 
                ...parsedResponse.taskDetails, 
                testCases: [], 
                testStrategy: [],
                owner: 'Product',
                assignee: 'QA',
            },
            strategy,
            testCases,
        };

    } catch (error) {
        logger.error("Erro ao gerar tarefa a partir do documento", 'openaiService', error);
        throw new Error("Failed to generate task from document.");
    }
  }

  async generateProjectLifecyclePlan(projectName: string, projectDescription: string, tasks: JiraTask[], project?: Project | null): Promise<{ [key in PhaseName]?: { summary: string, testTypes: string[] } }> {
    const documentContext = await getFormattedContext(project || null);
    const taskSummaries = tasks.map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`).join('\n');
    const prompt = `${documentContext}
    Aja como um gerente de QA sênior e gerente de projetos experiente. Para o projeto de software a seguir, forneça um plano de ciclo de vida em formato JSON.

    Projeto: ${projectName}
    Descrição: ${projectDescription}
    Tarefas Iniciais:
    ${taskSummaries}

    Sua resposta DEVE ser um objeto JSON. As chaves devem ser EXATAMENTE os seguintes nomes de fase do DevOps: "Request", "Analysis", "Design", "Analysis and Code", "Build", "Test", "Release", "Deploy", "Operate", "Monitor". 

    O valor para cada chave de fase deve ser um objeto com duas chaves:
    1. "summary": Uma string com um resumo conciso (2-3 frases) das principais atividades e responsabilidades de QA para aquela fase, no contexto do projeto fornecido.
    2. "testTypes": Um array de strings listando os tipos de teste mais relevantes para esta fase (ex: ["Unitário", "API", "Segurança"]). Mantenha a lista concisa e focada nos tipos mais importantes para a fase.

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { responseFormat: { type: 'json_object' } });
        return JSON.parse(jsonString);
    } catch (error) {
        logger.error("Erro ao gerar plano de ciclo de vida do projeto", 'openaiService', error);
        throw new Error("Failed to communicate with the OpenAI API for project planning.");
    }
  }

  async generateShiftLeftAnalysis(projectName: string, projectDescription: string, tasks: JiraTask[], project?: Project | null): Promise<ShiftLeftAnalysis> {
    const documentContext = await getFormattedContext(project || null);
    const taskSummaries = tasks.map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`).join('\n');
    const prompt = `${documentContext}
    Aja como um especialista em "Shift Left Testing". Para o projeto a seguir, forneça recomendações práticas e acionáveis para introduzir atividades de qualidade e teste o mais cedo possível no ciclo de vida.

    Projeto: ${projectName}
    Descrição: ${projectDescription}
    Tarefas Atuais:
    ${taskSummaries}

    Sua resposta DEVE ser um objeto JSON contendo uma única chave "recommendations".
    "recommendations" deve ser um array de objetos. Cada objeto deve ter duas chaves:
    1. "phase": O nome da fase inicial do ciclo de vida. Use EXATAMENTE um dos seguintes valores: "Analysis", "Design", ou "Analysis and Code".
    2. "recommendation": Uma string contendo uma recomendação específica e acionável sobre uma atividade de teste ou qualidade para essa fase.

    Forneça pelo menos uma recomendação para cada uma das três fases.

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { responseFormat: { type: 'json_object' } });
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse;
    } catch (error) {
        logger.error("Erro ao gerar análise Shift Left", 'openaiService', error);
        throw new Error("Failed to communicate with the OpenAI API for Shift Left analysis.");
    }
  }

  async generateBddScenarios(
    title: string,
    description: string,
    project?: Project | null,
    task?: JiraTask | null,
    attachmentsContext?: string
  ): Promise<BddScenario[]> {
    const br = formatBusinessRulesForPrompt(project ?? null, task);
    const preamble = buildTestGenerationRolePreamble(title, description, br);
    const doc = await buildComplementaryDocumentSection(project ?? null);
    const att = attachmentsContext?.trim()
      ? `\nAnexos (nomes; use só se coerente com a descrição):\n${attachmentsContext.trim()}\n`
      : '';
    const prompt = `
${preamble}

Você é especialista em BDD. Responda em português brasileiro.

Objetivo: gerar cenários Gherkin **somente** para a tarefa abaixo. Não invente escopo de outras partes do projeto.

Regras Gherkin:
- Palavras-chave somente em português: Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas.
- Proibido: Given, When, Then, Feature, Scenario em inglês.
- Um passo por linha.
- Cubra caminho feliz, variações relevantes, erro/validação e permissão apenas se fizer sentido na descrição.

═══════════════════════════════════════════════════════════════
TAREFA (prioridade máxima)
═══════════════════════════════════════════════════════════════
Título: ${title}
Descrição: ${description}
${att}
${doc}

Responda somente com JSON válido: {"scenarios":[{"title":"","gherkin":""},...]}.
`.trim();

    try {
        const jsonString = await this.callAPI(prompt, {
          responseFormat: { type: 'json_object' },
          temperature: 0.35,
        });
        const parsedResponse = JSON.parse(jsonString);
        
        if (!parsedResponse || !Array.isArray(parsedResponse.scenarios)) {
            throw new Error("Resposta da IA com estrutura inválida para cenários BDD.");
        }

        return parsedResponse.scenarios.map((sc: any, index: number) => ({
            ...sc,
            id: `bdd-${Date.now()}-${index}`,
        }));
    } catch (error) {
        logger.error("Erro ao gerar cenários BDD", 'openaiService', error);
        throw new Error("Falha ao comunicar com a API OpenAI para gerar cenários BDD.");
    }
  }

  async generateTestPyramidAnalysis(projectName: string, projectDescription: string, tasks: JiraTask[], project?: Project | null): Promise<TestPyramidAnalysis> {
    const documentContext = await getFormattedContext(project || null);
    const taskSummaries = tasks.map(t => `- ${t.id} ${t.title}`).join('\n');
    const prompt = `${documentContext}
    Aja como um arquiteto de QA especialista em automação de testes. Para o projeto a seguir, analise os requisitos e forneça uma estratégia de Pirâmide de Testes.

    Projeto: ${projectName}
    Descrição: ${projectDescription}
    Tarefas:
    ${taskSummaries}

    Sua resposta DEVE ser um objeto JSON com uma única chave "distribution".
    "distribution" deve ser um array de 3 objetos, um para cada nível da pirâmide: "Unitário", "Integração" e "E2E".
    Cada objeto deve ter três chaves:
    1. "level": O nome do nível (Use EXATAMENTE "Unitário", "Integração", ou "E2E").
    2. "effort": Uma string representando a porcentagem de esforço recomendada para este nível (ex: "70%").
    3. "examples": Um array de strings, onde cada string é um exemplo específico e acionável de um teste para este nível, no contexto do projeto fornecido.

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

     try {
        const jsonString = await this.callAPI(prompt, { responseFormat: { type: 'json_object' } });
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse;
    } catch (error) {
        logger.error("Erro ao gerar análise Test Pyramid", 'openaiService', error);
        throw new Error("Failed to communicate with the OpenAI API for Test Pyramid analysis.");
    }
  }
}
