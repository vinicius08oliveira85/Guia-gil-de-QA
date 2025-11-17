
import { GoogleGenAI, Type } from "@google/genai";
import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel } from '../types';
import { marked } from 'marked';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
          }
        },
        required: ['description', 'steps', 'expectedResult', 'strategies', 'isAutomated'],
      },
    }
  },
  required: ['strategy', 'testCases']
};


export const generateTestCasesForTask = async (title: string, description: string, bddScenarios?: BddScenario[], detailLevel: TestCaseDetailLevel = 'Padrão'): Promise<{ strategy: TestStrategy[]; testCases: TestCase[] }> => {
  const bddContext = bddScenarios && bddScenarios.length > 0
    ? `
    IMPORTANTE: Baseie seus testes PRIMARIAMENTE nos seguintes cenários BDD (Gherkin). Eles representam os requisitos de negócio mais críticos e devem guiar a criação dos casos de teste.
    --- INÍCIO DOS CENÁRIOS BDD ---
    ${bddScenarios.map(sc => `Cenário: ${sc.title}\n${sc.gherkin}`).join('\n\n')}
    --- FIM DOS CENÁRIOS BDD ---
    `
    : '';

  const detailInstruction = `
    **Nível de Detalhe para os Passos do Teste:** Para a chave "steps" em cada caso de teste, siga este nível de detalhe: ${detailLevel}.
    - Se 'Resumido', forneça apenas os passos essenciais de alto nível.
    - Se 'Padrão', forneça um bom equilíbrio de detalhes, suficiente para um analista de QA entender o fluxo.
    - Se 'Detalhado', forneça passos muito granulares e específicos, incluindo dados de exemplo e pré-condições, se aplicável.
  `;

  const prompt = `
    Aja como um mentor de garantia de qualidade de software (QA) de nível sênior. Para a tarefa a seguir, forneça uma resposta estruturada em JSON:
    ${bddContext}
    ${detailInstruction}

    1.  **strategy**: Uma lista de estratégias de teste recomendadas. Para cada estratégia, especifique:
        *   **testType**: O nome do tipo de teste (ex: Teste Funcional, Teste de Integração, Teste de Caixa Branca, Teste de Usabilidade).
        *   **description**: Uma breve explicação do propósito deste teste no contexto da tarefa.
        *   **howToExecute**: Um array de strings, onde cada string é um passo curto e acionável para executar o teste.
        *   **tools**: Ferramentas recomendadas para este tipo de teste, listadas como uma string separada por vírgulas.

    2.  **testCases**: Uma lista abrangente de casos de teste específicos. Para cada caso de teste, inclua:
        *   **description**: Uma descrição concisa.
        *   **steps**: Passos detalhados para execução.
        *   **expectedResult**: O resultado esperado.
        *   **strategies**: Uma lista de strings contendo os 'testType's da seção de estratégia acima que se aplicam a este caso de teste.
        *   **isAutomated**: true se o teste for um bom candidato para automação (repetitivo, crítico, de regressão), false caso contrário (ex: exploratório, usabilidade).

    Título da Tarefa: ${title}
    Descrição da Tarefa: ${description}
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: testCaseGenerationSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString);

    if (!parsedResponse || !Array.isArray(parsedResponse.strategy) || !Array.isArray(parsedResponse.testCases)) {
        console.error("Invalid response structure from Gemini:", parsedResponse);
        throw new Error("Resposta da IA com estrutura inválida.");
    }

    const testCases: TestCase[] = parsedResponse.testCases.map((item: any, index: number) => ({
      id: `tc-${Date.now()}-${index}`,
      description: item.description,
      steps: item.steps,
      expectedResult: item.expectedResult,
      status: 'Not Run' as const,
      strategies: item.strategies || [],
      isAutomated: item.isAutomated || false,
    }));
    
    const strategy: TestStrategy[] = parsedResponse.strategy.map((item: any) => ({
      testType: item.testType,
      description: item.description,
      howToExecute: item.howToExecute,
      tools: item.tools,
    }));


    return { strategy, testCases };
  } catch (error) {
    console.error("Error generating test cases:", error);
    throw new Error("Failed to communicate with the Gemini API.");
  }
};


export const analyzeDocumentContent = async (content: string): Promise<string> => {
    const prompt = `
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const markdownText = response.text;
        return marked(markdownText) as string;
    } catch (error) {
        console.error("Error analyzing document:", error);
        throw new Error("Failed to communicate with the Gemini API for document analysis.");
    }
}

