/** Como o caso é executado; opcional — se ausente, métricas usam heurística de texto (`testCaseLooksAutomated`). */
export type TestCaseExecutionKind = 'manual' | 'automated' | 'mixed';

/**
 * Roteiro de teste por caso (execução manual / evidência).
 * Dados legados são convertidos em `migrateTestCase`.
 *
 * Convenção de rótulos (UI, exportação e prompts de IA):
 * - `action` → **Ação necessária** (passo a passo do que executar)
 * - `parameters` → **Parâmetros necessários** (massa de dados, pré-condições, inputs)
 * - `expectedResult` → **Resultado esperado**
 * - `observedResult` → **Resultado Obtido** (preenchido na execução; a geração por IA deve deixar vazio)
 */
export interface TestCase {
  id: string;
  action: string;
  parameters: string;
  expectedResult: string;
  observedResult: string;
  status: 'Not Run' | 'Passed' | 'Failed' | 'Blocked';
  /**
   * Opcional: manual, automatizado ou misto (substitui heurística de texto quando definido).
   * @see {@link TestCaseExecutionKind}
   */
  executionKind?: TestCaseExecutionKind;
  /** Opcional: ambiente para filtros/relatórios (alternativa a linha `Ambiente:` em `parameters`). */
  environment?: string;
  /** Opcional: suíte para filtros/relatórios (alternativa a linha `Suíte:` em `parameters`). */
  suite?: string;
}

/** Nível de detalhe do roteiro em `action` / campos correlatos na geração por IA. */
export type TestCaseDetailLevel = 'Resumido' | 'Estruturado';

/**
 * Normaliza valores legados (`Padrão`, `Detalhado`) ou entradas indefinidas para o tipo atual.
 * `Padrão` e `Detalhado` mapeiam para **Estruturado** (roteiro completo + formatação rica).
 */
export function normalizeTestCaseDetailLevel(
  value: TestCaseDetailLevel | string | undefined | null
): TestCaseDetailLevel {
  if (value === 'Resumido') return 'Resumido';
  return 'Estruturado';
}

export type AppViewMode = 'dashboard' | 'project_detail' | 'settings';

export type JiraTaskType = 'Epic' | 'História' | 'Tarefa' | 'Bug';

export type BugSeverity = 'Crítico' | 'Alto' | 'Médio' | 'Baixo';

export type TeamRole = 'Product' | 'QA' | 'Dev';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

/**
 * Status de teste independente do Jira
 * Não é afetado pela sincronização do Jira
 */
export type TaskTestStatus = 'testar' | 'testando' | 'pendente' | 'teste_concluido';

/**
 * Registro de status de teste no Supabase
 */
export interface TaskTestStatusRecord {
  task_key: string;
  status: TaskTestStatus;
  updated_at?: string;
  created_at?: string;
}

export type STLCPhaseName =
  | 'Análise de Requisitos'
  | 'Planejamento de Testes'
  | 'Desenvolvimento de Casos de Teste'
  | 'Execução de Testes'
  | 'Encerramento do Teste';

export interface TestStrategy {
  testType: string;
  description: string;
  howToExecute: string[];
  tools: string;
}

export interface BddScenario {
  id: string;
  title: string;
  gherkin: string;
}

export interface TaskIAAnalysis {
  taskId: string;
  summary: string;
  detectedProblems: string[];
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  riskScore: number; // 0-100
  missingItems: string[];
  bddSuggestions: string[];
  qaImprovements: string[];
  generatedAt: string;
  isOutdated?: boolean;
  /**
   * Hash determinístico do snapshot da tarefa que originou esta análise.
   * Permite detectar `isOutdated` comparando com o hash recalculado a partir
   * do estado atual (ver `utils/analysisFreshness.ts`).
   */
  snapshotHash?: string;
}

export interface TestIAAnalysis {
  testId: string;
  taskId: string;
  summary: string;
  coverage: string;
  detectedProblems: string[];
  suggestions: string[];
  generatedAt: string;
  isOutdated?: boolean;
  /** Hash determinístico do snapshot do teste que originou esta análise. */
  snapshotHash?: string;
}

