import { Type } from "@google/genai";
import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel, JiraTaskType, Project } from '../../types';
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

const testCaseGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    strategy: {
      type: Type.ARRAY,
      description: "Uma lista de estratégias de teste recomendadas para a tarefa.",
      items: {
        type: Type.OBJECT,
        properties: {
          testType: { type: Type.STRING, description: "O nome do tipo de teste (ex: Teste Funcional, Teste de Integração, Teste de Caixa Branca)." },
          description: { type: Type.STRING, description: "Uma breve explicação do propósito deste teste no contexto da tarefa." },
          howToExecute: {
            type: Type.ARRAY,
            description: "Um array de strings, onde cada string é um passo curto e acionável para executar o teste.",
            items: { type: Type.STRING }
          },
          tools: { type: Type.STRING, description: "Ferramentas recomendadas para este tipo de teste, separadas por vírgula (ex: Selenium, Postman, JMeter)." }
        },
        required: ['testType', 'description', 'howToExecute', 'tools']
      }
    },
    bddScenarios: {
      type: Type.ARRAY,
      description: "Uma lista de cenários BDD (Behavior-Driven Development) usando a sintaxe Gherkin.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Um título descritivo para o cenário."
          },
          gherkin: {
            type: Type.STRING,
            description:
              'Cenário Gherkin em português: use SOMENTE as palavras-chave Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas — em português, sem Given/When/Then em inglês. Cada passo em linha própria.',
          },
        },
        required: ['title', 'gherkin']
      }
    },
    testCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: 'A concise description of the test case.',
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: 'A list of steps to perform to execute the test.',
          },
          expectedResult: {
            type: Type.STRING,
            description: 'The expected outcome after performing the steps.',
          },
          strategies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of test types from the generated strategy list that apply to this specific test case (e.g., ["Teste Funcional", "Teste de Usabilidade"]).',
          },
          isAutomated: {
            type: Type.BOOLEAN,
            description: 'True se este caso de teste for um bom candidato para automação (ex: regressivo, repetitivo, baseado em dados), caso contrário, false.'
          },
          preconditions: {
            type: Type.STRING,
            description: 'Précondições necessárias para executar este teste (ex: dados que devem existir, estados do sistema, configurações). Deixe vazio se não houver précondições específicas.'
          },
          testSuite: {
            type: Type.STRING,
            description: 'Nome da suite de teste à qual este caso pertence (ex: Login, Cadastro, Pagamento). Baseie-se no contexto da tarefa e funcionalidade testada.'
          },
          testEnvironment: {
            type: Type.STRING,
            description: 'Ambiente(s) de teste onde este caso deve ser executado (ex: Chrome, Firefox, Safari, Mobile, API). Pode incluir múltiplos ambientes separados por "/" (ex: "Chrome / Firefox").'
          },
          priority: {
            type: Type.STRING,
            enum: ['Baixa', 'Média', 'Alta', 'Urgente'],
            description: 'Prioridade do caso de teste baseada em criticidade da funcionalidade, impacto no negócio, frequência de uso e risco de falha.'
          }
        },
        required: ['description', 'steps', 'expectedResult', 'strategies', 'isAutomated'],
      },
    }
  },
  required: ['strategy', 'bddScenarios', 'testCases']
};

