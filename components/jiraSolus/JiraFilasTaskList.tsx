import React, { useCallback, useMemo } from 'react';
import { JiraTask, Project } from '../../types';
import { JiraTaskItem, TaskWithChildren } from '../tasks/JiraTaskItem';
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
}

function buildTaskTree(tasks: JiraTask[]): TaskWithChildren[] {
  const sorted = [...tasks].sort((a, b) => a.id.localeCompare(b.id));
  const taskMap = new Map(sorted.map(t => [t.id, { ...t, children: [] as TaskWithChildren[] }]));
  const tree: TaskWithChildren[] = [];

  for (const task of taskMap.values()) {
    const pid = task.parentId?.trim();
    if (pid && taskMap.has(pid)) {
      if (parentLinkCreatesCycle(taskMap, task.id, pid)) {
        logger.warn('parentId inconsistente na fila Jira; exibindo como raiz.', 'JiraFilasTaskList', {
          taskId: task.id,
          parentId: pid,
        });
        tree.push(task);
      } else {
        taskMap.get(pid)!.children.push(task);
      }
    } else {
      tree.push(task);
    }
  }

  return tree;
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
}) => {
  const noopAsync = useCallback(async () => undefined, []);
  const warn = useCallback(
    (label: string) => onUnavailableAction?.(label),
    [onUnavailableAction]
  );

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);
  const sectionA11y = useMemo(() => buildTaskTreeSectionA11y(taskTree), [taskTree]);

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
    <div className={cn(tasksListPanelClass, 'space-y-1')} role="list" aria-label="Filas do Jira">
      {taskTree.map(task => renderNode(task, 0))}
    </div>
  );
};
