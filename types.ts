
export interface TestCase {
  id: string;
  /** Título curto (opcional). Alguns fluxos usam a própria description como título. */
  title?: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: 'Not Run' | 'Passed' | 'Failed' | 'Blocked';
  strategies?: string[];
  executedStrategy?: string | string[]; // Suporta string (legado) ou array (novo formato)
  isAutomated?: boolean;
  observedResult?: string;
  toolsUsed?: string[]; // Ferramentas utilizadas neste caso de teste
  preconditions?: string; // Précondições
  testSuite?: string; // Suite de teste
  testEnvironment?: string; // Ambiente de teste
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Urgente'; // Prioridade do caso de teste
}

export type TestCaseDetailLevel = 'Resumido' | 'Padrão' | 'Detalhado';

export type JiraTaskType = 'Epic' | 'História' | 'Tarefa' | 'Bug';

export type BugSeverity = 'Crítico' | 'Alto' | 'Médio' | 'Baixo';

export type TeamRole = 'Product' | 'QA' | 'Dev';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

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
}

export interface JiraTask {
  id: string;
  title: string;
  description: string;
  /** Status padrão do app. "Blocked" pode ser usado por integrações/fluxos avançados. */
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  jiraStatus?: string; // Status original do Jira (ex: "Em Andamento", "Concluído", etc.)
  testCases: TestCase[];
  testStrategy?: TestStrategy[];
  type: JiraTaskType;
  parentId?: string;
  epicKey?: string; // Key do Epic vinculado (para Histórias vinculadas a Epics)
  bddScenarios?: BddScenario[];
  severity?: BugSeverity;
  priority?: TaskPriority;
  createdAt?: string; // ISO string
  completedAt?: string; // ISO string
  owner?: TeamRole;
  assignee?: TeamRole;
  tags?: string[];
  dependencies?: string[]; // IDs de tarefas que bloqueiam esta
  comments?: Comment[];
  attachments?: Attachment[];
  estimatedHours?: number;
  actualHours?: number;
  checklist?: ChecklistItem[];
  iaAnalysis?: TaskIAAnalysis;
  toolsUsed?: string[]; // Ferramentas utilizadas nesta task
  executedStrategies?: number[]; // Índices das estratégias que foram executadas
  /** Ferramentas utilizadas por estratégia (índice -> ferramentas) */
  strategyTools?: { [strategyIndex: number]: string[] | undefined };
  isEscapedDefect?: boolean; // Indica se o bug foi vazado para produção
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
  watchers?: { watchCount: number; isWatching: boolean };
  issueLinks?: Array<{ id: string; type: string; relatedKey: string; direction: 'inward' | 'outward' }>;
  jiraAttachments?: Array<{ id: string; filename: string; size: number; created: string; author: string }>;
  jiraCustomFields?: { [key: string]: any }; // Campos customizados do Jira
}

// Ferramentas sugeridas para testes
export const SUGGESTED_TOOLS = [
  'Postman',
  'Insomnia',
  'DBeaver',
  'Kibana'
] as const;

export type SuggestedTool = typeof SUGGESTED_TOOLS[number];

export interface ProjectDocument {
  name: string;
  content: string;
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
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  documents: ProjectDocument[];
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
  destination: 'download' | 'supabase';
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