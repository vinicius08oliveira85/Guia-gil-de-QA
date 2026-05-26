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
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalInsetClass,
  leveTaskModalMutedClass,
  leveTaskModalSectionClass,
  leveTaskModalStatPillActiveClass,
  leveTaskModalStrongClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
  leveViewSearchInputClass,
} from '../common/projectCardUi';
import {
  taskNeuDividerClass,
  taskStatusNeutralClass,
  taskTypeDefaultBadgeClass,
  taskTypeDefaultStripeClass,
} from './taskActionLayout';
import { JiraIssueTypeIcon } from '../common/Icons';
import { EmptyState } from '../common/EmptyState';
import { getDisplayStatusLabel } from '../../utils/taskHelpers';
import { AppSelect } from '../common/AppSelect';

interface TaskLinksViewProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenTask?: (task: JiraTask) => void;
}

/** Faixa lateral / badge por tipo — tokens Daisy (tema Dim). */
function taskTypeStripeClass(type: string): string {
  switch (type) {
    case 'Epic':
      return 'bg-primary';
    case 'História':
      return 'bg-success';
    case 'Tarefa':
      return 'bg-info';
    case 'Bug':
      return 'bg-error';
    default:
      return taskTypeDefaultStripeClass;
  }
}

function taskTypeBadgeClass(type: string): string {
  switch (type) {
    case 'Epic':
      return 'badge badge-sm border-0 bg-primary text-primary-content';
    case 'História':
      return 'badge badge-sm border-0 bg-success text-success-content';
    case 'Tarefa':
      return 'badge badge-sm border-0 bg-info text-info-content';
    case 'Bug':
      return 'badge badge-sm border-0 bg-error text-error-content';
    default:
      return taskTypeDefaultBadgeClass;
  }
}

// Cores para status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Done':
      return 'border-success/40 bg-success/10 text-success';
    case 'In Progress':
      return 'border-warning/40 bg-warning/10 text-warning';
    case 'To Do':
      return cn('border', taskStatusNeutralClass);
    default:
      return cn('border', taskStatusNeutralClass);
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
    const stripeClass = taskTypeStripeClass(relatedTask.type);
    const typeBadgeClasses = taskTypeBadgeClass(relatedTask.type);
    const isHovered = hoveredCardId === relatedTask.id;

    return (
      <div
        key={relatedTask.id}
        className={cn(
          leveTaskModalSectionClass,
          'group relative cursor-pointer border-2 p-4 transition-all duration-200',
          'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] hover:shadow-[0_4px_18px_rgba(252,76,2,0.1)]',
          statusColor,
          isHovered && 'ring-2 ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]'
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
          className={cn('absolute bottom-0 left-0 top-0 w-1 rounded-l-[1.4rem]', stripeClass)}
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3 ml-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <JiraIssueTypeIcon
                type={relatedTask.type}
                iconUrl={relatedTask.jiraIssueTypeIconUrl}
                size={16}
              />
              <span className={cn('font-mono text-sm font-semibold', leveTaskModalStrongClass)}>
                {relatedTask.id}
              </span>
              <span className={typeBadgeClasses}>{relatedTask.type}</span>
            </div>

            <h4 className={cn('mb-2 line-clamp-2 font-semibold', leveTaskModalStrongClass)}>
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
    <div className="space-y-3">
      {/* Status da tarefa */}
      {(isBlocked || isReady) && (
        <div
          className={cn(
            'rounded-[var(--leve-header-radius)] border px-3 py-2',
            isBlocked
              ? 'border-[color-mix(in_srgb,oklch(var(--wa))_40%,transparent)] bg-[color-mix(in_srgb,oklch(var(--wa))_10%,var(--leve-header-bg))]'
              : 'border-[color-mix(in_srgb,oklch(var(--su))_40%,transparent)] bg-[color-mix(in_srgb,oklch(var(--su))_10%,var(--leve-header-bg))]'
          )}
        >
          {isBlocked && (
            <div className="flex items-center gap-1.5 text-warning text-sm">
              <span className="text-base">⚠️</span>
              <span className="font-medium">
                Esta tarefa está bloqueada por dependências não concluídas
              </span>
            </div>
          )}
          {isReady && !isBlocked && (
            <div className="flex items-center gap-1.5 text-success text-sm">
              <span className="text-base">✅</span>
              <span className="font-medium">Esta tarefa está pronta para ser iniciada</span>
            </div>
          )}
        </div>
      )}

      {/* Seção: Bloqueado Por (Dependencies) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn(leveTaskModalFieldLabelClass, 'flex items-center gap-2 !normal-case')}>
            <span className="text-base">🔒</span>
            <span>Bloqueado Por</span>
            <span className={leveTaskModalStatPillActiveClass}>{dependencies.length}</span>
          </h3>
          {!showAddDependency && (
            <button
              type="button"
              onClick={() => setShowAddDependency(true)}
              className={cn(leveViewPrimaryBtnClass, 'min-h-0 h-8 px-2.5 text-xs')}
            >
              + Adicionar Dependência
            </button>
          )}
        </div>

        {showAddDependency && (
          <div className={cn(leveTaskModalInsetClass, 'mb-2')}>
            <div className="flex gap-2">
              <AppSelect
                value={selectedTaskId}
                onChange={v => setSelectedTaskId(v)}
                className={cn(leveViewSearchInputClass, 'select flex-1')}
              >
                <option value="">Selecione uma tarefa...</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id}: {t.title}
                  </option>
                ))}
              </AppSelect>
              <button
                type="button"
                onClick={handleAddDependency}
                disabled={!selectedTaskId}
                className={cn(leveViewPrimaryBtnClass, 'text-xs disabled:cursor-not-allowed disabled:opacity-50')}
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddDependency(false);
                  setSelectedTaskId('');
                }}
                className={leveViewOutlineBtnClass}
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
                      className="absolute left-2 top-full -z-10 h-3 w-0.5 bg-[color-mix(in_srgb,var(--leve-neu-dark)_22%,var(--leve-neu-bg))]"
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
            compact
            icon="🔗"
            title="Nenhuma dependência"
            description="Esta tarefa não depende de outras tarefas."
          />
        )}
      </div>

      {/* Divisor visual entre seções */}
      {dependencies.length > 0 && dependents.length > 0 && (
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className={cn('w-full border-t border-dashed', taskNeuDividerClass)}></div>
          </div>
          <div className="relative flex justify-center">
            <div className="leve-neu-surface px-4 text-sm text-base-content/50">
              Tarefa atual: {task.id}
            </div>
          </div>
        </div>
      )}

      {/* Seção: Bloqueando (Dependents) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn(leveTaskModalFieldLabelClass, 'flex items-center gap-2 !normal-case')}>
            <span className="text-base">⚡</span>
            <span>Bloqueando</span>
            <span className={leveTaskModalStatPillActiveClass}>{dependents.length}</span>
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
                      className="absolute left-2 top-full -z-10 h-3 w-0.5 bg-[color-mix(in_srgb,var(--leve-neu-dark)_22%,var(--leve-neu-bg))]"
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
            compact
            icon="⚡"
            title="Nenhuma tarefa dependente"
            description="Nenhuma outra tarefa depende desta."
          />
        )}
      </div>
    </div>
  );
};
