import React from 'react';
import { JiraTask, Project } from '../../types';
import { getBlockedTasks, getReadyTasks } from '../../utils/dependencyService';
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
  const readyTasks = getReadyTasks(project);
  const isBlocked = blockedTasks.some(t => t.id === task.id);
  const isReady = readyTasks.some(t => t.id === task.id);
  const estimation = calculateTaskEstimation(task);

  const handleQuickStatusChange = (newStatus: 'To Do' | 'In Progress' | 'Done') => {
    const updatedTasks = project.tasks.map(t =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const handleMarkAsReady = () => {
    if (task.status === 'To Do') {
      handleQuickStatusChange('In Progress');
    }
  };

  const handleComplete = () => {
    if (task.status !== 'Done') {
      handleQuickStatusChange('Done');
      // Atualizar completedAt
      const updatedTasks = project.tasks.map(t =>
        t.id === task.id 
          ? { ...t, status: 'Done' as const, completedAt: new Date().toISOString() }
          : t
      );
      onUpdateProject({ ...project, tasks: updatedTasks });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-surface border border-surface-border rounded-lg">
      {/* Status rápido */}
      {task.status === 'To Do' && isReady && (
        <button
          onClick={handleMarkAsReady}
          className="px-3 py-1 text-sm bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30"
        >
          ✅ Teste iniciado
        </button>
      )}

      {task.status === 'In Progress' && (
        <button
          onClick={handleComplete}
          className="px-3 py-1 text-sm bg-accent/20 text-accent-light border border-accent/30 rounded hover:bg-accent/30"
        >
          ✅ Teste Realizado
        </button>
      )}

      {isBlocked && (
        <span className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
          ⏳ Bloqueada
        </span>
      )}

      {/* Estimativas */}
      {estimation && (
        <div className="flex items-center gap-2 px-3 py-1 text-sm bg-surface-hover rounded">
          <span className="text-text-secondary">Estimado:</span>
          <span className="font-semibold text-text-primary">{estimation.estimatedHours}h</span>
          {estimation.actualHours > 0 && (
            <>
              <span className="text-text-secondary">• Real:</span>
              <span className={`font-semibold ${
                estimation.actualHours <= estimation.estimatedHours ? 'text-green-400' : 'text-orange-400'
              }`}>
                {estimation.actualHours}h
              </span>
            </>
          )}
        </div>
      )}

      {/* Tags rápidas */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded text-white"
              style={{ backgroundColor: `var(--tag-${tag})` || '#64748b' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

