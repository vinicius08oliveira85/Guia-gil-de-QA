import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { useProjectsStore } from '../../store/projectsStore';

interface BulkActionsProps {
  selectedTasks: string[] | Set<string>;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClearSelection: () => void;
  onProjectCreated?: (projectId: string) => void;
  onEditTask?: (taskId: string) => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTasks,
  project,
  onUpdateProject,
  onClearSelection,
  onProjectCreated,
  onEditTask,
}) => {
  const { handleSuccess, handleError } = useErrorHandler();
  const { createProject } = useProjectsStore();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'status' | 'tag' | 'assignee' | 'create-project' | null>(
    null
  );
  const [statusValue, setStatusValue] = useState<'To Do' | 'In Progress' | 'Done'>('To Do');
  const [tagValue, setTagValue] = useState('');
  const [assigneeValue, setAssigneeValue] = useState<'Product' | 'QA' | 'Dev'>('QA');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para criação de projeto
  const [showTaskSelectionModal, setShowTaskSelectionModal] = useState(false);
  const [showProjectNameModal, setShowProjectNameModal] = useState(false);
  const [selectedTasksForProject, setSelectedTasksForProject] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Converter selectedTasks para array se for Set
  const selectedTasksArray = useMemo(() => {
    return selectedTasks instanceof Set ? Array.from(selectedTasks) : selectedTasks;
  }, [selectedTasks]);

  // Obter tasks selecionadas
  const selectedTasksData = useMemo(() => {
    return (project.tasks || []).filter(task => selectedTasksArray.includes(task.id));
  }, [project.tasks, selectedTasksArray]);

  // Exibir Favoritar só se há selecionada não favorita; Desfavoritar só se há favorita
  const hasSelectedFavorited = useMemo(
    () => selectedTasksData.some(task => task.isFavorite),
    [selectedTasksData]
  );
  const hasSelectedNonFavorited = useMemo(
    () => selectedTasksData.some(task => !task.isFavorite),
    [selectedTasksData]
  );

  const handleBulkStatusChange = () => {
    const updatedTasks = (project.tasks || []).map(task =>
      selectedTasksArray.includes(task.id) ? { ...task, status: statusValue } : task
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`${selectedTasksArray.length} tarefas atualizadas`);
    setShowModal(false);
    onClearSelection();
  };

  const handleBulkTagAdd = () => {
    if (!tagValue.trim()) {
      handleError(new Error('Digite uma tag'));
      return;
    }

    const updatedTasks = (project.tasks || []).map(task => {
      if (selectedTasksArray.includes(task.id)) {
        const tags = task.tags || [];
        if (!tags.includes(tagValue.trim())) {
          return { ...task, tags: [...tags, tagValue.trim()] };
        }
      }
      return task;
    });

    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`Tag "${tagValue}" adicionada a ${selectedTasksArray.length} tarefas`);
    setShowModal(false);
    setTagValue('');
    onClearSelection();
  };

  const handleBulkAssigneeChange = () => {
    const updatedTasks = (project.tasks || []).map(task =>
      selectedTasksArray.includes(task.id) ? { ...task, assignee: assigneeValue } : task
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`${selectedTasksArray.length} tarefas atribuídas`);
    setShowModal(false);
    onClearSelection();
  };

  const handleBulkFavorite = () => {
    const updatedTasks = (project.tasks || []).map(task =>
      selectedTasksArray.includes(task.id) ? { ...task, isFavorite: true } : task
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`${selectedTasksArray.length} tarefa(s) favoritada(s)`);
    onClearSelection();
  };

  const handleBulkUnfavorite = () => {
    const updatedTasks = (project.tasks || []).map(task =>
      selectedTasksArray.includes(task.id) ? { ...task, isFavorite: false } : task
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`${selectedTasksArray.length} tarefa(s) desfavoritada(s)`);
    onClearSelection();
  };

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    const idsSet = new Set(selectedTasksArray);
    let tasksToKeep = (project.tasks || []).map(t =>
      t.parentId && idsSet.has(t.parentId) ? { ...t, parentId: undefined } : t
    );
    tasksToKeep = tasksToKeep.filter(t => !idsSet.has(t.id));
    onUpdateProject({ ...project, tasks: tasksToKeep });
    handleSuccess(`${selectedTasksArray.length} tarefa(s) excluída(s)`);
    setShowDeleteConfirm(false);
    onClearSelection();
  };

  const handleBulkEdit = () => {
    if (selectedTasksArray.length === 0) return;
    const taskId = selectedTasksArray[0];
    onClearSelection();
    onEditTask?.(taskId);
  };

  const handleCreateProjectClick = () => {
    // Inicializar com todas as tasks selecionadas
    setSelectedTasksForProject(new Set(selectedTasksArray));
    setShowTaskSelectionModal(true);
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasksForProject(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleProceedToProjectName = () => {
    if (selectedTasksForProject.size === 0) {
      handleError(new Error('Selecione pelo menos uma tarefa para criar o projeto'));
      return;
    }
    setShowTaskSelectionModal(false);
    setShowProjectNameModal(true);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      handleError(new Error('Digite um nome para o projeto'));
      return;
    }

    try {
      // Obter tasks selecionadas
      const tasksToInclude = (project.tasks || []).filter(task =>
        selectedTasksForProject.has(task.id)
      );

      // Criar novo projeto
      const createdProject = await createProject(
        projectName.trim(),
        projectDescription.trim() || ''
      );

      // Atualizar o projeto criado com as tasks
      const updatedProject = {
        ...createdProject,
        tasks: tasksToInclude.map(task => ({
          ...task,
          // Manter todos os dados originais da task
        })),
      };

      await useProjectsStore.getState().updateProject(updatedProject);

      handleSuccess(
        `Projeto "${projectName}" criado com ${selectedTasksForProject.size} tarefa(s)!`
      );
      setShowProjectNameModal(false);
      setProjectName('');
      setProjectDescription('');
      setSelectedTasksForProject(new Set());
      onClearSelection();

      if (onProjectCreated) {
        onProjectCreated(updatedProject.id);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao criar projeto'));
    }
  };

  if (selectedTasksArray.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 w-[min(100%-1.5rem,42rem)] -translate-x-1/2 px-0 sm:w-[min(100%-2rem,48rem)]">
        <div className="flex flex-col gap-3 rounded-[var(--rounded-box)] border border-base-300 bg-base-100/95 px-3 py-3 shadow-2xl ring-1 ring-base-content/[0.04] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5">
          <span className="text-center font-heading text-sm font-semibold tabular-nums text-base-content sm:min-w-0 sm:flex-1 sm:text-left">
            {selectedTasksArray.length} tarefa{selectedTasksArray.length > 1 ? 's' : ''} selecionada
            {selectedTasksArray.length > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 sm:justify-end sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setAction('status');
                setShowModal(true);
              }}
              className="btn btn-ghost btn-sm min-h-[44px] rounded-full border border-transparent hover:border-base-300 sm:min-h-8"
            >
              Alterar Status
            </button>
            <button
              type="button"
              onClick={() => {
                setAction('tag');
                setShowModal(true);
              }}
              className="btn btn-ghost btn-sm min-h-[44px] rounded-full border border-transparent hover:border-base-300 sm:min-h-8"
            >
              Adicionar Tag
            </button>
            <button
              type="button"
              onClick={() => {
                setAction('assignee');
                setShowModal(true);
              }}
              className="btn btn-ghost btn-sm min-h-[44px] rounded-full border border-transparent hover:border-base-300 sm:min-h-8"
            >
              Atribuir
            </button>
            {hasSelectedNonFavorited && (
              <button
                type="button"
                onClick={handleBulkFavorite}
                className="btn btn-ghost btn-sm min-h-[44px] rounded-full border border-transparent hover:border-base-300 sm:min-h-8"
                aria-label="Favoritar tarefas selecionadas"
              >
                Favoritar
              </button>
            )}
            {hasSelectedFavorited && (
              <button
                type="button"
                onClick={handleBulkUnfavorite}
                className="btn btn-ghost btn-sm min-h-[44px] rounded-full border border-transparent hover:border-base-300 sm:min-h-8"
                aria-label="Desfavoritar tarefas selecionadas"
              >
                Desfavoritar
              </button>
            )}
            <button
              type="button"
              onClick={handleCreateProjectClick}
              className="btn btn-primary btn-sm min-h-[44px] rounded-full shadow-sm sm:min-h-8"
            >
              Criar Projeto
            </button>
            {onEditTask && (
              <button
                type="button"
                onClick={handleBulkEdit}
                className="btn btn-ghost btn-sm min-h-[44px] rounded-full border border-transparent hover:border-base-300 sm:min-h-8"
                aria-label="Editar tarefa selecionada"
              >
                Editar
              </button>
            )}
            <button
              type="button"
              onClick={handleBulkDelete}
              className="btn btn-ghost btn-sm min-h-[44px] rounded-full text-error hover:border-error/30 hover:bg-error/10 sm:min-h-8"
              aria-label="Excluir tarefas selecionadas"
            >
              Excluir
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="btn btn-outline btn-sm min-h-[44px] rounded-full border-base-300 sm:min-h-8"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setAction(null);
        }}
        title={`Ação em Lote - ${selectedTasksArray.length} tarefas`}
      >
        <div className="space-y-4 font-body">
          {action === 'status' && (
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="bulk-status-select">
                <span className="label-text font-medium text-base-content">Novo status</span>
              </label>
              <select
                id="bulk-status-select"
                value={statusValue}
                onChange={e => setStatusValue(e.target.value as 'To Do' | 'In Progress' | 'Done')}
                className="select select-bordered w-full bg-base-100"
              >
                <option value="To Do">A Fazer</option>
                <option value="In Progress">Em Andamento</option>
                <option value="Done">Concluído</option>
              </select>
              <button
                type="button"
                onClick={handleBulkStatusChange}
                className="btn btn-primary mt-2 w-full rounded-full"
              >
                Aplicar status
              </button>
            </div>
          )}

          {action === 'tag' && (
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="bulk-tag-input">
                <span className="label-text font-medium text-base-content">Tag para adicionar</span>
              </label>
              <input
                id="bulk-tag-input"
                type="text"
                value={tagValue}
                onChange={e => setTagValue(e.target.value)}
                placeholder="Ex: crítico, regressão..."
                className="input input-bordered w-full bg-base-100"
              />
              <button
                type="button"
                onClick={handleBulkTagAdd}
                className="btn btn-primary mt-2 w-full rounded-full"
              >
                Adicionar tag
              </button>
            </div>
          )}

          {action === 'assignee' && (
            <div className="form-control w-full">
              <label className="label py-0" htmlFor="bulk-assignee-select">
                <span className="label-text font-medium text-base-content">Atribuir a</span>
              </label>
              <select
                id="bulk-assignee-select"
                value={assigneeValue}
                onChange={e =>
                  setAssigneeValue(e.target.value as 'Product' | 'QA' | 'Dev')
                }
                className="select select-bordered w-full bg-base-100"
              >
                <option value="Product">Produto</option>
                <option value="QA">QA</option>
                <option value="Dev">Desenvolvimento</option>
              </select>
              <button
                type="button"
                onClick={handleBulkAssigneeChange}
                className="btn btn-primary mt-2 w-full rounded-full"
              >
                Atribuir
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Seleção de Tasks */}
      <Modal
        isOpen={showTaskSelectionModal}
        onClose={() => {
          setShowTaskSelectionModal(false);
          setSelectedTasksForProject(new Set());
        }}
        title="Selecionar Tarefas para o Projeto"
      >
        <div className="space-y-4 font-body">
          <p className="text-sm text-base-content/75">
            Selecione as tarefas que deseja incluir no novo projeto. Você pode selecionar ou
            desmarcar tarefas.
          </p>
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-[var(--rounded-box)] border border-base-300 bg-base-200/50 p-3 dark:bg-base-200/30">
            {selectedTasksData.map(task => (
              <label
                key={task.id}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-3 hover:bg-base-200/70 dark:hover:bg-base-300/40"
              >
                <input
                  type="checkbox"
                  checked={selectedTasksForProject.has(task.id)}
                  onChange={() => handleTaskToggle(task.id)}
                  className="checkbox checkbox-primary checkbox-sm mt-1 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-md bg-primary/12 px-2 py-0.5 text-xs font-semibold text-primary">
                      {task.type}
                    </span>
                    <span className="text-sm font-medium text-base-content">{task.id}</span>
                  </div>
                  <p className="mb-1 text-sm font-semibold text-base-content">{task.title}</p>
                  {task.description && (
                    <p className="line-clamp-2 text-xs text-base-content/70">{task.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-base-300 pt-2">
            <button
              onClick={() => {
                setShowTaskSelectionModal(false);
                setSelectedTasksForProject(new Set());
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleProceedToProjectName}
              disabled={selectedTasksForProject.size === 0}
              className="btn btn-primary"
            >
              Gerar Projeto ({selectedTasksForProject.size})
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Nome e Descrição do Projeto */}
      <Modal
        isOpen={showProjectNameModal}
        onClose={() => {
          setShowProjectNameModal(false);
          setProjectName('');
          setProjectDescription('');
        }}
        title="Criar Novo Projeto"
      >
        <div className="space-y-4 font-body">
          <div className="form-control w-full">
            <label className="label py-0" htmlFor="bulk-new-project-name">
              <span className="label-text font-medium text-base-content">
                Nome do Projeto <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="bulk-new-project-name"
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Ex: Projeto de Testes - Sprint 1"
              className="input input-bordered w-full bg-base-100"
              autoFocus
            />
          </div>
          <div className="form-control w-full">
            <label className="label py-0" htmlFor="bulk-new-project-desc">
              <span className="label-text font-medium text-base-content">Descrição (opcional)</span>
            </label>
            <textarea
              id="bulk-new-project-desc"
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              placeholder="Descreva o objetivo deste projeto..."
              rows={4}
              className="textarea textarea-bordered w-full resize-none bg-base-100"
            />
          </div>
          <div className="text-xs text-base-content/70">
            <p>
              O projeto será criado com {selectedTasksForProject.size} tarefa(s) selecionada(s).
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-base-300 pt-2">
            <button
              onClick={() => {
                setShowProjectNameModal(false);
                setProjectName('');
                setProjectDescription('');
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateProject}
              disabled={!projectName.trim()}
              className="btn btn-primary"
            >
              Criar Projeto
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Excluir tarefas selecionadas"
        message={`Tem certeza que deseja excluir ${selectedTasksArray.length} tarefa(s)? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};
