import { TestCase, TestStrategy, PhaseName, ShiftLeftAnalysis, BddScenario, JiraTask, TestPyramidAnalysis, TestCaseDetailLevel, JiraTaskType } from '../../types';

/**
 * Interface comum para todos os serviços de IA
 */
export interface AIService {
    generateTestCasesForTask(
        title: string,
        description: string,
        bddScenarios?: BddScenario[],
        detailLevel?: TestCaseDetailLevel,
        taskType?: JiraTaskType
    ): Promise<{ strategy: TestStrategy[]; testCases: TestCase[] }>;

    analyzeDocumentContent(content: string): Promise<string>;

    generateTaskFromDocument(
        documentContent: string
    ): Promise<{ task: Omit<JiraTask, 'id' | 'status' | 'parentId' | 'bddScenarios' | 'createdAt' | 'completedAt'>, strategy: TestStrategy[], testCases: TestCase[] }>;

    generateProjectLifecyclePlan(
        projectName: string,
        projectDescription: string,
        tasks: JiraTask[]
    ): Promise<{ [key in PhaseName]?: { summary: string, testTypes: string[] } }>;

    generateShiftLeftAnalysis(
        projectName: string,
        projectDescription: string,
        tasks: JiraTask[]
    ): Promise<ShiftLeftAnalysis>;

    generateBddScenarios(title: string, description: string): Promise<BddScenario[]>;

    generateTestPyramidAnalysis(
        projectName: string,
        projectDescription: string,
        tasks: JiraTask[]
    ): Promise<TestPyramidAnalysis>;
}

