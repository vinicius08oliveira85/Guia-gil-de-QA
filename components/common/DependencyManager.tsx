import React, { useState, useMemo } from 'react';
import { Project, JiraTask } from '../../types';
import { 
  getTaskDependencies, 
  getTaskDependents, 
  canAddDependency, 
  addDependency, 
  removeDependency,
  getBlockedTasks,
  getReadyTasks
} from '../../utils/dependencyService';
import { useErrorHandler } from '../../hooks/useErrorHandler';

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
  onClose
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const dependencies = useMemo(() => getTaskDependencies(task.id, project), [task.id, project]);
  const dependents = useMemo(() => getTaskDependents(task.id, project), [task.id, project]);
  const availableTasks = useMemo(() => 
    project.tasks.filter(t => 
      t.id !== task.id && 
      !(task.dependencies || []).includes(t.id)
    ), 
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Dependências da Tarefa</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">✕</button>
      </div>

      {/* Status da tarefa */}
      <div className="p-3 rounded-lg border border-surface-border">
        {isBlocked && (
          <div className="flex items-center gap-2 text-orange-400">
            <span>⚠️</span>
            <span className="font-semibold">Esta tarefa está bloqueada por dependências não concluídas</span>
          </div>
        )}
        {isReady && !isBlocked && (
          <div className="flex items-center gap-2 text-green-400">
            <span>✅</span>
            <span className="font-semibold">Esta tarefa está pronta para ser iniciada</span>
          </div>
        )}
        {!isBlocked && !isReady && dependencies.length === 0 && (
          <div className="text-text-secondary">Nenhuma dependência definida</div>
        )}
      </div>

      {/* Dependências (bloqueiam esta tarefa) */}
      <div>
        <h4 className="text-md font-semibold text-text-primary mb-2">
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
                  className={`p-3 rounded-lg border ${
                    isCompleted 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-orange-500/50 bg-orange-500/10'
                  } flex items-center justify-between`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{isCompleted ? '✅' : '⏳'}</span>
                      <span className="font-semibold text-text-primary">{depTask.id}</span>
                      <span className="text-text-secondary">{depTask.title}</span>
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      Status: {depTask.status === 'Done' ? 'Concluída' : depTask.status === 'In Progress' ? 'Em Andamento' : 'A Fazer'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDependency(dep.id)}
                    className="text-red-400 hover:text-red-300 px-2"
                    title="Remover dependência"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-secondary text-sm">Nenhuma dependência definida</p>
        )}
      </div>

      {/* Adicionar nova dependência */}
      <div className="border-t border-surface-border pt-4">
        <h4 className="text-md font-semibold text-text-primary mb-2">Adicionar Dependência</h4>
        <div className="flex gap-2">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary"
          >
            <option value="">Selecione uma tarefa...</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.id}: {t.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddDependency}
            disabled={!selectedTaskId}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Dependentes (são bloqueados por esta tarefa) */}
      {dependents.length > 0 && (
        <div className="border-t border-surface-border pt-4">
          <h4 className="text-md font-semibold text-text-primary mb-2">
            Tarefas que dependem desta ({dependents.length})
          </h4>
          <div className="space-y-2">
            {dependents.map(dep => {
              const depTask = project.tasks.find(t => t.id === dep.id);
              if (!depTask) return null;
              
              return (
                <div
                  key={dep.id}
                  className="p-2 rounded-lg border border-surface-border bg-surface/50"
                >
                  <span className="font-semibold text-text-primary">{depTask.id}</span>
                  <span className="text-text-secondary ml-2">{depTask.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

