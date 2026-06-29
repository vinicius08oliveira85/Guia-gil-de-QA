import React, { useCallback, useMemo, useState } from 'react';
import { JiraTask, Project } from '../../types';
import { JiraTaskItem, TaskWithChildren } from '../tasks/JiraTaskItem';
import { TaskDetailsModal } from '../tasks/TaskDetailsModal';
import { tasksListPanelClass } from '../tasks/tasksListNeuUi';
import { buildTaskTreeSectionA11y } from '../tasks/tasksViewHelpers';
import { parentLinkCreatesCycle } from '../../utils/taskParentCycle';
import { logger } from '../../utils/logger';
import { cn } from '../../utils/cn';

export interface JiraFilasTaskListProps {
  tasks: JiraTask[];
  project: Project;
  onUpdateTasks: (tasks: JiraTask[]) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateFromJira?: (taskId: string) => Promise<void>;
  isUpdatingFromJira?: string | null;
  onJiraStatusChange?: (
    taskId: string,
    jiraStatusName: string,
    rollback: { status: JiraTask['status']; jiraStatus?: string }
  ) => void | Promise<void>;
  isTransitioningJiraStatus?: string | null;
  onUnavailableAction?: (label: string) => void;
  listAriaLabel?: string;
}

function buildTaskTree(tasks: JiraTask[]): TaskWithChildren[] {
  const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] as TaskWithChildren[] }]));
  const tree: TaskWithChildren[] = [];

  for (const task of tasks) {
    const node = taskMap.get(task.id);
    if (!node) continue;
    const pid = task.parentId?.trim();
    if (pid && taskMap.has(pid)) {
      if (parentLinkCreatesCycle(taskMap, task.id, pid)) {
        logger.warn('parentId inconsistente na fila Jira; exibindo como raiz.', 'JiraFilasTaskList', {
          taskId: task.id,
          parentId: pid,
        });
        tree.push(node);
      } else {
        taskMap.get(pid)!.children.push(node);
      }
    } else {
      tree.push(node);
    }
  }

  return tree;
}

function buildTaskForModal(tasks: JiraTask[], modalTask: JiraTask): TaskWithChildren {
  const taskById = new Map(tasks.map(t => [t.id, t]));
  if (!taskById.has(modalTask.id)) return { ...modalTask, children: [] };

  const visited = new Set<string>();
  const queue: string[] = [modalTask.id];
  visited.add(modalTask.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    const children = tasks.filter(c => c.parentId === id);
    for (const c of children) {
      if (!visited.has(c.id)) {
        visited.add(c.id);
        queue.push(c.id);
      }
    }
  }

  const built = new Map<string, TaskWithChildren>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const t = taskById.get(id)!;
    const children = tasks
      .filter(c => c.parentId === id)
      .map(c => built.get(c.id) ?? ({ ...c, children: [] } as TaskWithChildren));
    built.set(id, { ...t, children } as TaskWithChildren);
  }

  return built.get(modalTask.id) ?? { ...modalTask, children: [] };
}

/**
 * Lista de tarefas da fila Jira com os mesmos cards da aba Tarefas & Testes.
 */
export const JiraFilasTaskList: React.FC<JiraFilasTaskListProps> = ({
  tasks,
  project,
  onUpdateTasks,
  onDeleteTask,
  onUpdateFromJira,
  isUpdatingFromJira = null,
  onJiraStatusChange,
  isTransitioningJiraStatus = null,
  onUnavailableAction,
  listAriaLabel = 'Filas do Jira',
}) => {
  const [modalTask, setModalTask] = useState<JiraTask | null>(null);
  const noopAsync = useCallback(async () => undefined, []);
  const warn = useCallback(
    (label: string) => onUnavailableAction?.(label),
    [onUnavailableAction]
  );

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);
  const sectionA11y = useMemo(() => buildTaskTreeSectionA11y(taskTree), [taskTree]);

  const taskForModal = useMemo(
    () => (modalTask ? buildTaskForModal(tasks, modalTask) : null),
    [tasks, modalTask]
  );

  const handleUpdateProject = useCallback(
    (updated: Project) => onUpdateTasks(updated.tasks),
    [onUpdateTasks]
  );

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: 'To Do' | 'In Progress' | 'Done') => {
      onUpdateTasks(tasks.map(t => (t.id === taskId ? { ...t, status } : t)));
    },
    [tasks, onUpdateTasks]
  );

  const renderNode = useCallback(
    (task: TaskWithChildren, level: number): React.ReactElement => {
      const a11y = sectionA11y.get(task.id);
      return (
        <div
          key={task.id}
          role="listitem"
          aria-posinset={a11y?.posinset}
          aria-setsize={a11y?.setsize}
        >
          <JiraTaskItem
            task={task}
            level={level}
            project={project}
            onUpdateProject={handleUpdateProject}
            onDelete={onDeleteTask}
            onTestCaseStatusChange={() => undefined}
            onGenerateTests={noopAsync}
            isGenerating={false}
            onAddSubtask={() => warn('Adicionar subtarefa')}
            onEdit={() => warn('Editar tarefa')}
            onGenerateBddScenarios={noopAsync}
            isGeneratingBdd={false}
            onSaveBddScenario={() => warn('Salvar cenário BDD')}
            onDeleteBddScenario={() => warn('Excluir cenário BDD')}
            onTaskStatusChange={status => handleTaskStatusChange(task.id, status)}
            onJiraStatusChange={
              onJiraStatusChange
                ? (jiraStatusName, rollback) => onJiraStatusChange(task.id, jiraStatusName, rollback)
                : undefined
            }
            isTransitioningJiraStatus={isTransitioningJiraStatus === task.id}
            onUpdateFromJira={onUpdateFromJira}
            isUpdatingFromJira={isUpdatingFromJira === task.id}
            onOpenModal={setModalTask}
            hideTestFeatures
          >
            {task.children.map(child => renderNode(child, level + 1))}
          </JiraTaskItem>
        </div>
      );
    },
    [
      sectionA11y,
      project,
      handleUpdateProject,
      onDeleteTask,
      warn,
      noopAsync,
      handleTaskStatusChange,
      onJiraStatusChange,
      isTransitioningJiraStatus,
      onUpdateFromJira,
      isUpdatingFromJira,
    ]
  );

  return (
    <>
      <div className={cn(tasksListPanelClass, 'space-y-1')} role="list" aria-label={listAriaLabel}>
        {taskTree.map(task => renderNode(task, 0))}
      </div>

      {modalTask && taskForModal ? (
        <TaskDetailsModal
          task={taskForModal}
          isOpen={!!modalTask}
          onClose={() => setModalTask(null)}
          onTestCaseStatusChange={() => undefined}
          onGenerateTests={noopAsync}
          isGenerating={false}
          onGenerateBddScenarios={noopAsync}
          isGeneratingBdd={false}
          onSaveBddScenario={() => warn('Salvar cenário BDD')}
          onDeleteBddScenario={() => warn('Excluir cenário BDD')}
          project={project}
          onUpdateProject={handleUpdateProject}
          onOpenTask={setModalTask}
          onUpdateFromJira={onUpdateFromJira}
          isUpdatingFromJira={isUpdatingFromJira === modalTask.id}
          hideTestFeatures
        />
      ) : null}
    </>
  );
};
