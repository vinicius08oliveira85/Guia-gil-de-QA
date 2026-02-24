import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Modal } from './Modal';
import { useProjectsStore } from '../../store/projectsStore';

interface BulkActionsProps {
  selectedTasks: string[] | Set<string>;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClearSelection: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTasks,
  project,
  onUpdateProject,
  onClearSelection,
  onProjectCreated
}) => {
  const { handleSuccess, handleError } = useErrorHandler();
  const { createProject } = useProjectsStore();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'status' | 'tag' | 'assignee' | 'create-project' | null>(null);
  const [statusValue, setStatusValue] = useState<'To Do' | 'In Progress' | 'Done'>('To Do');
  const [tagValue, setTagValue] = useState('');
  const [assigneeValue, setAssigneeValue] = useState<'Product' | 'QA' | 'Dev'>('QA');
  
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
      selectedTasksArray.includes(task.id)
        ? { ...task, status: statusValue }
        : task
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
      selectedTasksArray.includes(task.id)
        ? { ...task, assignee: assigneeValue }
        : task
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
      const createdProject = await createProject(projectName.trim(), projectDescription.trim() || '');
      
      // Atualizar o projeto criado com as tasks
      const updatedProject = {
        ...createdProject,
        tasks: tasksToInclude.map(task => ({
          ...task,
          // Manter todos os dados originais da task
        })),
      };

      await useProjectsStore.getState().updateProject(updatedProject);

      handleSuccess(`Projeto "${projectName}" criado com ${selectedTasksForProject.size} tarefa(s)!`);
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
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-accent text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <span className="font-semibold">
            {selectedTasksArray.length} tarefa{selectedTasksArray.length > 1 ? 's' : ''} selecionada{selectedTasksArray.length > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setAction('status');
                setShowModal(true);
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
            >
              Alterar Status
            </button>
            <button
              onClick={() => {
                setAction('tag');
                setShowModal(true);
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
            >
              Adicionar Tag
            </button>
            <button
              onClick={() => {
                setAction('assignee');
                setShowModal(true);
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
            >
              Atribuir
            </button>
            {hasSelectedNonFavorited && (
              <button
                onClick={handleBulkFavorite}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
                aria-label="Favoritar tarefas selecionadas"
              >
                Favoritar
              </button>
            )}
            {hasSelectedFavorited && (
              <button
                onClick={handleBulkUnfavorite}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
                aria-label="Desfavoritar tarefas selecionadas"
              >
                Desfavoritar
              </button>
            )}
            <button
              onClick={handleCreateProjectClick}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-semibold"
            >
              Criar Projeto
            </button>
            <button
              onClick={onClearSelection}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
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
        <div className="space-y-4">
          {action === 'status' && (
            <>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Novo Status
              </label>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary"
              >
                <option value="To Do">A Fazer</option>
                <option value="In Progress">Em Andamento</option>
                <option value="Done">Concluído</option>
              </select>
              <button onClick={handleBulkStatusChange} className="btn btn-primary w-full">
                Aplicar Status
              </button>
            </>
          )}

          {action === 'tag' && (
            <>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Tag para Adicionar
              </label>
              <input
                type="text"
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                placeholder="Ex: crítico, regressão..."
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary"
              />
              <button onClick={handleBulkTagAdd} className="btn btn-primary w-full">
                Adicionar Tag
              </button>
            </>
          )}

          {action === 'assignee' && (
            <>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Atribuir a
              </label>
              <select
                value={assigneeValue}
                onChange={(e) => setAssigneeValue(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary"
              >
                <option value="Product">Produto</option>
                <option value="QA">QA</option>
                <option value="Dev">Desenvolvimento</option>
              </select>
              <button onClick={handleBulkAssigneeChange} className="btn btn-primary w-full">
                Atribuir
              </button>
            </>
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
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Selecione as tarefas que deseja incluir no novo projeto. Você pode selecionar ou desmarcar tarefas.
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-surface-border rounded-lg p-3">
            {selectedTasksData.map(task => (
              <label
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer border border-surface-border"
              >
                <input
                  type="checkbox"
                  checked={selectedTasksForProject.has(task.id)}
                  onChange={() => handleTaskToggle(task.id)}
                  className="mt-1 h-4 w-4 rounded border-surface-border text-accent focus:ring-accent"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent/10 text-accent">
                      {task.type}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{task.id}</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-text-secondary line-clamp-2">{task.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Nome do Projeto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Projeto de Testes - Sprint 1"
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Descreva o objetivo deste projeto..."
              rows={4}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary resize-none"
            />
          </div>
          <div className="text-xs text-text-secondary">
            <p>O projeto será criado com {selectedTasksForProject.size} tarefa(s) selecionada(s).</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
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
    </>
  );
};
