import React, { useMemo } from 'react';
import type { JiraTask, Project } from '../../types';
import { TaskDetailsView } from './TaskDetailsView';
import { TestCaseEditorModal } from './TestCaseEditorModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { buildTaskWithChildren } from '../../utils/buildTaskWithChildren';
import { useTaskDetailActions } from '../../hooks/useTaskDetailActions';
import {
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from './tasksPanelNeuStyles';

import type { TaskDetailSectionId, OpenTaskNavProps } from '../../utils/workspaceSessionStorage';

export interface TaskWorkspacePanelProps {
  taskId: string;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
  onOpenTaskTab?: (task: JiraTask) => void;
  onClose: () => void;
  /** Oculta BDD, testes e planejamento (contexto Filas Jira). */
  hideTestFeatures?: boolean;
  /** Substitui a sincronização padrão do projeto (ex.: importação de filas). */
  onUpdateFromJira?: (taskId: string) => Promise<void>;
  isUpdatingFromJira?: boolean;
  initialSection?: TaskDetailSectionId;
  onSectionChange?: (section: TaskDetailSectionId) => void;
  openTaskNav?: OpenTaskNavProps;
}

/**
 * Painel de detalhe de tarefa dentro de uma aba do workspace do projeto.
 */
export const TaskWorkspacePanel: React.FC<TaskWorkspacePanelProps> = ({
  taskId,
  project,
  onUpdateProject,
  onNavigateToTab,
  onOpenTaskTab,
  onClose,
  hideTestFeatures = false,
  onUpdateFromJira,
  isUpdatingFromJira,
  initialSection,
  onSectionChange,
  openTaskNav,
}) => {
  const actions = useTaskDetailActions(project, onUpdateProject);

  const task = useMemo(
    () => project.tasks.find(t => t.id === taskId),
    [project.tasks, taskId]
  );

  const taskWithChildren = useMemo(() => {
    if (!task) return null;
    return buildTaskWithChildren(project.tasks, task);
  }, [project.tasks, task]);

  if (!task || !taskWithChildren) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-base-content">
        Tarefa <strong>{taskId}</strong> não encontrada neste projeto.
        <Button type="button" variant="ghost" size="sm" className="ml-2" onClick={onClose}>
          Fechar aba
        </Button>
      </div>
    );
  }

  const panelId = `tab-panel-task-${taskId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={`tab-task-${taskId}`}
      className="min-w-0"
    >
      <TaskDetailsView
        task={taskWithChildren}
        presentation="workspace"
        onClose={onClose}
        onTestCaseStatusChange={(testCaseId, status) =>
          actions.handleTestCaseStatusChange(taskId, testCaseId, status)
        }
        onTestCaseObservedResultChange={(testCaseId, value) =>
          actions.handleTestCaseObservedResultChange(taskId, testCaseId, value)
        }
        onTestCaseExecutionKindChange={(testCaseId, kind) =>
          actions.handleTestCaseExecutionKindChange(taskId, testCaseId, kind)
        }
        onTaskToolsChange={tools => actions.handleTaskToolsChange(taskId, tools)}
        onStrategyExecutedChange={(strategyIndex, executed) =>
          actions.handleStrategyExecutedChange(taskId, strategyIndex, executed)
        }
        onStrategyToolsChange={(strategyIndex, tools) =>
          actions.handleStrategyToolsChange(taskId, strategyIndex, tools)
        }
        onGenerateTests={(id, detailLevel) => actions.handleGenerateTests(id, detailLevel)}
        isGenerating={actions.generatingTestsTaskId === taskId}
        onGenerateBddScenarios={actions.handleGenerateBddScenarios}
        isGeneratingBdd={actions.generatingBddTaskId === taskId}
        onGenerateAll={actions.handleGenerateAll}
        isGeneratingAll={actions.generatingAllTaskId === taskId}
        onSaveBddScenario={actions.handleSaveBddScenario}
        onDeleteBddScenario={actions.handleDeleteBddScenario}
        onAddComment={content => actions.handleAddComment(taskId, content)}
        onEditComment={(commentId, content) =>
          actions.handleEditComment(taskId, commentId, content)
        }
        onDeleteComment={commentId => actions.handleDeleteComment(taskId, commentId)}
        onEditTestCase={actions.handleOpenTestCaseEditor}
        onDeleteTestCase={actions.handleDeleteTestCase}
        onDuplicateTestCase={actions.handleDuplicateTestCase}
        project={project}
        onUpdateProject={onUpdateProject}
        onNavigateToTab={onNavigateToTab}
        onOpenTask={onOpenTaskTab}
        onUpdateFromJira={onUpdateFromJira ?? actions.handleUpdateTaskFromJira}
        isUpdatingFromJira={
          isUpdatingFromJira ?? actions.updatingFromJiraTaskId === taskId
        }
        hideTestFeatures={hideTestFeatures}
        initialSection={initialSection}
        onSectionChange={onSectionChange}
        openTaskNav={openTaskNav}
      />

      {actions.testCaseEditorRef ? (
        <TestCaseEditorModal
          isOpen
          testCase={actions.testCaseEditorRef.testCase}
          onClose={() => actions.setTestCaseEditorRef(null)}
          onSave={updated =>
            actions.handleSaveTestCase(actions.testCaseEditorRef!.taskId, updated)
          }
        />
      ) : null}

      <ConfirmDialog
        isOpen={!!actions.confirmDeleteState}
        onClose={() => actions.setConfirmDeleteState(null)}
        onConfirm={actions.handleConfirmDelete}
        title={
          actions.confirmDeleteState?.type === 'testcase'
            ? 'Excluir caso de teste'
            : 'Excluir cenário BDD'
        }
        message={`Tem certeza que deseja excluir ${actions.confirmDeleteState?.label ?? 'este item'}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      <Modal
        isOpen={actions.failModalState.isOpen}
        onClose={() =>
          actions.setFailModalState({ ...actions.failModalState, isOpen: false })
        }
        title="Marcar teste como reprovado"
        size="md"
        panelClassName={tasksPanelNeuModalPanelClass}
        titleClassName={tasksPanelNeuModalTitleClass}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                actions.setFailModalState({ ...actions.failModalState, isOpen: false })
              }
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={actions.handleConfirmFail}>
              Confirmar reprovação
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Resultado observado</span>
            <textarea
              className="textarea textarea-bordered min-h-[5rem] w-full"
              value={actions.failModalState.observedResult}
              onChange={e =>
                actions.setFailModalState({
                  ...actions.failModalState,
                  observedResult: e.target.value,
                })
              }
              placeholder="Descreva o que foi observado na execução..."
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={actions.failModalState.createBug}
              onChange={e =>
                actions.setFailModalState({
                  ...actions.failModalState,
                  createBug: e.target.checked,
                })
              }
            />
            Criar bug automaticamente
          </label>
        </div>
      </Modal>
    </section>
  );
};
