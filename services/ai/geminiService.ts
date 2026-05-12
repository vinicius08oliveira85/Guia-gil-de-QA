import { Type } from '@google/genai';
import {
  TestCase,
  TestStrategy,
  PhaseName,
  ShiftLeftAnalysis,
  BddScenario,
  JiraTask,
  TestPyramidAnalysis,
  TestCaseDetailLevel,
  JiraTaskType,
  Project,
} from '../../types';
import { marked } from 'marked';
import { sanitizeHTML } from '../../utils/sanitize';
import { AIService } from './aiServiceInterface';
import { getFormattedContext } from './documentContextService';
import {
  callGeminiWithRetry,
  isGeminiRateLimitOrQuotaError,
  isGeminiTemporaryServiceError,
} from './geminiApiWrapper';
import { OpenAIService, isOpenAIEnvApiKeyConfigured } from './openaiService';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { logger } from '../../utils/logger';
import { parseAiJsonText } from '../../utils/aiJsonParse';
import {
  buildBddOnlyPrompt,
  buildComplementaryDocumentSection,
  buildStrategyOnlyPrompt,
  buildTestCasesOnlyPrompt,
  buildTestGenerationRolePreamble,
  formatBusinessRulesForPrompt,
  shouldGenerateTestCasesAndBdd,
} from './testGenerationPrompts';
import { migrateTestCase, resolveExecutionKindFromRecord } from '../../utils/testCaseMigration';
import {
  coalesceParametersFromAiRow,
  type AiRawTestCaseRow,
} from './mapAiTestCaseRows';

const geminiTestStrategyItemSchema = {
  type: Type.OBJECT,
  properties: {
    testType: {
      type: Type.STRING,
      description:
        'O nome do tipo de teste (ex: Teste Funcional, Teste de Integração, Teste de Regressão).',
    },
    description: {
      type: Type.STRING,
      description: 'Uma breve explicação do propósito deste teste no contexto da tarefa.',
    },
    howToExecute: {
      type: Type.ARRAY,
      description:
        'Um array de strings, onde cada string é um passo curto e acionável para executar o teste.',
      items: { type: Type.STRING },
    },
    tools: {
      type: Type.STRING,
      description:
        'Ferramentas recomendadas para este tipo de teste, separadas por vírgula (ex: Selenium, Postman, JMeter).',
    },
  },
  required: ['testType', 'description', 'howToExecute', 'tools'],
};

const geminiStrategyArrayProperty = {
  type: Type.ARRAY,
  description: 'Uma lista de estratégias de teste recomendadas para a tarefa.',
  items: geminiTestStrategyItemSchema,
};

const geminiBddItemSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Um título descritivo para o cenário.' },
    gherkin: {
      type: Type.STRING,
      description:
        'Cenário Gherkin em português: use SOMENTE as palavras-chave Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas — em português, sem Given/When/Then em inglês. Cada passo em linha própria.',
    },
  },
  required: ['title', 'gherkin'],
};

const geminiBddArrayProperty = {
  type: Type.ARRAY,
  description: 'Uma lista de cenários BDD (Behavior-Driven Development) usando a sintaxe Gherkin.',
  items: geminiBddItemSchema,
};

const geminiTestCaseItemSchema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      description:
        'Ação necessária: roteiro executável. OBRIGATÓRIO lista numerada 1. 2. 3. com caracteres newline REAIS entre cada passo (no JSON use \\n dentro da string). Proibido empilhar todos os passos numa única linha.',
    },
    parameters: {
      type: Type.STRING,
      description:
        'Parâmetros e massa de dados. Se houver MÚLTIPLOS itens, cada linha DEVE iniciar com o bullet Unicode • (U+2022). Um item pode ficar sem marcador. Use "—" se vazio.',
    },
    expectedResult: {
      type: Type.STRING,
      description:
        'Resultado esperado. Se houver MÚLTIPLAS verificações, cada linha DEVE iniciar com • (bullet). Uma única verificação pode ser texto corrido curto.',
    },
    executionKind: {
      type: Type.STRING,
      description:
        'Opcional: manual, automated ou mixed. Omitir para inferir pelo texto (métricas de automação).',
    },
    environment: {
      type: Type.STRING,
      description: 'Opcional: ambiente estruturado (ex.: Homologação) para filtros; pode coexistir com texto em parameters.',
    },
    suite: {
      type: Type.STRING,
      description: 'Opcional: suíte estruturada para filtros e relatórios.',
    },
  },
  required: ['action', 'parameters', 'expectedResult'],
};

