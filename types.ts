
export interface TestCase {
  id: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: 'Not Run' | 'Passed' | 'Failed';
  strategies?: string[];
  isAutomated?: boolean;
  observedResult?: string;
}

export type TestCaseDetailLevel = 'Resumido' | 'Padrão' | 'Detalhado';

export type JiraTaskType = 'Epic' | 'História' | 'Tarefa' | 'Bug';

export type BugSeverity = 'Crítico' | 'Alto' | 'Médio' | 'Baixo';

export type TeamRole = 'Product' | 'QA' | 'Dev';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

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

export interface JiraTask {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  testCases: TestCase[];
  testStrategy?: TestStrategy[];
  type: JiraTaskType;
  parentId?: string;
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
}

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

export interface Project {
  id: string;
  name: string;
  description: string;
  documents: ProjectDocument[];
  tasks: JiraTask[];
  phases: Phase[];
  shiftLeftAnalysis?: ShiftLeftAnalysis;
  testPyramidAnalysis?: TestPyramidAnalysis;
  tags?: string[];
  settings?: ProjectSettings;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  mentions?: string[];
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
