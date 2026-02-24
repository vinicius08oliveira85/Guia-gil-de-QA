import React from 'react';
import { JiraTask, Project } from '../../types';
import { getBlockedTasks } from '../../utils/dependencyService';
import { calculateTaskEstimation } from '../../utils/estimationService';

interface QuickActionsProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  task,
  project,
  onUpdateProject
}) => {
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
  const hasOtherActions = task.status === 'In Progress' || isBlocked || !!estimation || (task.tags != null && task.tags.length > 0);

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface border border-surface-border rounded-lg">
      {/* Mudar status - sempre visível */}
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 mb-1.5">Mudar status</p>
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((status) => {
            const isActive = currentStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleQuickStatusChange(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-200 text-base-content/80 hover:bg-base-300 hover:text-base-content'
                }`}
              >
                {status === 'To Do' ? 'A fazer' : status === 'In Progress' ? 'Em progresso' : 'Concluído'}
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
          className="px-3 py-1.5 text-sm bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 w-fit"
        >
          Concluir Teste
        </button>
      )}

      {isBlocked && (
        <span className="px-3 py-1.5 text-sm bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30 rounded-lg inline-block w-fit">
          Bloqueada
        </span>
      )}

      {estimation && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface-hover rounded-lg">
          <span className="text-text-secondary">Estimado:</span>
          <span className="font-semibold text-text-primary">{estimation.estimatedHours}h</span>
          {estimation.actualHours > 0 && (
            <>
              <span className="text-text-secondary">• Real:</span>
              <span className={`font-semibold ${
                estimation.actualHours <= estimation.estimatedHours ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
              }`}>
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
              className="px-2 py-0.5 text-xs rounded text-white"
              style={{ backgroundColor: `var(--tag-${tag}, #64748b)` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Fallback quando não há outras ações além de Mudar status */}
      {!hasOtherActions && (
        <p className="text-xs text-base-content/60">
          Adicione estimativa ou tags no Planejamento para ver mais ações.
        </p>
      )}
    </div>
  );
};

