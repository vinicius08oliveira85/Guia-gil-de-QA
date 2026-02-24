import React, { useState, useMemo } from 'react';
import { Project, JiraTask } from '../../types';
import {
  getTaskDependencies,
  getTaskDependents,
  canAddDependency,
  addDependency,
  removeDependency,
  getBlockedTasks,
  getReadyTasks,
} from '../../utils/dependencyService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { cn } from '../../utils/cn';
import { TaskTypeIcon } from '../common/Icons';
import { EmptyState } from '../common/EmptyState';
import { getDisplayStatusLabel } from '../../utils/taskHelpers';

interface TaskLinksViewProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenTask?: (task: JiraTask) => void;
}

// Cores para tipos de tarefa
const taskTypeColors: Record<string, string> = {
  Epic: '#8B5CF6',
  História: '#3B82F6',
  Tarefa: '#10B981',
  Bug: '#EF4444',
};

// Cores para status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Done':
      return 'border-success/40 bg-success/10 text-success';
    case 'In Progress':
      return 'border-warning/40 bg-warning/10 text-warning';
    case 'To Do':
      return 'border-base-300 bg-base-200 text-base-content/70';
    default:
      return 'border-base-300 bg-base-200 text-base-content/70';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Done':
      return '✅';
    case 'In Progress':
      return '⏳';
    case 'To Do':
      return '📋';
    default:
      return '📋';
  }
};

