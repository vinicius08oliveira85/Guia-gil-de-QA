import OpenAI from 'openai';
import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel } from '../../types';
import { marked } from 'marked';
import { sanitizeHTML } from '../../utils/sanitize';
import { AIService } from './aiServiceInterface';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

// Verificar se há alguma chave de IA disponível (OpenAI ou Gemini)
const hasAnyAIKey = () => {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  return !!(openaiKey || geminiKey);
};

let openai: OpenAI | null = null;

if (API_KEY) {
  openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true // Necessário para uso no browser
  });
} else {
  // Só mostrar aviso se não houver nenhuma chave de IA configurada
  if (!hasAnyAIKey()) {
    console.warn("OPENAI_API_KEY environment variable not set. Some features may not work.");
  }
}

const getOpenAI = () => {
  if (!openai) {
    throw new Error("OPENAI_API_KEY não configurada. Por favor, configure a variável de ambiente VITE_OPENAI_API_KEY.");
  }
  return openai;
};

export class OpenAIService implements AIService {
  private async callAPI(prompt: string, responseFormat: { type: 'json_object' } | null = null): Promise<string> {
    const client = getOpenAI();
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // ou "gpt-4" para melhor qualidade
      messages: [
        {
          role: "system",
          content: "Você é um especialista em garantia de qualidade de software (QA) e análise de projetos. Sempre responda em português brasileiro."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: responseFormat,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da API OpenAI");
    }
    return content;
  }

  async generateTestCasesForTask(title: string, description: string, bddScenarios?: BddScenario[], detailLevel: TestCaseDetailLevel = 'Padrão'): Promise<{ strategy: TestStrategy[]; testCases: TestCase[] }> {
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
          *   **preconditions**: Précondições necessárias para executar este teste (ex: dados que devem existir no sistema, estados prévios, configurações). Deixe vazio ou omita se não houver précondições específicas.
          *   **testSuite**: Nome da suite de teste à qual este caso pertence, baseado no contexto da tarefa e funcionalidade testada (ex: "Login", "Cadastro", "Pagamento", "Relatórios").
          *   **testEnvironment**: Ambiente(s) de teste onde este caso deve ser executado (ex: "Chrome", "Firefox", "Safari", "Mobile", "API"). Pode incluir múltiplos ambientes separados por " / " (ex: "Chrome / Firefox").

      Título da Tarefa: ${title}
      Descrição da Tarefa: ${description}

      IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
      const jsonString = await this.callAPI(prompt, { type: 'json_object' });
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse || !Array.isArray(parsedResponse.strategy) || !Array.isArray(parsedResponse.testCases)) {
          console.error("Invalid response structure from OpenAI:", parsedResponse);
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
        preconditions: item.preconditions || undefined,
        testSuite: item.testSuite || undefined,
        testEnvironment: item.testEnvironment || undefined,
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
      throw new Error("Failed to communicate with the OpenAI API.");
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
        const markdownText = await this.callAPI(prompt);
        const html = marked(markdownText) as string;
        return sanitizeHTML(html);
    } catch (error) {
        console.error("Error analyzing document:", error);
        throw new Error("Failed to communicate with the OpenAI API for document analysis.");
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

    2.  **strategy**: Uma lista de estratégias de teste recomendadas. Para cada estratégia, especifique testType, description, howToExecute (array de strings), e tools (string).

    3.  **testCases**: Uma lista abrangente de casos de teste derivados dos requisitos do documento. Cada caso deve ter: description, steps (array), expectedResult, strategies (array de strings), e isAutomated (boolean).

    Conteúdo do Documento:
    ---
    ${documentContent}
    ---

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        const parsedResponse = JSON.parse(jsonString);
        
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

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating project lifecycle plan:", error);
        throw new Error("Failed to communicate with the OpenAI API for project planning.");
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

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse;
    } catch (error) {
        console.error("Error generating Shift Left analysis:", error);
        throw new Error("Failed to communicate with the OpenAI API for Shift Left analysis.");
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

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

    try {
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        const parsedResponse = JSON.parse(jsonString);
        
        if (!parsedResponse || !Array.isArray(parsedResponse.scenarios)) {
            throw new Error("Resposta da IA com estrutura inválida para cenários BDD.");
        }

        return parsedResponse.scenarios.map((sc: any, index: number) => ({
            ...sc,
            id: `bdd-${Date.now()}-${index}`,
        }));
    } catch (error) {
        console.error("Error generating BDD scenarios:", error);
        throw new Error("Falha ao comunicar com a API OpenAI para gerar cenários BDD.");
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

    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais.
    `;

     try {
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse;
    } catch (error) {
        console.error("Error generating Test Pyramid analysis:", error);
        throw new Error("Failed to communicate with the OpenAI API for Test Pyramid analysis.");
    }
  }
}