const geminiTestCasesArrayProperty = {
  type: Type.ARRAY,
  description:
    'Casos de teste: action com lista numerada e quebras \\n reais; parameters e expectedResult com linhas iniciadas por • quando houver vários pontos. Campos obrigatórios action, parameters, expectedResult; opcionais executionKind, environment, suite. NUNCA observedResult.',
  items: geminiTestCaseItemSchema,
};

/** Schema completo (ex.: geração a partir de documento). */
const testCaseGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    strategy: geminiStrategyArrayProperty,
    bddScenarios: geminiBddArrayProperty,
    testCases: geminiTestCasesArrayProperty,
  },
  required: ['strategy', 'bddScenarios', 'testCases'],
};

const strategyOnlyResponseSchema = {
  type: Type.OBJECT,
  properties: { strategy: geminiStrategyArrayProperty },
  required: ['strategy'],
};

const bddOnlyResponseSchema = {
  type: Type.OBJECT,
  properties: { bddScenarios: geminiBddArrayProperty },
  required: ['bddScenarios'],
};

const testCasesOnlyResponseSchema = {
  type: Type.OBJECT,
  properties: { testCases: geminiTestCasesArrayProperty },
  required: ['testCases'],
};

type GeminiStrategyRow = {
  testType?: string;
  description?: string;
  howToExecute?: string[];
  tools?: string;
};

type GeminiBddRow = { title?: string; gherkin?: string };

type GeminiTestCaseRow = AiRawTestCaseRow;

export class GeminiService implements AIService {
  private mapStrategyFromResponse(items: unknown[]): TestStrategy[] {
    return (items as GeminiStrategyRow[]).map(item => ({
      testType: item.testType ?? '',
      description: item.description ?? '',
      howToExecute: Array.isArray(item.howToExecute) ? item.howToExecute : [],
      tools: item.tools ?? '',
    }));
  }

  private mapBddFromResponse(items: unknown[], baseTs: number): BddScenario[] {
    return (items as GeminiBddRow[]).map((item, index) => ({
      id: `bdd-${baseTs}-${index}`,
      title: item.title ?? '',
      gherkin: item.gherkin ?? '',
    }));
  }

  private mapTestCasesFromResponse(
    items: unknown[],
    _strategy: TestStrategy[],
    baseTs: number
  ): TestCase[] {
    return (items as GeminiTestCaseRow[]).map((item, index) => {
      const parameters = coalesceParametersFromAiRow(item);
      const row: Record<string, unknown> = { ...(item as object as Record<string, unknown>) };
      const executionKind = resolveExecutionKindFromRecord(row) ?? 'manual';
      const environment =
        typeof row.environment === 'string' && row.environment.trim()
          ? row.environment.trim()
          : undefined;
      const suite =
        typeof row.suite === 'string' && row.suite.trim() ? row.suite.trim() : undefined;
      const base: TestCase = {
        id: `tc-${baseTs}-${index}`,
        action: item.action || item.description || '',
        parameters,
        expectedResult: item.expectedResult || '',
        observedResult: '',
        status: 'Not Run',
        executionKind,
      };
      if (environment) base.environment = environment;
      if (suite) base.suite = suite;
      return base;
    });
  }

