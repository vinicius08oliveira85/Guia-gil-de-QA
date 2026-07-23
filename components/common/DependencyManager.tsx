import React, { useState, useMemo } from 'react';
import { Button } from './Button';
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
import { AppSelect } from '../common/AppSelect';
import {
  neuCardClass,
  neuDividerClass,
  neuSurfaceClass,
} from './neuUi';

interface DependencyManagerProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClose: () => void;
}

export const DependencyManager: React.FC<DependencyManagerProps> = ({
  task,
  project,
  onUpdateProject,
  onClose,
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

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

  const isBlocked = blockedTasks.some(t => t.id === task.id);
  const isReady = readyTasks.some(t => t.id === task.id);

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-base-content">Dependências da Tarefa</h3>
        <Button type="button" onClick={onClose} size="circle" variant="ghost">
          ✕
        </Button>
      </div>

      {/* Status da tarefa */}
      <div className={cn(neuCardClass, 'rounded-xl')}>
        {isBlocked && (
          <div className="flex items-center gap-2 text-warning">
            <span>⚠️</span>
            <span className="font-semibold">
              Esta tarefa está bloqueada por dependências não concluídas
            </span>
          </div>
        )}
        {isReady && !isBlocked && (
          <div className="flex items-center gap-2 text-success">
            <span>✅</span>
            <span className="font-semibold">Esta tarefa está pronta para ser iniciada</span>
          </div>
        )}
        {!isBlocked && !isReady && dependencies.length === 0 && (
          <div className="text-base-content/70">Nenhuma dependência definida</div>
        )}
      </div>

      {/* Dependências (bloqueiam esta tarefa) */}
      <div>
        <h4 className="text-md font-semibold text-base-content mb-2">
          Dependências ({dependencies.length})
        </h4>
        {dependencies.length > 0 ? (
          <div className="space-y-2">
            {dependencies.map(dep => {
              const depTask = project.tasks.find(t => t.id === dep.id);
              if (!depTask) return null;

              const isCompleted = depTask.status === 'Done';

              return (
                <div
                  key={dep.id}
                  className={cn(
                    'p-3 rounded-xl border flex items-center justify-between transition-all',
                    isCompleted
                      ? 'border-success/30 bg-success/10'
                      : 'border-warning/30 bg-warning/10'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{isCompleted ? '✅' : '⏳'}</span>
                      <span className="font-semibold text-base-content">{depTask.id}</span>
                      <span className="text-base-content/70">{depTask.title}</span>
                    </div>
                    <div className="text-sm text-base-content/70 mt-1">
                      Status:{' '}
                      {depTask.status === 'Done'
                        ? 'Concluída'
                        : depTask.status === 'In Progress'
                          ? 'Em Andamento'
                          : 'A Fazer'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleRemoveDependency(dep.id)}
                    size="circle"
                    variant="ghost"
                    className="text-error"
                    title="Remover dependência"
                  >
                    ✕
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-base-content/70 text-sm">Nenhuma dependência definida</p>
        )}
      </div>

      {/* Adicionar nova dependência */}
      <div className="border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pt-4">
        <h4 className="text-md font-semibold text-base-content mb-2">Adicionar Dependência</h4>
        <div className="flex gap-2">
          <AppSelect
            value={selectedTaskId}
            onChange={v => setSelectedTaskId(v)}
            className={cn('select select-bordered app-select flex-1 text-base-content', neuSurfaceClass)}
          >
            <option value="">Selecione uma tarefa...</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.id}: {t.title}
              </option>
            ))}
          </AppSelect>
          <Button
            type="button"
            onClick={handleAddDependency}
            disabled={!selectedTaskId}
            size="sm"
            variant="default"
            className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Dependentes (são bloqueados por esta tarefa) */}
      {dependents.length > 0 && (
        <div className="border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pt-4">
          <h4 className="text-md font-semibold text-base-content mb-2">
            Tarefas que dependem desta ({dependents.length})
          </h4>
          <div className="space-y-2">
            {dependents.map(dep => {
              const depTask = project.tasks.find(t => t.id === dep.id);
              if (!depTask) return null;

              return (
                <div key={dep.id} className={cn(neuCardClass, 'rounded-lg p-3')}>
                  <span className="font-semibold text-base-content">{depTask.id}</span>
                  <span className="text-base-content/70 ml-2">{depTask.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