export class GeminiService implements AIService {
  /**
   * Prompt compacto para geração de testes (sem arte ASCII; limite 7000 chars) — reduz TPM e risco de 429.
   */
  private async buildRobustTestGenerationPrompt(
    title: string,
    description: string,
    bddScenarios?: BddScenario[],
    detailLevel: TestCaseDetailLevel = 'Padrão',
    taskType?: JiraTaskType,
    project?: Project | null,
    attachmentsContext?: string
  ): Promise<string> {
    const documentContext = await getFormattedContext(project || null);

    const detailInstruction = `Passos (${detailLevel}): Resumido 3–5; Padrão 5–8; Detalhado 8+ com dados.`;

    const shouldGenerateTestCases = taskType === 'Tarefa' || taskType === 'Bug' || !taskType;
    const attentionMessage = !shouldGenerateTestCases
      ? `Tipo "${taskType}": só estratégias; testCases=[].`
      : '';

    const bddRef =
      bddScenarios && bddScenarios.length > 0
        ? `BDD ref: ${bddScenarios
            .map((b) => `${b.title}:${(b.gherkin || '').slice(0, 320)}`)
            .join(' | ')
            .slice(0, 1800)}`
        : '';

    const testCasesInstructions = shouldGenerateTestCases
      ? `Casos: description, steps[], expectedResult, preconditions, strategies[], isAutomated, testSuite, testEnvironment, priority (Baixa|Média|Alta|Urgente). Sucesso, alternativas, negative, permissão.`
      : '';

    const bugBlock =
      taskType === 'Bug'
        ? 'Bug: regressão, verificação da correção, impactos; BDD pós-correção.'
        : '';

    const rawPrompt = `${documentContext}
QA sênior. PT-BR. Modelo da chamada: ${GEMINI_DEFAULT_MODEL}.

TAREFA: ${title}
DESC: ${description}
${taskType ? `TIPO: ${taskType}` : ''}
${bddRef}
${attachmentsContext ? `ANEXOS: ${attachmentsContext}` : ''}
${bugBlock}
${detailInstruction}
${attentionMessage}

(1) strategy: {testType, description, howToExecute[], tools}[]
(2) ${testCasesInstructions || 'só strategy'}
(3) bddScenarios: Gherkin PT (Funcionalidade,Cenário,Dado,Quando,Então,E,Mas); sem Given/When/Then; happy+alt+erro+permissão se couber.

Saída: só JSON válido, sem markdown. Estrutura {"strategy":[...],"bddScenarios":[{"title":"","gherkin":""}],"testCases":${shouldGenerateTestCases ? '[...]' : '[]'}} — schema da API define campos obrigatórios.
`;

    /** Reduz TPM no tier gratuito. */
    const MAX_PROMPT_LENGTH = 7000;
    return rawPrompt.length > MAX_PROMPT_LENGTH
      ? rawPrompt.slice(0, MAX_PROMPT_LENGTH) + '\n\n[... contexto truncado ...]'
      : rawPrompt;
  }