export interface GeneralIAAnalysis {
  summary: string;
  detectedProblems: string[];
  riskCalculation: {
    overallRisk: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
    riskScore: number; // 0-100
    riskFactors: Array<{
      factor: string;
      impact: 'Baixo' | 'Médio' | 'Alto';
      description: string;
    }>;
  };
  missingItems: string[];
  bddSuggestions: Array<{
    taskId: string;
    taskTitle: string;
    scenarios: string[];
  }>;
  qaImprovements: string[];
  taskAnalyses: TaskIAAnalysis[];
  testAnalyses: TestIAAnalysis[];
  generatedAt: string;
  isOutdated?: boolean;
  /** Hash determinístico do snapshot do projeto que originou esta análise. */
  snapshotHash?: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'future' | 'closed';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
}

export interface JiraTask {
  id: string;
  title: string;
  description: string;
  /** URL do ícone oficial do tipo da issue no Jira (quando a task veio da integração). */
  jiraIssueTypeIconUrl?: string;
  /** Status padrão do app. "Blocked" pode ser usado por integrações/fluxos avançados. */
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  jiraStatus?: string; // Status original do Jira (ex: "Em Andamento", "Concluído", etc.)
  /** Status de teste independente do Jira. Não é afetado pela sincronização do Jira. */
  testStatus?: TaskTestStatus;
  testCases: TestCase[];
  testStrategy?: TestStrategy[];
  type: JiraTaskType;
  parentId?: string;
  epicKey?: string; // Key do Epic vinculado (para Histórias vinculadas a Epics)
  sprints?: JiraSprint[]; // Sprints vinculadas à tarefa
  bddScenarios?: BddScenario[];
  severity?: BugSeverity;
  priority?: TaskPriority;
  /** Nome original da prioridade no Jira (ex: "High", "Highest", "Medium"). */
  jiraPriority?: string;
  createdAt?: string; // ISO string
  /** Última atualização conhecida (ex.: sync Jira); opcional para tarefas legadas. */
  updatedAt?: string;
  completedAt?: string; // ISO string
  owner?: TeamRole;
  assignee?: TeamRole;
  tags?: string[];
  dependencies?: string[]; // IDs de tarefas que bloqueiam esta
  comments?: Comment[];
  attachments?: Attachment[];
  estimatedHours?: number;
  actualHours?: number;
  /** Story Points (campo nativo ou espelhado na importação Jira). */
  storyPoints?: number;
  checklist?: ChecklistItem[];
  iaAnalysis?: TaskIAAnalysis;
  toolsUsed?: string[]; // Ferramentas utilizadas nesta task
  executedStrategies?: number[]; // Índices das estratégias que foram executadas
  /** Ferramentas utilizadas por estratégia (índice -> ferramentas) */
  strategyTools?: { [strategyIndex: number]: string[] | undefined };
  isEscapedDefect?: boolean; // Indica se o bug foi vazado para produção
  /** Tarefa marcada como favorita (prioritária) no projeto. */
  isFavorite?: boolean;
  // Campos adicionais do Jira
  dueDate?: string; // ISO string
  timeTracking?: {
    originalEstimate?: string; // Ex: "2h 30m"
    remainingEstimate?: string;
    timeSpent?: string;
  };
  components?: Array<{ id: string; name: string }>;
  fixVersions?: Array<{ id: string; name: string }>;
  environment?: string;
  reporter?: { displayName: string; emailAddress?: string };
  /** Responsável no Jira (nome/e-mail). Exibido na UI; assignee continua sendo o papel para filtros/export. */
  jiraAssignee?: { displayName: string; emailAddress?: string };
  watchers?: { watchCount: number; isWatching: boolean };
  issueLinks?: Array<{
    id: string;
    type: string;
    relatedKey: string;
    direction: 'inward' | 'outward';
  }>;
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>;
  jiraCustomFields?: { [key: string]: any }; // Campos customizados do Jira
  isTechnicalDebt?: boolean; // Flag para o indicador de Débito Técnico
  isCriticalPath?: boolean; // Flag para o indicador de Funcionalidades Críticas (LGPD/Segurança)
  /** IDs de regras de negócio do projeto vinculadas a esta tarefa (geração de testes/BDD). */
  linkedBusinessRuleIds?: string[];
  /** Categorias inteiras cujas regras do projeto entram no prompt (união com vínculos por id, sem duplicar id). */
  linkedBusinessRuleCategories?: string[];
  /**
   * ISO date da última sincronização manual desta tarefa com o Jira
   * (botão "Atualizar do Jira — só esta tarefa").
   */
  jiraSyncedAt?: string;
  /**
   * ISO date da última geração de casos de teste com IA.
   * Usado pela UI para exibir "última geração em ...".
   */
  testCasesGeneratedAt?: string;
  /**
   * Hash do snapshot da tarefa no momento da última geração de casos de teste.
   * Permite detectar `isTestCasesOutdated` mesmo após reload (cache em memória vazio).
   * Calculado por `services/ai/testCaseGenerationService.ts`.
   */
  testCasesSnapshotHash?: string;
  /** SLAs do Jira Service Management (Time to resolution, Time to first response, etc.). */
  jiraSlas?: JiraTaskSla[];
  /** Nome do serviço / projeto JSM (quando disponível na API). */
  jiraServiceName?: string;
  /** Setor ou diretoria (custom field ou portal JSM). */
  jiraSectorName?: string;
  /** Tipo de solicitação do Jira Service Management. */
  jiraRequestTypeName?: string;
}

