import React from 'react';
import { JiraTask, Project } from '../../types';
import { getBlockedTasks } from '../../utils/dependencyService';
import { calculateTaskEstimation } from '../../utils/estimationService';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSecondaryBtnClass,
  leveTaskModalStrongClass,
} from './projectCardUi';
import {
  taskDetailsModalSectionClass,
  taskDetailsModalStatusPillClass,
  taskDetailsModalStatusTrackClass,
} from '../tasks/taskDetailsNeuUi';

interface QuickActionsProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ task, project, onUpdateProject }) => {
  const blockedTasks = getBlockedTasks(project);
  const isBlocked = blockedTasks.some(t => t.id === task.id);
  const estimation = calculateTaskEstimation(task);

  const handleQuickStatusChange = (newStatus: 'To Do' | 'In Progress' | 'Done') => {
    const updatedTasks = project.tasks.map(t =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const handleComplete = () => {
    if (task.status !== 'Done') {
      handleQuickStatusChange('Done');
      const updatedTasks = project.tasks.map(t =>
        t.id === task.id
          ? { ...t, status: 'Done' as const, completedAt: new Date().toISOString() }
          : t
      );
      onUpdateProject({ ...project, tasks: updatedTasks });
    }
  };

  const statusOptions: Array<'To Do' | 'In Progress' | 'Done'> = ['To Do', 'In Progress', 'Done'];
  const currentStatus = task.status === 'Blocked' ? undefined : task.status;
  const hasOtherActions =
    task.status === 'In Progress' ||
    isBlocked ||
    !!estimation ||
    (task.tags != null && task.tags.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Mudar status</p>
        <div className={taskDetailsModalStatusTrackClass}>
          {statusOptions.map(status => {
            const isActive = currentStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleQuickStatusChange(status)}
                className={taskDetailsModalStatusPillClass(!!isActive)}
              >
                {status === 'To Do'
                  ? 'A fazer'
                  : status === 'In Progress'
                    ? 'Em progresso'
                    : 'Concluído'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Concluir Teste (quando em progresso) */}
      {task.status === 'In Progress' && (
        <button
          type="button"
          onClick={handleComplete}
          className={leveTaskModalSecondaryBtnClass}
        >
          Concluir Teste
        </button>
      )}

      {isBlocked && (
        <span
          className={cn(
            taskDetailsModalSectionClass,
            'inline-block w-fit px-3 py-1.5 font-sans text-sm text-primary'
          )}
        >
          Bloqueada
        </span>
      )}

      {estimation && (
        <div className={cn(taskDetailsModalSectionClass, 'flex items-center gap-2 px-3 py-2 font-sans text-sm')}>
          <span className={leveTaskModalMutedXsClass}>Estimado:</span>
          <span className={leveTaskModalStrongClass}>{estimation.estimatedHours}h</span>
          {estimation.actualHours > 0 && (
            <>
              <span className={leveTaskModalMutedXsClass}>• Real:</span>
              <span
                className={cn(
                  'font-semibold',
                  estimation.actualHours <= estimation.estimatedHours
                    ? 'text-base-content'
                    : 'text-primary'
                )}
              >
                {estimation.actualHours}h
              </span>
            </>
          )}
        </div>
      )}

      {task.tags != null && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="leve-neu-pill px-2 py-0.5 text-xs text-base-content"
              style={{ backgroundColor: `var(--tag-${tag}, var(--muted))` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Fallback quando não há outras ações além de Mudar status */}
      {!hasOtherActions && (
        <p className={leveTaskModalMutedXsClass}>
          Adicione estimativa ou tags no Planejamento para ver mais ações.
        </p>
      )}
    </div>
  );
};
