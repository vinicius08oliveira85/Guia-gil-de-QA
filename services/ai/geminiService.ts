import { GoogleGenAI, Type } from "@google/genai";
import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel, JiraTaskType } from '../../types';
import { marked } from 'marked';
import { sanitizeHTML } from '../../utils/sanitize';
import { AIService } from './aiServiceInterface';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("GEMINI_API_KEY environment variable not set. Some features may not work.");
}

const getAI = () => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY não configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY.");
  }
  return ai;
};

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
  required: ['strategy', 'testCases']
};

export class GeminiService implements AIService {
  /**
   * Constrói um prompt robusto e profissional para geração de testes como um QA Sênior
   */
  private buildRobustTestGenerationPrompt(
    title: string,
    description: string,
    bddScenarios?: BddScenario[],
    detailLevel: TestCaseDetailLevel = 'Padrão',
    taskType?: JiraTaskType
  ): string {
    const bddContext = bddScenarios && bddScenarios.length > 0
      ? `
      ════════════════════════════════════════════════════════════════
      CENÁRIOS BDD (Gherkin) - BASE PRIMÁRIA PARA TESTES
      ════════════════════════════════════════════════════════════════
      IMPORTANTE: Baseie seus testes PRIMARIAMENTE nos seguintes cenários BDD (Gherkin). 
      Eles representam os requisitos de negócio mais críticos e devem guiar a criação dos casos de teste.
      
      ${bddScenarios.map((sc, idx) => `
      [Cenário ${idx + 1}] ${sc.title}
      ${sc.gherkin}
      `).join('\n')}
      ════════════════════════════════════════════════════════════════
      `
      : '';

    const detailInstruction = `
      📋 NÍVEL DE DETALHE PARA OS PASSOS DO TESTE: ${detailLevel}
      
      - Se 'Resumido': Forneça apenas os passos essenciais de alto nível (3-5 passos).
      - Se 'Padrão': Forneça um bom equilíbrio de detalhes (5-8 passos), suficiente para um analista de QA entender o fluxo completo.
      - Se 'Detalhado': Forneça passos muito granulares e específicos (8+ passos), incluindo dados de exemplo, validações intermediárias e pré-condições explícitas.
    `;

    const shouldGenerateTestCases = taskType === 'Tarefa' || !taskType;
    const attentionMessage = !shouldGenerateTestCases 
      ? `⚠️ ATENÇÃO: Esta tarefa é do tipo "${taskType}". Para este tipo, gere APENAS estratégias de teste. NÃO gere casos de teste (testCases deve ser um array vazio []).`
      : '';

    const testCasesInstructions = shouldGenerateTestCases ? `
      ════════════════════════════════════════════════════════════════
      INSTRUÇÕES PARA GERAÇÃO DE CASOS DE TESTE
      ════════════════════════════════════════════════════════════════
      
      Gere uma lista abrangente e detalhada de casos de teste específicos. Para cada caso de teste, 
      siga rigorosamente a seguinte estrutura:
      
      1. **description**: Descrição clara, concisa e objetiva do que está sendo testado. 
         Use linguagem técnica mas acessível. Exemplo: "Validar login com credenciais válidas" 
         ao invés de "Teste de login".
      
      2. **steps**: Array de strings com passos detalhados para execução. Cada passo deve:
         - Ser acionável e verificável
         - Incluir dados específicos quando relevante (ex: "Informar email: usuario@exemplo.com")
         - Ser numerado logicamente (1, 2, 3...)
         - Incluir validações intermediárias quando necessário
         - Seguir o nível de detalhe especificado (${detailLevel})
      
      3. **expectedResult**: Resultado esperado após a execução dos passos. Deve ser:
         - Específico e mensurável
         - Incluir valores, mensagens ou comportamentos esperados
         - Considerar diferentes cenários (sucesso, erro, edge cases)
         - Exemplo: "Sistema deve exibir mensagem 'Login realizado com sucesso' e redirecionar para /dashboard"
      
      4. **preconditions**: Pré-condições necessárias para executar este teste. Inclua:
         - Dados que devem existir no sistema (ex: "Usuário cadastrado com email usuario@exemplo.com")
         - Estados prévios do sistema (ex: "Sessão anterior deve estar encerrada")
         - Configurações necessárias (ex: "Ambiente de teste configurado com dados de homologação")
         - Permissões ou roles necessárias (ex: "Usuário deve ter permissão de administrador")
         - Deixe vazio ou omita apenas se NÃO houver pré-condições específicas
      
      5. **strategies**: Array de strings contendo os 'testType's da seção de estratégia que se aplicam 
         a este caso de teste. Um caso pode ter múltiplas estratégias (ex: ["Teste Funcional", "Teste de Regressão"]).
      
      6. **isAutomated**: Boolean indicando se o teste é candidato para automação.
         - true: Teste repetitivo, crítico, de regressão, baseado em dados, ou que será executado frequentemente
         - false: Teste exploratório, de usabilidade, ad-hoc, ou que requer análise humana
      
      7. **testSuite**: Nome da suite de teste à qual este caso pertence. Baseie-se no contexto da tarefa 
         e funcionalidade testada. Exemplos: "Login", "Cadastro", "Pagamento", "Relatórios", "Dashboard", 
         "Configurações", "Perfil do Usuário".
      
      8. **testEnvironment**: Ambiente(s) de teste onde este caso deve ser executado. Pode incluir:
         - Navegadores: "Chrome", "Firefox", "Safari", "Edge"
         - Dispositivos: "Mobile", "Tablet", "Desktop"
         - Ambientes: "API", "Web", "Mobile App"
         - Para múltiplos ambientes, separe por " / " (ex: "Chrome / Firefox / Mobile")
      
      9. **priority**: Prioridade do caso de teste baseada em:
         - **Urgente**: Testes críticos que validam funcionalidades essenciais do negócio, 
           que podem causar impacto grave se falharem (ex: pagamento, autenticação, segurança)
         - **Alta**: Testes importantes que validam funcionalidades principais, 
           com impacto significativo se falharem (ex: fluxos principais, integrações críticas)
         - **Média**: Testes que validam funcionalidades secundárias ou melhorias, 
           com impacto moderado se falharem (ex: relatórios, configurações, validações)
         - **Baixa**: Testes que validam funcionalidades de baixa criticidade, 
           melhorias cosméticas ou edge cases raros (ex: formatação, textos, validações opcionais)
         
         Considere: criticidade da funcionalidade, impacto no negócio, frequência de uso, 
         complexidade do teste e risco de falha.
      ` : '';

    return `
      Você é um QA Sênior com mais de 10 anos de experiência em garantia de qualidade de software, 
      metodologias ágeis (Scrum, Kanban), e práticas de DevOps. Sua expertise inclui:
      - Testes funcionais, de integração, regressão, performance e segurança
      - BDD (Behavior-Driven Development) e TDD (Test-Driven Development)
      - Automação de testes com ferramentas modernas
      - Análise de risco e priorização de testes
      - Cobertura de testes e métricas de qualidade

      ════════════════════════════════════════════════════════════════
      CONTEXTO DA TAREFA
      ════════════════════════════════════════════════════════════════
      
      Título: ${title}
      Descrição: ${description}
      ${taskType ? `Tipo: ${taskType}` : ''}
      
      ${bddContext}
      
      ${detailInstruction}

      ════════════════════════════════════════════════════════════════
      INSTRUÇÕES PARA GERAÇÃO DE ESTRATÉGIAS DE TESTE
      ════════════════════════════════════════════════════════════════
      
      Gere uma lista abrangente de estratégias de teste recomendadas. Para cada estratégia, forneça:
      
      1. **testType**: Nome específico do tipo de teste (ex: "Teste Funcional", "Teste de Integração", 
         "Teste de Regressão", "Teste de Usabilidade", "Teste de Performance", "Teste de Segurança", 
         "Teste de Acessibilidade", "Teste de API", "Teste de Caixa Branca", etc.)
      
      2. **description**: Explicação clara e objetiva do propósito desta estratégia no contexto específico 
         da tarefa. Explique POR QUE este tipo de teste é necessário e QUAIS riscos ele mitiga.
      
      3. **howToExecute**: Array de strings com passos acionáveis e práticos para executar este tipo de teste. 
         Cada passo deve ser claro, específico e executável por um QA.
      
      4. **tools**: Ferramentas recomendadas para este tipo de teste, separadas por vírgulas. 
         Considere ferramentas modernas e amplamente utilizadas (ex: "Selenium, Cypress, Playwright" 
         para testes web, "Postman, Insomnia" para APIs, "JMeter, K6" para performance).

      ${testCasesInstructions}
      
      ════════════════════════════════════════════════════════════════
      BOAS PRÁTICAS E CONSIDERAÇÕES
      ════════════════════════════════════════════════════════════════
      
      - Cobertura: Garanta cobertura de casos de sucesso, falha, edge cases e validações
      - Clareza: Cada caso de teste deve ser compreensível e executável por qualquer QA
      - Rastreabilidade: Relacione casos de teste com os cenários BDD quando disponíveis
      - Priorização: Priorize testes críticos e de alto impacto
      - Reutilização: Considere pré-condições que podem ser reutilizadas entre testes
      - Manutenibilidade: Use descrições e passos que facilitem a manutenção futura
      - Automação: Identifique claramente quais testes são candidatos à automação
      
      ════════════════════════════════════════════════════════════════
      FORMATO DE RESPOSTA
      ════════════════════════════════════════════════════════════════
      
      Retorne APENAS um objeto JSON válido com a seguinte estrutura:
      {
        "strategy": [...],
        "testCases": ${shouldGenerateTestCases ? '[...]' : '[]'}
      }
      
      ${attentionMessage}
      
      IMPORTANTE: 
      - Retorne APENAS JSON válido, sem markdown, sem código, sem explicações adicionais
      - Todos os campos obrigatórios devem estar presentes
      - Valores devem ser apropriados e realistas
      - Use português brasileiro em todas as descrições
    `;
  }