export const generateTaskFromDocument = async (documentContent: string): Promise<{ task: Omit<JiraTask, 'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'>, strategy: TestStrategy[], testCases: TestCase[] }> => {
    const prompt = `
    Aja como um Product Owner e um Analista de QA Sênior. A partir do documento de requisitos fornecido, gere um objeto JSON estruturado.

    O JSON deve ter três chaves principais: "taskDetails", "strategy" e "testCases".

    1.  **taskDetails**: Um objeto contendo:
        *   **title**: Um título claro e conciso para uma tarefa do tipo "História", resumindo o principal requisito do documento.
        *   **description**: Uma descrição detalhada no formato de história de usuário ("Como um [tipo de usuário], eu quero [objetivo] para que [benefício]").
        *   **type**: O valor deve ser sempre "História".

    2.  **strategy**: A mesma estrutura da função generateTestCasesForTask. Uma lista de estratégias de teste recomendadas.

    3.  **testCases**: A mesma estrutura da função generateTestCasesForTask. Uma lista abrangente de casos de teste derivados dos requisitos do documento, incluindo a chave "isAutomated".

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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskFromDocSchema,
            },
        });

        const parsedResponse = JSON.parse(response.text.trim());
        
        const testCases: TestCase[] = parsedResponse.testCases.map((item: any, index: number) => ({
          id: `tc-doc-${Date.now()}-${index}`,
          ...item,
          status: 'Not Run' as const,
          isAutomated: item.isAutomated || false,
        }));
        
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
        console.error("Error generating task from document:", error);
        throw new Error("Failed to generate task from document.");
    }
};

export const generateProjectLifecyclePlan = async (projectName: string, projectDescription: string, tasks: JiraTask[]): Promise<{ [key in PhaseName]?: { summary: string, testTypes: string[] } }> => {
    const taskSummaries = tasks.map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`).join('\n');
    const prompt = `
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: lifecycleResponseSchema,
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating project lifecycle plan:", error);
        throw new Error("Failed to communicate with the Gemini API for project planning.");
    }
};

export const generateShiftLeftAnalysis = async (projectName: string, projectDescription: string, tasks: JiraTask[]): Promise<ShiftLeftAnalysis> => {
    const taskSummaries = tasks.map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`).join('\n');
    const prompt = `
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: shiftLeftSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text.trim());
        return parsedResponse;
    } catch (error) {
        console.error("Error generating Shift Left analysis:", error);
        throw new Error("Failed to communicate with the Gemini API for Shift Left analysis.");
    }
};

export const generateBddScenarios = async (title: string, description: string): Promise<BddScenario[]> => {
    const prompt = `
    Aja como um especialista em BDD (Behavior-Driven Development). Para a tarefa a seguir, crie cenários de comportamento usando a sintaxe Gherkin (Dado, Quando, Então).
    Foque em descrever o comportamento do sistema do ponto de vista do usuário.

    Título da Tarefa: ${title}
    Descrição: ${description}

    Sua resposta DEVE ser um objeto JSON com uma única chave "scenarios".
    "scenarios" deve ser um array de objetos, onde cada objeto tem duas chaves:
    1. "title": Um título descritivo para o cenário.
    2. "gherkin": Uma string contendo o cenário completo formatado com a sintaxe Gherkin, usando as palavras-chave em português (Dado, E, Quando, Então).
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
        console.error("Error generating BDD scenarios:", error);
        throw new Error("Falha ao comunicar com a API Gemini para gerar cenários BDD.");
    }
};

export const generateTestPyramidAnalysis = async (projectName: string, projectDescription: string, tasks: JiraTask[]): Promise<TestPyramidAnalysis> => {
    const taskSummaries = tasks.map(t => `- ${t.id} ${t.title}`).join('\n');
    const prompt = `
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: pyramidSchema,
            },
        });
        const parsedResponse = JSON.parse(response.text.trim());
        return parsedResponse;
    } catch (error) {
        console.error("Error generating Test Pyramid analysis:", error);
        throw new Error("Failed to communicate with the Gemini API for Test Pyramid analysis.");
    }
};