  /**
   * Gera estratégia, BDD e casos em chamadas separadas para maximizar aderência à tarefa
   * (tarefa primeiro; documento do projeto só como complemento truncado).
   */
  async generateTestCasesForTask(
    title: string,
    description: string,
    bddScenarios?: BddScenario[],
    detailLevel: TestCaseDetailLevel = 'Estruturado',
    taskType?: JiraTaskType,
    project?: Project | null,
    task?: JiraTask | null,
    attachmentsContext?: string
  ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[]; bddScenarios: BddScenario[] }> {
    const shouldCases = shouldGenerateTestCasesAndBdd(taskType);
    const baseTs = Date.now();

    const fallbackOpenAI = () =>
      new OpenAIService().generateTestCasesForTask(
        title,
        description,
        bddScenarios,
        detailLevel,
        taskType,
        project,
        task,
        attachmentsContext
      );

    try {
      const strategyPrompt = await buildStrategyOnlyPrompt(
        title,
        description,
        taskType,
        project ?? null,
        attachmentsContext,
        task
      );
      const strategyResp = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: strategyPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: strategyOnlyResponseSchema,
        },
      });
      const strategyParsed = parseAiJsonText<{ strategy?: unknown }>(strategyResp.text);
      if (!strategyParsed || !Array.isArray(strategyParsed.strategy)) {
        logger.error('Resposta da IA com strategy inválida', 'geminiService', strategyParsed);
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
        const bddResp = await callGeminiWithRetry({
          model: GEMINI_DEFAULT_MODEL,
          contents: bddPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: bddOnlyResponseSchema,
          },
        });
        const bddParsed = parseAiJsonText<{ bddScenarios?: unknown }>(bddResp.text);
        if (!bddParsed || !Array.isArray(bddParsed.bddScenarios)) {
          logger.error('Resposta da IA com bddScenarios inválidos', 'geminiService', bddParsed);
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
      const tcResp = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: tcPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: testCasesOnlyResponseSchema,
        },
      });
      const tcParsed = parseAiJsonText<{ testCases?: unknown }>(tcResp.text);
      if (!tcParsed || !Array.isArray(tcParsed.testCases)) {
        logger.error('Resposta da IA com testCases inválidos', 'geminiService', tcParsed);
        throw new Error('Resposta da IA com estrutura inválida (testCases).');
      }
      const testCases = this.mapTestCasesFromResponse(tcParsed.testCases, strategy, baseTs);

      return { strategy, testCases, bddScenarios: bddOut };
    } catch (error) {
      if (
        (isGeminiRateLimitOrQuotaError(error) || isGeminiTemporaryServiceError(error)) &&
        isOpenAIEnvApiKeyConfigured()
      ) {
        logger.warn(
          'generateTestCasesForTask: Gemini com limite/cota ou serviço temporariamente indisponível; usando OpenAI (VITE_OPENAI_API_KEY) como fallback',
          'GeminiService'
        );
        return fallbackOpenAI();
      }
      logger.error('Erro ao gerar casos de teste', 'geminiService', error);
      throw error;
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
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
      });

      const markdownText = response.text;
      const html = marked(markdownText) as string;
      return sanitizeHTML(html);
    } catch (error) {
      if (
        (isGeminiRateLimitOrQuotaError(error) || isGeminiTemporaryServiceError(error)) &&
        isOpenAIEnvApiKeyConfigured()
      ) {
        logger.warn(
          'analyzeDocumentContent: Gemini com limite/cota ou serviço temporariamente indisponível; usando OpenAI como fallback',
          'GeminiService'
        );
        return new OpenAIService().analyzeDocumentContent(content, project);
      }
      logger.error('Erro ao analisar documento', 'geminiService', error);
      throw error;
    }
  }

  async generateTaskFromDocument(
    documentContent: string,
    project?: Project | null
  ): Promise<{
    task: Omit<
      JiraTask,
      'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'
    >;
    strategy: TestStrategy[];
    testCases: TestCase[];
  }> {
    const documentContext = await getFormattedContext(project || null);
    const prompt = `${documentContext}
    Aja como um Product Owner e um Analista de QA Sênior. A partir do documento de requisitos fornecido, gere um objeto JSON estruturado.

    O JSON deve ter três chaves principais: "taskDetails", "strategy" e "testCases".

    1.  **taskDetails**: Um objeto contendo:
        *   **title**: Um título claro e conciso para uma tarefa do tipo "História", resumindo o principal requisito do documento.
        *   **description**: Uma descrição detalhada no formato de história de usuário ("Como um [tipo de usuário], eu quero [objetivo] para que [benefício]").
        *   **type**: O valor deve ser sempre "História".

    2.  **strategy**: A mesma estrutura da função generateTestCasesForTask. Uma lista de estratégias de teste recomendadas.

    3.  **testCases**: Deve ser sempre um array vazio [], pois tarefas do tipo "História" não devem ter casos de teste. Apenas estratégias de teste são necessárias.

    Conteúdo do Documento:
    ---
    ${documentContent}
    ---
    `;

    const taskFromDocSchema = {
      type: Type.OBJECT,
      properties: {
        taskDetails: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['História'] },
          },
          required: ['title', 'description', 'type'],
        },
        ...testCaseGenerationSchema.properties,
      },
      required: ['taskDetails', 'strategy', 'testCases'],
    };

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: taskFromDocSchema,
        },
      });

      const parsedResponse = parseAiJsonText(response.text) as {
        taskDetails?: Record<string, unknown>;
        strategy?: unknown;
      };

      // Histórias não devem ter casos de teste, apenas estratégias
      const testCases: TestCase[] = [];

      const strategy = this.mapStrategyFromResponse(
        Array.isArray(parsedResponse.strategy) ? parsedResponse.strategy : []
      );

      return {
        task: {
          ...(parsedResponse.taskDetails ?? {}),
          testCases: [],
          testStrategy: [],
          owner: 'Product',
          assignee: 'QA',
        } as unknown as Omit<
          JiraTask,
          'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'
        >,
        strategy,
        testCases,
      };
    } catch (error) {
      logger.error('Erro ao gerar tarefa a partir do documento', 'geminiService', error);
      // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
      throw error;
    }
  }

  async generateProjectLifecyclePlan(
    projectName: string,
    projectDescription: string,
    tasks: JiraTask[],
    project?: Project | null
  ): Promise<{ [key in PhaseName]?: { summary: string; testTypes: string[] } }> {
    const documentContext = await getFormattedContext(project || null);
    const taskSummaries = tasks
      .map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`)
      .join('\n');
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
    `;

    const phaseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        testTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['summary', 'testTypes'],
    };

    const lifecycleResponseSchema = {
      type: Type.OBJECT,
      properties: {
        Request: phaseSchema,
        Analysis: phaseSchema,
        Design: phaseSchema,
        'Analysis and Code': phaseSchema,
        Build: phaseSchema,
        Test: phaseSchema,
        Release: phaseSchema,
        Deploy: phaseSchema,
        Operate: phaseSchema,
        Monitor: phaseSchema,
      },
    };

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: lifecycleResponseSchema,
        },
      });
      return parseAiJsonText(response.text) as {
        [key in PhaseName]?: { summary: string; testTypes: string[] };
      };
    } catch (error) {
      logger.error('Erro ao gerar plano de ciclo de vida do projeto', 'geminiService', error);
      // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
      throw error;
    }
  }

  async generateShiftLeftAnalysis(
    projectName: string,
    projectDescription: string,
    tasks: JiraTask[],
    project?: Project | null
  ): Promise<ShiftLeftAnalysis> {
    const documentContext = await getFormattedContext(project || null);
    const taskSummaries = tasks
      .map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`)
      .join('\n');
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
    `;

    const shiftLeftSchema = {
      type: Type.OBJECT,
      properties: {
        recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING, enum: ['Analysis', 'Design', 'Analysis and Code'] },
              recommendation: { type: Type.STRING },
            },
            required: ['phase', 'recommendation'],
          },
        },
      },
      required: ['recommendations'],
    };

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: shiftLeftSchema,
        },
      });
      return parseAiJsonText(response.text) as ShiftLeftAnalysis;
    } catch (error) {
      logger.error('Erro ao gerar análise Shift Left', 'geminiService', error);
      // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
      throw error;
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

Regras:
- Palavras-chave somente em português: Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas.
- Não use Given, When, Then, Feature, Scenario em inglês. Um passo por linha.
- Cobrir: caminho feliz; alternativas válidas; exceções/erros; permissões apenas se fizer sentido na descrição.

═══════════════════════════════════════════════════════════════
TAREFA (prioridade máxima)
═══════════════════════════════════════════════════════════════
Título: ${title}
Descrição: ${description}
${att}
${doc}

Responda somente com JSON válido: {"scenarios":[{"title":"","gherkin":""},...]}.
`.trim();

    const bddSchema = {
      type: Type.OBJECT,
      properties: {
        scenarios: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              gherkin: { type: Type.STRING },
            },
            required: ['title', 'gherkin'],
          },
        },
      },
      required: ['scenarios'],
    };

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: bddSchema,
        },
      });
      const parsedResponse = parseAiJsonText<{ scenarios?: unknown }>(response.text);

      if (!parsedResponse || !Array.isArray(parsedResponse.scenarios)) {
        throw new Error('Resposta da IA com estrutura inválida para cenários BDD.');
      }

      return this.mapBddFromResponse(parsedResponse.scenarios, Date.now());
    } catch (error) {
      if (
        (isGeminiRateLimitOrQuotaError(error) || isGeminiTemporaryServiceError(error)) &&
        isOpenAIEnvApiKeyConfigured()
      ) {
        logger.warn(
          'generateBddScenarios: Gemini com limite/cota ou serviço temporariamente indisponível; usando OpenAI como fallback',
          'GeminiService'
        );
        return new OpenAIService().generateBddScenarios(
          title,
          description,
          project,
          task,
          attachmentsContext
        );
      }
      logger.error('Erro ao gerar cenários BDD', 'geminiService', error);
      throw error;
    }
  }

  async generateTestPyramidAnalysis(
    projectName: string,
    projectDescription: string,
    tasks: JiraTask[],
    project?: Project | null
  ): Promise<TestPyramidAnalysis> {
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
    `;

    const pyramidSchema = {
      type: Type.OBJECT,
      properties: {
        distribution: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING, enum: ['Unitário', 'Integração', 'E2E'] },
              effort: { type: Type.STRING },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['level', 'effort', 'examples'],
          },
        },
      },
      required: ['distribution'],
    };

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: pyramidSchema,
        },
      });
      return parseAiJsonText(response.text) as TestPyramidAnalysis;
    } catch (error) {
      logger.error('Erro ao gerar análise Test Pyramid', 'geminiService', error);
      // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
      throw error;
    }
  }
}