/** SLA de uma issue no Jira Service Management. */
export interface JiraTaskSla {
  /** Nome do SLA no Jira (ex.: "Time to resolution"). */
  name: string;
  /** Ciclo em andamento ou último ciclo concluído. */
  phase: 'ongoing' | 'completed' | 'none';
  /** Se o ciclo atual/último estourou o objetivo. */
  breached: boolean;
  /** Prazo limite do SLA (ISO), quando disponível. */
  deadlineAt?: string;
  /** Conclusão do ciclo (ISO), para SLAs já atendidos. */
  completedAt?: string;
  /** Meta legível (ex.: "4h", "48h"). */
  goalFriendly?: string;
}

// Ferramentas sugeridas para testes
export const SUGGESTED_TOOLS = ['Postman', 'Insomnia', 'DBeaver', 'Kibana'] as const;

export type SuggestedTool = (typeof SUGGESTED_TOOLS)[number];

export type BusinessRuleTraceabilityConfidence = 'alta' | 'media' | 'baixa';

export interface BusinessRuleScreenshot {
  id: string;
  name: string;
  dataUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface BusinessRuleAnalysisItem {
  name: string;
  description: string;
  taskIds: string[];
}

export type BusinessRuleFunctionalityStatus =
  | 'implementado'
  | 'parcial'
  | 'pendente'
  | 'legado';

/** Funcionalidade detalhada do dossiê: o que foi feito e resultado esperado. */
export interface BusinessRuleFunctionalityItem {
  name: string;
  /** Resumo curto da funcionalidade. */
  description: string;
  /** O que foi implementado (telas, fluxos, validações, regras). */
  implemented: string;
  /** Resultado esperado para o usuário ou negócio. */
  expectedResult: string;
  taskIds: string[];
  implementationStatus?: BusinessRuleFunctionalityStatus;
}

/** Ficha técnica detalhada por task vinculada ao dossiê. */
export interface BusinessRuleTaskSheet {
  taskId: string;
  taskTitle: string;
  /** O que foi feito e implementado (escopo técnico/funcional). */
  implemented: string;
  /** Como era antes (legado). */
  legacyBefore: string;
  /** Como ficou agora (melhoria). */
  improvedAfter: string;
  /** Objetivo final para o usuário. */
  purpose: string;
  /** Sistemas/módulos integrados. */
  integratedSystems: string;
  /** Comportamento esperado após execução da task. */
  expectedResult: string;
}

export interface BusinessRuleIntegrationItem {
  system: string;
  type: string;
  evidence: string;
  taskIds: string[];
}

export interface BusinessRuleTraceabilityItem {
  taskId: string;
  section: string;
  confidence: BusinessRuleTraceabilityConfidence;
}

export interface BusinessRuleAnalysis {
  version: number;
  generatedAt: string;
  markdown: string;
  executiveSummary: string;
  asWas: string;
  asIs: string;
  toBe: string;
  components: BusinessRuleAnalysisItem[];
  functionalities: BusinessRuleFunctionalityItem[];
  /** Ficha técnica por task (seção principal do dossiê). */
  taskSheets: BusinessRuleTaskSheet[];
  integrations: BusinessRuleIntegrationItem[];
  traceability: BusinessRuleTraceabilityItem[];
}

export interface BusinessRule {
  id: string;
  title: string;
  /** Palavras-chave para buscar tasks e orientar a IA (ex.: Foto do dia, Mapa de Internação). */
  searchKeywords?: string[];
  createdAt: string;
  updatedAt?: string;
  linkedTaskIds: string[];
  taskSnapshotHash?: string;
  screenshots?: BusinessRuleScreenshot[];
  analysis?: BusinessRuleAnalysis;
  /** Versões anteriores do dossiê (máx. 5 na normalização). */
  analysisHistory?: BusinessRuleAnalysis[];
  isOutdated?: boolean;
  /** Legado: descrição manual (somente migração). */
  description?: string;
  /** Legado: classificação livre. */
  category?: string;
  /** Legado: vínculo entre regras. */
  linkedBusinessRuleIds?: string[];
}

export interface ProjectDocument {
  name: string;
  content: string;
  /** Classificação opcional (ex.: requisito, especificação). */
  category?: string;
  analysis?: string;
}

export type PhaseStatus = 'Não Iniciado' | 'Em Andamento' | 'Concluído';

export type PhaseName =
  | 'Request'
  | 'Analysis'
  | 'Design'
  | 'Analysis and Code'
  | 'Build'
  | 'Test'
  | 'Release'
  | 'Deploy'
  | 'Operate'
  | 'Monitor';

export interface Phase {
  name: PhaseName;
  status: PhaseStatus;
  summary?: string;
  testTypes?: string[];
}

export interface ShiftLeftRecommendation {
  phase: 'Analysis' | 'Design' | 'Analysis and Code';
  recommendation: string;
}

export interface ShiftLeftAnalysis {
  recommendations: ShiftLeftRecommendation[];
}

export interface TestPyramidLevel {
  level: 'Unitário' | 'Integração' | 'E2E';
  effort: string;
  examples: string[];
}

export interface TestPyramidAnalysis {
  distribution: TestPyramidLevel[];
}

export interface DashboardOverviewAnalysis {
  summary: string; // Resumo executivo
  currentPhase: string; // Análise da fase atual
  metrics: {
    analysis: string; // Análise das métricas do projeto
    strengths: string[]; // Pontos fortes identificados
    weaknesses: string[]; // Pontos fracos identificados
  };
  risks: string[]; // Riscos identificados
  recommendations: string[]; // Recomendações
  generatedAt: string;
  isOutdated?: boolean;
  /** Hash determinístico do snapshot do projeto que originou esta análise. */
  snapshotHash?: string;
}

/** Análise IA completa do projeto (documentos, tarefas, testes, indicadores e fases) — salva no Supabase com o projeto */
export interface ProjectFullAnalysis {
  summary: string;
  documentsAnalysis: string;
  tasksAnalysis: string;
  testsAnalysis: string;
  indicatorsAndPhases: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface DashboardInsightsAnalysis {
  qualityScore: number; // Score de qualidade geral (0-100)
  qualityLevel: 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Crítico';
  insights: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description: string;
    priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
    actionable: boolean;
  }>;
  predictions: {
    nextWeekPassRate?: number; // Previsão de taxa de sucesso para próxima semana
    nextWeekBugs?: number; // Previsão de bugs para próxima semana
    riskFactors: Array<{
      factor: string;
      probability: 'Baixa' | 'Média' | 'Alta';
      impact: string;
    }>;
  };
  recommendations: Array<{
    category: 'Testes' | 'Bugs' | 'Cobertura' | 'Processo' | 'Qualidade';
    title: string;
    description: string;
    impact: 'Baixo' | 'Médio' | 'Alto';
    effort: 'Baixo' | 'Médio' | 'Alto';
  }>;
  metricEnhancements: {
    testPassRate: {
      current: number;
      predicted: number;
      suggestion: string;
    };
    bugResolution: {
      current: number;
      predicted: number;
      suggestion: string;
    };
    coverage: {
      current: number;
      target: number;
      suggestion: string;
    };
  };
  generatedAt: string;
  isOutdated?: boolean;
  /** Hash determinístico do snapshot do projeto que originou esta análise. */
  snapshotHash?: string;
}

export interface SDLCPhaseAnalysis {
  currentPhase: PhaseName;
  explanation: string; // Explicação da IA sobre por que está nessa fase
  nextSteps: Array<{
    step: string;
    description: string;
    priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  }>;
  blockers: Array<{
    blocker: string;
    description: string;
    impact: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
    suggestion: string;
  }>;
  progressPercentage: number; // Percentual de conclusão da fase atual (0-100)
  generatedAt: string;
  isOutdated?: boolean;
  /** Hash determinístico do snapshot do projeto que originou esta análise. */
  snapshotHash?: string;
}

export interface MetricsSnapshot {
  date: string; // ISO string
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  blockedTestCases: number;
  notRunTestCases: number;
  totalBugs: number;
  bugsBySeverity: Record<BugSeverity, number>;
  executedTestCases: number;
  testPassRate: number;
  automationRatio: number;
  /** Total de tarefas do projeto (para tendência no card) */
  totalTasks?: number;
  /** Total de estratégias de teste (para tendência no card) */
  totalStrategies?: number;
  /** Quantidade de fases em andamento/concluídas (para tendência no card) */
  activePhasesCount?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  documents: ProjectDocument[];
  /** Regras de negócio definidas para o projeto (contexto IA e vínculo por tarefa). */
  businessRules: BusinessRule[];
  /** Nomes de categoria sugeridos no projeto (filtro, datalist); união com categorias já usadas nas regras. */
  businessRuleCategoryPresets?: string[];
  tasks: JiraTask[];
  phases: Phase[];
  shiftLeftAnalysis?: ShiftLeftAnalysis;
  testPyramidAnalysis?: TestPyramidAnalysis;
  generalIAAnalysis?: GeneralIAAnalysis;
  tags?: string[];
  settings?: ProjectSettings;
  dashboardOverviewAnalysis?: DashboardOverviewAnalysis;
  dashboardInsightsAnalysis?: DashboardInsightsAnalysis;
  sdlcPhaseAnalysis?: SDLCPhaseAnalysis;
  metricsHistory?: MetricsSnapshot[];
  specificationDocument?: string; // Conteúdo processado do documento de especificação
  /** Histórico de análises IA completas do projeto (persistido no Supabase com o projeto) */
  projectFullAnalyses?: ProjectFullAnalysis[];
  /** Páginas do Bloco de Notas (abas internas com texto puro). */
  notepadPages?: NotepadPage[];
  /**
   * @deprecated Conteúdo legado de nota única — migrado automaticamente para `notepadPages`.
   */
  notepadContent?: string;
}

/** Aba interna do Bloco de Notas do projeto. */
export interface NotepadPage {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  mentions?: string[];
  fromJira?: boolean; // Indica se o comentário veio do Jira
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  required: boolean;
}

export interface ProjectSettings {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: NotificationSettings;
  defaultTags?: string[];
  jiraStatuses?: Array<{ name: string; color: string } | string>; // Lista de status disponíveis no Jira com suas cores
  jiraPriorities?: Array<{ name: string } | string>; // Lista de prioridades disponíveis no Jira
  jiraProjectKey?: string; // Chave do projeto Jira associado
}

export interface NotificationSettings {
  email?: boolean;
  browser?: boolean;
  onBugCreated?: boolean;
  onTestFailed?: boolean;
  onDeadlineApproaching?: boolean;
  onTaskAssigned?: boolean;
  onCommentAdded?: boolean;
}

// User Preferences Types
export interface NotificationPreferences {
  bugCreated: boolean;
  testFailed: boolean;
  deadlineApproaching: boolean;
  taskAssigned: boolean;
  commentAdded: boolean;
  taskCompleted: boolean;
}

export interface KeyboardShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface KeyboardShortcutPreferences {
  search: KeyboardShortcutConfig;
  newProject: KeyboardShortcutConfig;
  save: KeyboardShortcutConfig;
  focusSearch: KeyboardShortcutConfig;
  closeModal: KeyboardShortcutConfig;
}

export interface ExportTemplate {
  id: string;
  name: string;
  format: 'json' | 'csv' | 'markdown';
  includeMetrics: boolean;
  includeTasks: boolean;
  includeTestCases: boolean;
}

export interface ExportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  format: 'json' | 'csv' | 'markdown';
  includeMetrics: boolean;
  includeTasks: boolean;
  includeTestCases: boolean;
  destination: 'download' | 'local-folder';
  notifyOnComplete: boolean;
}

export interface ExportPreferences {
  defaultFormat: 'json' | 'csv' | 'markdown';
  defaultIncludeMetrics: boolean;
  defaultIncludeTasks: boolean;
  defaultIncludeTestCases: boolean;
  templates: ExportTemplate[];
  schedule?: ExportSchedule;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  keyboardShortcuts: KeyboardShortcutPreferences;
  export: ExportPreferences;
}

/**
 * Informações sobre um backup de projeto
 */
export interface BackupInfo {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  operation: string; // Tipo de operação que gerou o backup (ex: 'DELETE', 'UPDATE', 'MERGE', 'CLEANUP')
  size: number; // Tamanho do backup em bytes
  description?: string; // Descrição opcional do backup
}

/**
 * Projeto deletado (soft delete)
 */
export interface DeletedProject {
  project: Project;
  deletedAt: string;
  deletedBy?: string;
  canRestore: boolean;
  backupId?: string; // ID do backup criado antes de deletar
}
