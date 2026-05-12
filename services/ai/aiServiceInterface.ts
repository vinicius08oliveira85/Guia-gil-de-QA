import {
  TestCase,
  TestStrategy,
  PhaseName,
  ShiftLeftAnalysis,
  BddScenario,
  JiraTask,
  TestPyramidAnalysis,
  TestCaseDetailLevel,
  JiraTaskType,
  Project,
} from '../../types';

/**
 * Interface comum para todos os serviços de IA.
 *
 * Geração de casos de teste (`generateTestCasesForTask`): o parâmetro `detailLevel` aceita apenas
 * **`Resumido`** ou **`Estruturado`** (ver `TestCaseDetailLevel` e `normalizeTestCaseDetailLevel` em `types.ts`).
 */
export interface AIService {
  generateTestCasesForTask(
    title: string,
    description: string,
    bddScenarios?: BddScenario[],
    /** `Resumido` | `Estruturado` — controla o texto do roteiro em `action` / campos correlatos no prompt. */
    detailLevel?: TestCaseDetailLevel,
    taskType?: JiraTaskType,
    project?: Project | null,
    task?: JiraTask | null,
    attachmentsContext?: string
  ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[]; bddScenarios: BddScenario[] }>;

  analyzeDocumentContent(content: string, project?: Project | null): Promise<string>;

  generateTaskFromDocument(
    documentContent: string,
    project?: Project | null
  ): Promise<{
    task: Omit<
      JiraTask,
      'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'
    >;
    strategy: TestStrategy[];
    testCases: TestCase[];
  }>;

  generateProjectLifecyclePlan(
    projectName: string,
    projectDescription: string,
    tasks: JiraTask[],
    project?: Project | null
  ): Promise<{ [key in PhaseName]?: { summary: string; testTypes: string[] } }>;

  generateShiftLeftAnalysis(
    projectName: string,
    projectDescription: string,
    tasks: JiraTask[],
    project?: Project | null
  ): Promise<ShiftLeftAnalysis>;

  generateBddScenarios(
    title: string,
    description: string,
    project?: Project | null,
    task?: JiraTask | null,
    attachmentsContext?: string
  ): Promise<BddScenario[]>;

  generateTestPyramidAnalysis(
    projectName: string,
    projectDescription: string,
    tasks: JiraTask[],
    project?: Project | null
  ): Promise<TestPyramidAnalysis>;
}
