
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
  createdAt?: string; // ISO string
  completedAt?: string; // ISO string
  owner?: TeamRole;
  assignee?: TeamRole;
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
}