  async generateTestCasesForTask(
    title: string, 
    description: string, 
    bddScenarios?: BddScenario[],
    detailLevel: TestCaseDetailLevel = 'Padrão',
    taskType?: JiraTaskType,
    project?: Project | null,
    attachmentsContext?: string
  ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[]; bddScenarios: BddScenario[] }> {
    const prompt = await this.buildRobustTestGenerationPrompt(title, description, bddScenarios, detailLevel, taskType, project, attachmentsContext);

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: testCaseGenerationSchema,
        },
      });

      const jsonString = response.text.trim();
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse || !Array.isArray(parsedResponse.strategy) || !Array.isArray(parsedResponse.testCases) || !Array.isArray(parsedResponse.bddScenarios)) {
          logger.error("Resposta da IA com estrutura inválida", 'geminiService', parsedResponse);
          throw new Error("Resposta da IA com estrutura inválida.");
      }

      const shouldGenerateTestCases = taskType === 'Tarefa' || taskType === 'Bug' || !taskType;
      const testCases: TestCase[] = shouldGenerateTestCases 
        ? (parsedResponse.testCases || []).map((item: any, index: number) => ({
            id: `tc-${Date.now()}-${index}`,
            description: item.description,
            steps: item.steps,
            expectedResult: item.expectedResult,
            status: 'Not Run' as const,
            strategies: item.strategies || [],
            isAutomated: false,
            preconditions: item.preconditions || undefined,
            testSuite: item.testSuite || undefined,
            testEnvironment: item.testEnvironment || undefined,
            priority: item.priority || undefined,
          }))
        : [];
      
      const strategy: TestStrategy[] = parsedResponse.strategy.map((item: any) => ({
        testType: item.testType,
        description: item.description,
        howToExecute: item.howToExecute,
        tools: item.tools,
      }));

      const bddScenarios: BddScenario[] = (parsedResponse.bddScenarios || []).map((item: any, index: number) => ({
        id: `bdd-${Date.now()}-${index}`,
        title: item.title,
        gherkin: item.gherkin,
      }));

      return { strategy, testCases, bddScenarios };
    } catch (error) {
      if (
        (isGeminiRateLimitOrQuotaError(error) || isGeminiTemporaryServiceError(error)) &&
        isOpenAIEnvApiKeyConfigured()
      ) {
        logger.warn(
          'generateTestCasesForTask: Gemini com limite/cota ou serviço temporariamente indisponível; usando OpenAI (VITE_OPENAI_API_KEY) como fallback',
          'GeminiService'
        );
        return new OpenAIService().generateTestCasesForTask(
          title,
          description,
          bddScenarios,
          detailLevel,
          taskType,
          project,
          attachmentsContext
        );
      }
      logger.error("Erro ao gerar casos de teste", 'geminiService', error);
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
        logger.error("Erro ao analisar documento", 'geminiService', error);
        throw error;
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
                    type: { type: Type.STRING, enum: ['História'] }
                },
                required: ['title', 'description', 'type']
            },
            ...testCaseGenerationSchema.properties
        },
        required: ['taskDetails', 'strategy', 'testCases']
    };

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskFromDocSchema,
            },
        });

        const parsedResponse = JSON.parse(response.text.trim());
        
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
        logger.error("Erro ao gerar tarefa a partir do documento", 'geminiService', error);
        // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
        throw error;
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
    `;

    const phaseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        testTypes: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['summary', 'testTypes']
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
                responseMimeType: "application/json",
                responseSchema: lifecycleResponseSchema,
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        logger.error("Erro ao gerar plano de ciclo de vida do projeto", 'geminiService', error);
        // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
        throw error;
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
                        recommendation: { type: Type.STRING }
                    },
                    required: ['phase', 'recommendation']
                }
            }
        },
        required: ['recommendations']
    };

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: shiftLeftSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text.trim());
        return parsedResponse;
    } catch (error) {
        logger.error("Erro ao gerar análise Shift Left", 'geminiService', error);
        // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
        throw error;
    }
  }

  async generateBddScenarios(title: string, description: string, project?: Project | null, attachmentsContext?: string): Promise<BddScenario[]> {
    const documentContext = await getFormattedContext(project || null);
    const prompt = `${documentContext}
    Aja como um especialista em BDD. Gere cenários em Gherkin **somente em português**, usando estritamente as palavras-chave:
    Funcionalidade, Cenário (ou Esquema do Cenário), Dado, Quando, Então, E, Mas.
    Não use Given, When, Then, Feature, Scenario em inglês. Um passo por linha; Dado/Quando/Então com uso correto.

    Cobrir: caminho feliz; alternativas válidas; exceções/erros (negative testing); e, se fizer sentido, permissões/negação de acesso.

    Título da Tarefa: ${title}
    Descrição: ${description}
    ${attachmentsContext ? `
    Anexos da tarefa (considere para enriquecer os cenários):
    ${attachmentsContext}
    ` : ''}

    Sua resposta DEVE ser um objeto JSON com uma única chave "scenarios".
    "scenarios" deve ser um array de objetos, onde cada objeto tem duas chaves:
    1. "title": Um título descritivo para o cenário.
    2. "gherkin": Texto Gherkin completo em português, apenas palavras-chave Funcionalidade, Cenário, Dado, Quando, Então, E, Mas (sem keywords em inglês).
    `;

    const bddSchema = {
        type: Type.OBJECT,
        properties: {
            scenarios: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        gherkin: { type: Type.STRING }
                    },
                    required: ['title', 'gherkin']
                }
            }
        },
        required: ['scenarios']
    };

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: bddSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text.trim());
        
        if (!parsedResponse || !Array.isArray(parsedResponse.scenarios)) {
            throw new Error("Resposta da IA com estrutura inválida para cenários BDD.");
        }

        return parsedResponse.scenarios.map((sc: any, index: number) => ({
            ...sc,
            id: `bdd-${Date.now()}-${index}`,
        }));
    } catch (error) {
        if (
          (isGeminiRateLimitOrQuotaError(error) || isGeminiTemporaryServiceError(error)) &&
          isOpenAIEnvApiKeyConfigured()
        ) {
          logger.warn(
            'generateBddScenarios: Gemini com limite/cota ou serviço temporariamente indisponível; usando OpenAI como fallback',
            'GeminiService'
          );
          return new OpenAIService().generateBddScenarios(title, description, project, attachmentsContext);
        }
        logger.error("Erro ao gerar cenários BDD", 'geminiService', error);
        throw error;
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
                        examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['level', 'effort', 'examples']
                }
            }
        },
        required: ['distribution']
    };

     try {
        const response = await callGeminiWithRetry({
            model: GEMINI_DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: pyramidSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text.trim());
        return parsedResponse;
    } catch (error) {
        logger.error("Erro ao gerar análise Test Pyramid", 'geminiService', error);
        // Preservar erro original do callGeminiWithRetry que contém informações detalhadas (status, code, message)
        throw error;
    }
  }
}