export const TaskLinksView: React.FC<TaskLinksViewProps> = ({
  task,
  project,
  onUpdateProject,
  onOpenTask,
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const dependencies = useMemo(() => getTaskDependencies(task.id, project), [task.id, project]);
  const dependents = useMemo(() => getTaskDependents(task.id, project), [task.id, project]);
  const availableTasks = useMemo(
    () => project.tasks.filter(t => t.id !== task.id && !(task.dependencies || []).includes(t.id)),
    [project.tasks, task]
  );
  const blockedTasks = useMemo(() => getBlockedTasks(project), [project]);
  const readyTasks = useMemo(() => getReadyTasks(project), [project]);

  const handleAddDependency = () => {
    if (!selectedTaskId) {
      handleError(new Error('Selecione uma tarefa'));
      return;
    }

    const validation = canAddDependency(task.id, selectedTaskId, project);
    if (!validation.canAdd) {
      handleError(new Error(validation.reason || 'Não é possível adicionar esta dependência'));
      return;
    }

    try {
      const updatedProject = addDependency(task.id, selectedTaskId, project);
      onUpdateProject(updatedProject);
      handleSuccess('Dependência adicionada com sucesso');
      setSelectedTaskId('');
      setShowAddDependency(false);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao adicionar dependência'));
    }
  };

  const handleRemoveDependency = (dependencyId: string) => {
    try {
      const updatedProject = removeDependency(task.id, dependencyId, project);
      onUpdateProject(updatedProject);
      handleSuccess('Dependência removida');
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao remover dependência'));
    }
  };

  const handleTaskClick = (relatedTask: JiraTask) => {
    if (onOpenTask) {
      onOpenTask(relatedTask);
    }
  };

  const isBlocked = blockedTasks.some(t => t.id === task.id);
  const isReady = readyTasks.some(t => t.id === task.id);

  const renderTaskCard = (relatedTask: JiraTask, isDependency: boolean) => {
    const statusColor = getStatusColor(relatedTask.status);
    const statusIcon = getStatusIcon(relatedTask.status);
    const typeColor = taskTypeColors[relatedTask.type] || '#6b7280';
    const isHovered = hoveredCardId === relatedTask.id;

    return (
      <div
        key={relatedTask.id}
        className={cn(
          'group relative p-4 rounded-xl border-2 transition-all duration-200',
          'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
          statusColor,
          isHovered && 'ring-2 ring-primary/50'
        )}
        onClick={() => handleTaskClick(relatedTask)}
        onMouseEnter={() => setHoveredCardId(relatedTask.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        role="button"
        tabIndex={0}
        aria-label={`Abrir tarefa ${relatedTask.id}: ${relatedTask.title}`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTaskClick(relatedTask);
          }
        }}
      >
        {/* Barra lateral colorida por tipo */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: typeColor }}
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3 ml-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TaskTypeIcon type={relatedTask.type} />
              <span className="font-mono text-sm font-semibold text-base-content">
                {relatedTask.id}
              </span>
              <span
                className="badge badge-sm text-white border-0"
                style={{ backgroundColor: typeColor }}
              >
                {relatedTask.type}
              </span>
            </div>

            <h4 className="font-semibold text-base-content mb-2 line-clamp-2">
              {relatedTask.title}
            </h4>

            <div className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  'flex items-center gap-1 font-medium',
                  relatedTask.status === 'Done'
                    ? 'text-success'
                    : relatedTask.status === 'In Progress'
                      ? 'text-warning'
                      : 'text-base-content/70'
                )}
              >
                <span>{statusIcon}</span>
                <span>{getDisplayStatusLabel(relatedTask, project)}</span>
              </span>
              {relatedTask.priority && (
                <span className="badge badge-sm badge-outline">{relatedTask.priority}</span>
              )}
            </div>
          </div>

          {/* Botão remover - aparece no hover */}
          {isDependency && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleRemoveDependency(relatedTask.id);
              }}
              className={cn(
                'btn btn-ghost btn-sm btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-error/20 focus-visible:opacity-100'
              )}
              title="Remover dependência"
              aria-label={`Remover dependência ${relatedTask.id}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status da tarefa */}
      {(isBlocked || isReady) && (
        <div
          className={cn(
            'p-4 rounded-xl border-2',
            isBlocked ? 'border-warning/40 bg-warning/10' : 'border-success/40 bg-success/10'
          )}
        >
          {isBlocked && (
            <div className="flex items-center gap-2 text-warning">
              <span className="text-xl">⚠️</span>
              <span className="font-semibold">
                Esta tarefa está bloqueada por dependências não concluídas
              </span>
            </div>
          )}
          {isReady && !isBlocked && (
            <div className="flex items-center gap-2 text-success">
              <span className="text-xl">✅</span>
              <span className="font-semibold">Esta tarefa está pronta para ser iniciada</span>
            </div>
          )}
        </div>
      )}

      {/* Seção: Bloqueado Por (Dependencies) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <span>Bloqueado Por</span>
            <span className="badge badge-primary badge-sm">{dependencies.length}</span>
          </h3>
          {!showAddDependency && (
            <button
              type="button"
              onClick={() => setShowAddDependency(true)}
              className="btn btn-primary btn-sm"
            >
              + Adicionar Dependência
            </button>
          )}
        </div>

        {showAddDependency && (
          <div className="mb-4 p-4 bg-base-200 rounded-xl border border-base-300">
            <div className="flex gap-2">
              <select
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                className="select select-bordered flex-1 bg-base-100 border-base-300 text-base-content"
              >
                <option value="">Selecione uma tarefa...</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id}: {t.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDependency}
                disabled={!selectedTaskId}
                className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddDependency(false);
                  setSelectedTaskId('');
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {dependencies.length > 0 ? (
          <div className="space-y-3 relative">
            {dependencies.map((dep, index) => {
              const depTask = project.tasks.find(t => t.id === dep.id);
              if (!depTask) return null;

              return (
                <div key={dep.id} className="relative">
                  {/* Linha conectora vertical (exceto no último item) */}
                  {index < dependencies.length - 1 && (
                    <div
                      className="absolute left-2 top-full w-0.5 h-3 bg-base-300/50 -z-10"
                      style={{ marginTop: '0.75rem' }}
                      aria-hidden="true"
                    />
                  )}
                  {/* Seta apontando para baixo */}
                  {index < dependencies.length - 1 && (
                    <div
                      className="absolute left-1.5 top-full text-base-300/50 -z-10"
                      style={{ marginTop: '1rem', fontSize: '0.5rem' }}
                      aria-hidden="true"
                    >
                      ↓
                    </div>
                  )}
                  {renderTaskCard(depTask, true)}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="🔗"
            title="Nenhuma dependência"
            description="Esta tarefa não depende de outras tarefas."
          />
        )}
      </div>

      {/* Divisor visual entre seções */}
      {dependencies.length > 0 && dependents.length > 0 && (
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-base-300"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-base-100 px-4 text-base-content/50 text-sm">
              Tarefa atual: {task.id}
            </div>
          </div>
        </div>
      )}

      {/* Seção: Bloqueando (Dependents) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span>Bloqueando</span>
            <span className="badge badge-primary badge-sm">{dependents.length}</span>
          </h3>
        </div>

        {dependents.length > 0 ? (
          <div className="space-y-3 relative">
            {dependents.map((dep, index) => {
              const depTask = project.tasks.find(t => t.id === dep.id);
              if (!depTask) return null;

              return (
                <div key={dep.id} className="relative">
                  {/* Linha conectora vertical (exceto no último item) */}
                  {index < dependents.length - 1 && (
                    <div
                      className="absolute left-2 top-full w-0.5 h-3 bg-base-300/50 -z-10"
                      style={{ marginTop: '0.75rem' }}
                      aria-hidden="true"
                    />
                  )}
                  {/* Seta apontando para baixo */}
                  {index < dependents.length - 1 && (
                    <div
                      className="absolute left-1.5 top-full text-base-300/50 -z-10"
                      style={{ marginTop: '1rem', fontSize: '0.5rem' }}
                      aria-hidden="true"
                    >
                      ↓
                    </div>
                  )}
                  {renderTaskCard(depTask, false)}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="⚡"
            title="Nenhuma tarefa dependente"
            description="Nenhuma outra tarefa depende desta."
          />
        )}
      </div>
    </div>
  );
};
