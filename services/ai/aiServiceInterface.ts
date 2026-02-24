import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel, JiraTaskType, Project } from '../../types';

/**
 * Interface comum para todos os serviços de IA
 */
export interface AIService {
    generateTestCasesForTask(
        title: string,
        description: string,
        bddScenarios?: BddScenario[],
        detailLevel?: TestCaseDetailLevel,
        taskType?: JiraTaskType,
        project?: Project | null
    ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[]; bddScenarios: BddScenario[] }>;

    analyzeDocumentContent(content: string, project?: Project | null): Promise<string>;

    generateTaskFromDocument(
        documentContent: string,
        project?: Project | null
    ): Promise<{ task: Omit<JiraTask, 'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'>, strategy: TestStrategy[], testCases: TestCase[] }>;

    generateProjectLifecyclePlan(
        projectName: string,
        projectDescription: string,
        tasks: JiraTask[],
        project?: Project | null
    ): Promise<{ [key in PhaseName]?: { summary: string, testTypes: string[] } }>;

    generateShiftLeftAnalysis(
        projectName: string,
        projectDescription: string,
        tasks: JiraTask[],
        project?: Project | null
    ): Promise<ShiftLeftAnalysis>;

    generateBddScenarios(title: string, description: string, project?: Project | null): Promise<BddScenario[]>;

    generateTestPyramidAnalysis(
        projectName: string,
        projectDescription: string,
        tasks: JiraTask[],
        project?: Project | null
    ): Promise<TestPyramidAnalysis>;
}

