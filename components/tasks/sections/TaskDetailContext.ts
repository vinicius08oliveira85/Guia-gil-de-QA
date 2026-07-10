import { createContext, useContext } from 'react';
import type { BddScenario, JiraTask, Project, TestCase, TestCaseDetailLevel } from '../../../types';
import type { TaskWithChildren } from '../JiraTaskItem';

/** Anexo do Jira exibido/aberto na aba Resumo. */
export interface JiraAttachmentViewInput {
  id: string;
  filename: string;
  url: string;
  mimeType?: string;
}

/**
 * Valor compartilhado pelas seções do detalhe da tarefa (Resumo, BDD, Testes,
 * Planejamento). Centraliza a tarefa, o projeto, flags e callbacks para evitar
 * prop-drilling entre {@link TaskDetailsView} e cada seção.
 */
export interface TaskDetailContextValue {
  task: TaskWithChildren;
  project?: Project;
  onUpdateProject?: (project: Project) => void;
  hideTestFeatures: boolean;
  devMode: boolean;

  onGenerateDevGuidance?: (taskId: string) => Promise<void>;
  isGeneratingDevGuidance?: boolean;

  detailLevel: TestCaseDetailLevel;
  onDetailLevelChange: (level: TestCaseDetailLevel) => void;

  isGenerating: boolean;
  isGeneratingBdd: boolean;
  isGeneratingAll?: boolean;
  isUpdatingFromJira?: boolean;

  onGenerateTests: (taskId: string, detailLevel: TestCaseDetailLevel) => Promise<void>;
  onGenerateBddScenarios: (taskId: string) => Promise<void>;
  onGenerateAll?: (taskId: string, detailLevel?: TestCaseDetailLevel) => Promise<void>;
  onUpdateFromJira?: (taskId: string) => Promise<void>;

  onSaveBddScenario: (
    taskId: string,
    scenario: Omit<BddScenario, 'id'>,
    scenarioId?: string
  ) => void;
  onDeleteBddScenario: (taskId: string, scenarioId: string) => void;

  onAddComment?: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;

  onTaskToolsChange?: (tools: string[]) => void;
  onStrategyExecutedChange?: (strategyIndex: number, executed: boolean) => void;
  onStrategyToolsChange?: (strategyIndex: number, tools: string[]) => void;
  onTestCaseStatusChange: (testCaseId: string, status: TestCase['status']) => void;
  onTestCaseObservedResultChange?: (testCaseId: string, value: string) => void;
  onTestCaseExecutionKindChange?: (testCaseId: string, kind: TestCase['executionKind']) => void;
  onEditTestCase?: (taskId: string, testCase: TestCase) => void;
  onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
  onDuplicateTestCase?: (taskId: string, testCase: TestCase) => void;
  onAddTestCaseFromTemplate?: (taskId: string) => void;

  onNavigateToTab?: (tabId: string) => void;
  onOpenTask?: (task: JiraTask) => void;

  onShowTestReport: () => void;
  /** Abre modal de registro de implementação (Projetos Dev). */
  onShowDevImplementationReport?: () => void;
  onViewJiraAttachment: (attachment: JiraAttachmentViewInput) => void;
  loadingJiraAttachmentId: string | null;
}

const TaskDetailContext = createContext<TaskDetailContextValue | null>(null);

export const TaskDetailProvider = TaskDetailContext.Provider;

/** Acessa o contexto do detalhe da tarefa. Lança se usado fora do provider. */
export function useTaskDetail(): TaskDetailContextValue {
  const ctx = useContext(TaskDetailContext);
  if (!ctx) {
    throw new Error('useTaskDetail deve ser usado dentro de <TaskDetailProvider>.');
  }
  return ctx;
}
