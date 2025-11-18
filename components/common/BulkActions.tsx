import React, { useState } from 'react';
import { JiraTask, Project } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Modal } from './Modal';

interface BulkActionsProps {
  selectedTasks: string[];
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTasks,
  project,
  onUpdateProject,
  onClearSelection
}) => {
  const { handleSuccess, handleError } = useErrorHandler();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'status' | 'tag' | 'assignee' | null>(null);
  const [statusValue, setStatusValue] = useState<'To Do' | 'In Progress' | 'Done'>('To Do');
  const [tagValue, setTagValue] = useState('');
  const [assigneeValue, setAssigneeValue] = useState<'Product' | 'QA' | 'Dev'>('QA');

  const handleBulkStatusChange = () => {
    const updatedTasks = project.tasks.map(task =>
      selectedTasks.includes(task.id)
        ? { ...task, status: statusValue }
        : task
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`${selectedTasks.length} tarefas atualizadas`);
    setShowModal(false);
    onClearSelection();
  };

  const handleBulkTagAdd = () => {
    if (!tagValue.trim()) {
      handleError(new Error('Digite uma tag'));
      return;
    }

    const updatedTasks = project.tasks.map(task => {
      if (selectedTasks.includes(task.id)) {
        const tags = task.tags || [];
        if (!tags.includes(tagValue.trim())) {
          return { ...task, tags: [...tags, tagValue.trim()] };
        }
      }
      return task;
    });
    
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`Tag "${tagValue}" adicionada a ${selectedTasks.length} tarefas`);
    setShowModal(false);
    setTagValue('');
    onClearSelection();
  };

  const handleBulkAssigneeChange = () => {
    const updatedTasks = project.tasks.map(task =>
      selectedTasks.includes(task.id)
        ? { ...task, assignee: assigneeValue }
        : task
    );
    onUpdateProject({ ...project, tasks: updatedTasks });
    handleSuccess(`${selectedTasks.length} tarefas atribuídas`);
    setShowModal(false);
    onClearSelection();
  };

  if (selectedTasks.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-accent text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <span className="font-semibold">
            {selectedTasks.length} tarefa{selectedTasks.length > 1 ? 's' : ''} selecionada{selectedTasks.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
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
        title={`Ação em Lote - ${selectedTasks.length} tarefas`}
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
    </>
  );
};

