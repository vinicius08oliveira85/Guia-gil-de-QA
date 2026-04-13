import OpenAI from 'openai';
import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel, JiraTaskType, Project } from '../../types';
import { marked } from 'marked';
import { sanitizeHTML } from '../../utils/sanitize';
import { AIService } from './aiServiceInterface';
import { getFormattedContext } from './documentContextService';
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
  // Só mostrar aviso se não houver nenhuma chave de IA configurada
  if (!hasAnyAIKey()) {
    logger.warn("OPENAI_API_KEY environment variable not set. Some features may not work.", 'openaiService');
  }
}

const getOpenAI = () => {
  if (!openai) {
    throw new Error("OPENAI_API_KEY não configurada. Por favor, configure a variável de ambiente VITE_OPENAI_API_KEY.");
  }
  return openai;
};

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

export class OpenAIService implements AIService {
  private async callAPI(prompt: string, responseFormat?: { type: 'json_object' }): Promise<string> {
    const client = getOpenAI();

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
          temperature: 0.7,
        }),
      { isRetryable: isOpenAIRetryable, maxRetries: 3, initialDelay: 1000 }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }
    return content;
  }

  /**
   * Constrói um prompt robusto e profissional para geração de testes como um QA Sênior
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

    const detailInstruction = `
      📋 NÍVEL DE DETALHE PARA OS PASSOS DO TESTE: ${detailLevel}
      
      - Se 'Resumido': Forneça apenas os passos essenciais de alto nível (3-5 passos).
      - Se 'Padrão': Forneça um bom equilíbrio de detalhes (5-8 passos), suficiente para um analista de QA entender o fluxo completo.
      - Se 'Detalhado': Forneça passos muito granulares e específicos (8+ passos), incluindo dados de exemplo, validações intermediárias e pré-condições explícitas.
    `;

    const shouldGenerateTestCases = taskType === 'Tarefa' || taskType === 'Bug' || !taskType;
    const attentionMessage = !shouldGenerateTestCases 
      ? `⚠️ ATENÇÃO: Esta tarefa é do tipo "${taskType}". Para este tipo, gere APENAS estratégias de teste. NÃO gere casos de teste (testCases deve ser um array vazio []).`
      : '';

    const testCasesInstructions = shouldGenerateTestCases ? `
      ════════════════════════════════════════════════════════════════
      INSTRUÇÕES PARA GERAÇÃO DE CASOS DE TESTE
      ════════════════════════════════════════════════════════════════
      
      IMPORTANTE: Os casos de teste devem ser derivados DIRETAMENTE das estratégias de teste definidas anteriormente.
      
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

    return `${documentContext}
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
      ${attachmentsContext ? `
      ════════════════════════════════════════════════════════════════
      ANEXOS DA TAREFA
      ════════════════════════════════════════════════════════════════
      ${attachmentsContext}
      Considere as informações contidas ou sugeridas pelos anexos ao gerar estratégias, casos de teste e cenários BDD.
      ` : ''}
      
      ${taskType === 'Bug' ? `
      ════════════════════════════════════════════════════════════════
      CONTEXTO ESPECÍFICO PARA BUG
      ════════════════════════════════════════════════════════════════
      
      Esta é uma tarefa do tipo "Bug". Ao gerar estratégias e casos de teste, FOQUE em:
      
      1. **Testes de Verificação de Correção**: Casos de teste que validam que o bug foi corrigido
         e que o comportamento esperado agora funciona corretamente.
      
      2. **Testes de Regressão**: Casos de teste que verificam se a correção não introduziu novos bugs
         ou quebrou funcionalidades relacionadas.
      
      3. **Testes Relacionados**: Casos de teste que validam funcionalidades similares ou que podem
         ter sido afetadas pela mesma causa raiz do bug.
      
      4. **Cenários BDD**: Devem descrever o comportamento esperado APÓS a correção do bug,
         focando no comportamento correto que deve ser observado.
      
      5. **Estratégias de Teste**: Priorize estratégias como:
         - Teste de Regressão (crítico para bugs)
         - Teste de Verificação de Correção
         - Teste Funcional (para validar o comportamento correto)
         - Teste de Integração (se o bug afetou integrações)
         - Teste de Edge Cases (para evitar recorrência)
      ` : ''}
      
      ${detailInstruction}

      ════════════════════════════════════════════════════════════════
      INSTRUÇÕES PARA GERAÇÃO DE ESTRATÉGIAS DE TESTE
      ════════════════════════════════════════════════════════════════
      PRIMEIRO: Defina a Estratégia de Teste baseada no tipo da tarefa e nos riscos envolvidos.
      
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
      
      SEGUNDO: Gere os Casos de Teste baseados nessas estratégias.

      ${testCasesInstructions}

      ════════════════════════════════════════════════════════════════
      INSTRUÇÕES PARA GERAÇÃO DE CENÁRIOS BDD
      ════════════════════════════════════════════════════════════════
      TERCEIRO: Gere cenários BDD (Behavior-Driven Development) usando a sintaxe Gherkin.
      Foque em descrever o comportamento do sistema do ponto de vista do usuário.
      
      Certifique-se de cobrir:
      1. Caminho Feliz (Happy Path) - O fluxo padrão de sucesso.
      2. Cenários Alternativos - Variações de dados ou fluxo.
      3. Cenários de Exceção/Erro - Como o sistema deve reagir a falhas.

      Para cada cenário, forneça um "title" descritivo e o "gherkin" completo
      usando as palavras-chave em português (Dado, E, Quando, Então).

      
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
        "bddScenarios": [...],
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
    taskType?: JiraTaskType,
    project?: Project | null,
    attachmentsContext?: string
  ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[]; bddScenarios: BddScenario[] }> {
    const prompt = await this.buildRobustTestGenerationPrompt(title, description, bddScenarios, detailLevel, taskType, project, attachmentsContext);

    try {
      const jsonString = await this.callAPI(prompt, { type: 'json_object' });
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse || !Array.isArray(parsedResponse.strategy) || !Array.isArray(parsedResponse.testCases) || !Array.isArray(parsedResponse.bddScenarios)) {
          logger.error("Resposta da IA com estrutura inválida", 'openaiService', parsedResponse);
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
      logger.error("Erro ao gerar casos de teste", 'openaiService', error);
      throw new Error("Failed to communicate with the OpenAI API.");
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
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
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
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
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
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse;
    } catch (error) {
        logger.error("Erro ao gerar análise Shift Left", 'openaiService', error);
        throw new Error("Failed to communicate with the OpenAI API for Shift Left analysis.");
    }
  }

  async generateBddScenarios(title: string, description: string, project?: Project | null, attachmentsContext?: string): Promise<BddScenario[]> {
    const documentContext = await getFormattedContext(project || null);
    const prompt = `${documentContext}
    Aja como um especialista em BDD (Behavior-Driven Development). Para a tarefa a seguir, crie cenários de comportamento usando a sintaxe Gherkin (Dado, Quando, Então).
    Foque em descrever o comportamento do sistema do ponto de vista do usuário.

    Certifique-se de cobrir:
    1. Caminho Feliz (Happy Path) - O fluxo padrão de sucesso.
    2. Cenários Alternativos - Variações de dados ou fluxo.
    3. Cenários de Exceção/Erro - Como o sistema deve reagir a falhas.

    Título da Tarefa: ${title}
    Descrição: ${description}
    ${attachmentsContext ? `
    Anexos da tarefa (considere para enriquecer os cenários):
    ${attachmentsContext}
    ` : ''}

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
        const jsonString = await this.callAPI(prompt, { type: 'json_object' });
        const parsedResponse = JSON.parse(jsonString);
        return parsedResponse;
    } catch (error) {
        logger.error("Erro ao gerar análise Test Pyramid", 'openaiService', error);
        throw new Error("Failed to communicate with the OpenAI API for Test Pyramid analysis.");
    }
  }
}
