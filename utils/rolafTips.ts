/**
 * Banco de dicas sobre QA para o assistente virtual Rolaf
 */

export interface QATip {
  id: string;
  category: 'basico' | 'metodologias' | 'boas-praticas' | 'automacao' | 'ferramentas' | 'processo';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  context?: string[]; // Contextos onde a dica é relevante (ex: 'creating-task', 'dashboard', etc.)
}

export const QA_TIPS: QATip[] = [
  // Dicas Básicas
  {
    id: 'tip-001',
    category: 'basico',
    title: 'O que é QA?',
    content: 'QA (Quality Assurance) é o processo de garantir que o software atenda aos requisitos de qualidade. Envolve planejamento, execução de testes e análise de resultados.',
    priority: 'high',
    context: ['landing', 'dashboard']
  },
  {
    id: 'tip-002',
    category: 'basico',
    title: 'Tipos de Teste',
    content: 'Existem vários tipos de teste: unitário, integração, sistema, aceitação (UAT), regressão e performance. Cada um tem seu propósito específico.',
    priority: 'high',
    context: ['creating-task', 'test-cases']
  },
  {
    id: 'tip-003',
    category: 'basico',
    title: 'Pirâmide de Testes',
    content: 'A pirâmide sugere muitos testes unitários (base), alguns testes de integração (meio) e poucos testes E2E (topo). Isso garante cobertura eficiente.',
    priority: 'medium',
    context: ['dashboard', 'analysis']
  },
  
  // Metodologias
  {
    id: 'tip-004',
    category: 'metodologias',
    title: 'BDD (Behavior-Driven Development)',
    content: 'BDD usa linguagem natural (Gherkin) para descrever comportamentos. Use Given-When-Then para criar cenários claros e compartilhados entre equipes.',
    priority: 'high',
    context: ['creating-task', 'bdd-scenarios']
  },
  {
    id: 'tip-005',
    category: 'metodologias',
    title: 'Shift Left',
    content: 'Shift Left significa testar mais cedo no ciclo de desenvolvimento. Identifique problemas na fase de análise e design, não apenas na execução.',
    priority: 'high',
    context: ['analysis', 'design']
  },
  {
    id: 'tip-006',
    category: 'metodologias',
    title: 'Test-Driven Development (TDD)',
    content: 'TDD segue o ciclo: Red (escrever teste que falha), Green (implementar código que passa), Refactor (melhorar código). Isso garante código testável.',
    priority: 'medium',
    context: ['test-cases', 'automation']
  },
  
  // Boas Práticas
  {
    id: 'tip-007',
    category: 'boas-praticas',
    title: 'Casos de Teste Bem Escritos',
    content: 'Um bom caso de teste deve ser: específico, reproduzível, independente, com pré-condições claras e resultado esperado bem definido.',
    priority: 'high',
    context: ['test-cases', 'creating-task']
  },
  {
    id: 'tip-008',
    category: 'boas-praticas',
    title: 'Nomenclatura Clara',
    content: 'Use nomes descritivos para casos de teste. Ex: "deve_validar_login_com_credenciais_corretas" é melhor que "teste1".',
    priority: 'medium',
    context: ['test-cases']
  },
  {
    id: 'tip-009',
    category: 'boas-praticas',
    title: 'Documentação de Bugs',
    content: 'Ao reportar um bug, inclua: passos para reproduzir, resultado esperado, resultado observado, ambiente, screenshots e logs quando possível.',
    priority: 'high',
    context: ['creating-task', 'bugs']
  },
  {
    id: 'tip-010',
    category: 'boas-praticas',
    title: 'Priorização de Testes',
    content: 'Priorize testes de funcionalidades críticas, fluxos principais e áreas com histórico de bugs. Use a matriz de risco para guiar suas decisões.',
    priority: 'medium',
    context: ['dashboard', 'test-cases']
  },
  
  // Automação
  {
    id: 'tip-011',
    category: 'automacao',
    title: 'Quando Automatizar?',
    content: 'Automatize testes que são executados frequentemente, são estáveis, têm valor de negócio alto e são tediosos de executar manualmente.',
    priority: 'high',
    context: ['test-cases', 'automation']
  },
  {
    id: 'tip-012',
    category: 'automacao',
    title: 'Manutenção de Testes Automatizados',
    content: 'Testes automatizados precisam de manutenção constante. Mantenha-os atualizados, remova testes obsoletos e refatore quando necessário.',
    priority: 'medium',
    context: ['automation']
  },
  {
    id: 'tip-013',
    category: 'automacao',
    title: 'Page Object Model',
    content: 'Use Page Object Model para organizar testes automatizados. Separe a lógica de interação com a página da lógica de teste.',
    priority: 'low',
    context: ['automation']
  },
  
  // Ferramentas
  {
    id: 'tip-014',
    category: 'ferramentas',
    title: 'Ferramentas de Teste de API',
    content: 'Postman, Insomnia e REST Assured são excelentes para testar APIs. Use coleções para organizar requisições e scripts para validações.',
    priority: 'medium',
    context: ['tools', 'test-cases']
  },
  {
    id: 'tip-015',
    category: 'ferramentas',
    title: 'Integração com Jira',
    content: 'Use a integração com Jira para rastrear bugs e tarefas. Mantenha status atualizados e use labels para organização.',
    priority: 'high',
    context: ['jira', 'creating-task']
  },
  
  // Processo
  {
    id: 'tip-016',
    category: 'processo',
    title: 'Planejamento de Testes',
    content: 'Antes de executar testes, planeje: quais funcionalidades testar, quais tipos de teste usar, quais ferramentas serão necessárias e quanto tempo estimar.',
    priority: 'high',
    context: ['dashboard', 'planning']
  },
  {
    id: 'tip-017',
    category: 'processo',
    title: 'Métricas Importantes',
    content: 'Acompanhe: taxa de sucesso de testes, tempo de resolução de bugs, cobertura de testes e bugs encontrados por fase. Isso ajuda a melhorar o processo.',
    priority: 'high',
    context: ['dashboard', 'metrics']
  },
  {
    id: 'tip-018',
    category: 'processo',
    title: 'Comunicação com o Time',
    content: 'Comunique-se proativamente: reporte bugs rapidamente, compartilhe descobertas importantes e participe de cerimônias ágeis (daily, planning, retro).',
    priority: 'medium',
    context: ['dashboard']
  },
  {
    id: 'tip-019',
    category: 'processo',
    title: 'Testes de Regressão',
    content: 'Execute testes de regressão após mudanças no código. Foque em funcionalidades críticas e áreas que foram modificadas recentemente.',
    priority: 'high',
    context: ['test-cases', 'execution']
  },
  {
    id: 'tip-020',
    category: 'processo',
    title: 'Ambientes de Teste',
    content: 'Mantenha ambientes de teste separados (dev, QA, staging). Isso evita conflitos e permite testes mais próximos da produção.',
    priority: 'medium',
    context: ['test-cases', 'environment']
  },
  
  // Dicas Contextuais Específicas
  {
    id: 'tip-021',
    category: 'boas-praticas',
    title: 'Criando sua Primeira Tarefa',
    content: 'Ao criar uma tarefa, seja específico no título e descrição. Inclua pré-condições, passos esperados e critérios de aceitação.',
    priority: 'high',
    context: ['creating-task']
  },
  {
    id: 'tip-022',
    category: 'boas-praticas',
    title: 'Casos de Teste Eficientes',
    content: 'Crie casos de teste que cubram cenários positivos, negativos e limites. Use a IA do app para gerar sugestões, mas sempre revise e ajuste.',
    priority: 'high',
    context: ['test-cases']
  },
  {
    id: 'tip-023',
    category: 'metodologias',
    title: 'Fases do Projeto',
    content: 'Acompanhe as fases do projeto (Request, Analysis, Design, Test, Release). Cada fase tem objetivos específicos e entregas esperadas.',
    priority: 'medium',
    context: ['dashboard', 'timeline']
  },
  {
    id: 'tip-024',
    category: 'processo',
    title: 'Análise de Riscos',
    content: 'Use a análise de riscos para priorizar testes. Funcionalidades com alto impacto e alta probabilidade de falha devem ser testadas primeiro.',
    priority: 'high',
    context: ['analysis', 'dashboard']
  },
  {
    id: 'tip-025',
    category: 'boas-praticas',
    title: 'Documentação de Projeto',
    content: 'Mantenha documentos atualizados. Especificações, casos de teste e análises devem refletir o estado atual do projeto.',
    priority: 'medium',
    context: ['documents', 'dashboard']
  }
];

/**
 * Obtém dicas por categoria
 */
export function getTipsByCategory(category: QATip['category']): QATip[] {
  return QA_TIPS.filter(tip => tip.category === category);
}

/**
 * Obtém dicas por contexto
 */
export function getTipsByContext(context: string): QATip[] {
  return QA_TIPS.filter(tip => !tip.context || tip.context.includes(context));
}

/**
 * Obtém dica aleatória
 */
export function getRandomTip(excludeIds: string[] = []): QATip | null {
  const availableTips = QA_TIPS.filter(tip => !excludeIds.includes(tip.id));
  if (availableTips.length === 0) return null;
  return availableTips[Math.floor(Math.random() * availableTips.length)];
}

/**
 * Obtém dica por ID
 */
export function getTipById(id: string): QATip | undefined {
  return QA_TIPS.find(tip => tip.id === id);
}