  async generateTestCasesForTask(
    title: string, 
    description: string, 
    bddScenarios?: BddScenario[], 
    detailLevel: TestCaseDetailLevel = 'Padrão',
    taskType?: JiraTaskType
  ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[] }> {
    const prompt = this.buildRobustTestGenerationPrompt(title, description, bddScenarios, detailLevel, taskType);

    try {
      const response = await getAI().models.generateContent({
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

      const shouldGenerateTestCases = taskType === 'Tarefa' || !taskType;
      const testCases: TestCase[] = shouldGenerateTestCases 
        ? (parsedResponse.testCases || []).map((item: any, index: number) => ({
            id: `tc-${Date.now()}-${index}`,
            description: item.description,
            steps: item.steps,
            expectedResult: item.expectedResult,
            status: 'Not Run' as const,
            strategies: item.strategies || [],
            isAutomated: item.isAutomated || false,
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

      return { strategy, testCases };
    } catch (error) {
      console.error("Error generating test cases:", error);
      throw new Error("Failed to communicate with the Gemini API.");
    }
  }

  async analyzeDocumentContent(content: string): Promise<string> {
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
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const markdownText = response.text;
        const html = marked(markdownText) as string;
        return sanitizeHTML(html);
    } catch (error) {
        console.error("Error analyzing document:", error);
        throw new Error("Failed to communicate with the Gemini API for document analysis.");
    }
  }

  async generateTaskFromDocument(documentContent: string): Promise<{ task: Omit<JiraTask, 'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'>, strategy: TestStrategy[], testCases: TestCase[] }> {
    const prompt = `
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
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
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
        console.error("Error generating task from document:", error);
        throw new Error("Failed to generate task from document.");
    }
  }

  async generateProjectLifecyclePlan(projectName: string, projectDescription: string, tasks: JiraTask[]): Promise<{ [key in PhaseName]?: { summary: string, testTypes: string[] } }> {
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
        const response = await getAI().models.generateContent({
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
  }

  async generateShiftLeftAnalysis(projectName: string, projectDescription: string, tasks: JiraTask[]): Promise<ShiftLeftAnalysis> {
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
        const response = await getAI().models.generateContent({
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
  }

  async generateBddScenarios(title: string, description: string): Promise<BddScenario[]> {
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
        const response = await getAI().models.generateContent({
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
  }

  async generateTestPyramidAnalysis(projectName: string, projectDescription: string, tasks: JiraTask[]): Promise<TestPyramidAnalysis> {
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
        const response = await getAI().models.generateContent({
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
  }
}

