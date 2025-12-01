import React, { useState } from 'react';
import { Project, ProjectFunctionality } from '../../types';
import { Modal } from '../common/Modal';
import { useProjectsStore } from '../../store/projectsStore';

interface FunctionalityManagerProps {
  project: Project;
  onClose: () => void;
}

/**
 * Modal para gerenciar funcionalidades manualmente
 */
export const FunctionalityManager: React.FC<FunctionalityManagerProps> = ({ project, onClose }) => {
  const { updateProject } = useProjectsStore();
  const [functionalities, setFunctionalities] = useState<ProjectFunctionality[]>(
    project.functionalities || []
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectFunctionality>>({
    name: '',
    description: '',
    testSuite: '',
    targetCoverage: undefined,
  });

  const handleSave = async () => {
    const updatedProject: Project = {
      ...project,
      functionalities,
    };
    await updateProject(updatedProject);
    onClose();
  };

  const handleAdd = () => {
    if (!formData.name) return;

    const newFunctionality: ProjectFunctionality = {
      id: `func-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      testSuite: formData.testSuite,
      targetCoverage: formData.targetCoverage,
    };

    setFunctionalities([...functionalities, newFunctionality]);
    setFormData({ name: '', description: '', testSuite: '', targetCoverage: undefined });
  };

  const handleEdit = (func: ProjectFunctionality) => {
    setEditingId(func.id);
    setFormData({
      name: func.name,
      description: func.description,
      testSuite: func.testSuite,
      targetCoverage: func.targetCoverage,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name) return;

    setFunctionalities(
      functionalities.map(f =>
        f.id === editingId
          ? { ...f, ...formData }
          : f
      )
    );
    setEditingId(null);
    setFormData({ name: '', description: '', testSuite: '', targetCoverage: undefined });
  };

  const handleDelete = (id: string) => {
    setFunctionalities(functionalities.filter(f => f.id !== id));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Gerenciar Funcionalidades">
      <div className="space-y-4">
        {/* Formulário de adição/edição */}
        <div className="space-y-3 p-4 bg-surface-hover rounded-lg">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nome da Funcionalidade *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary"
              placeholder="Ex: Login, Checkout, Integrações"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary"
              placeholder="Descrição opcional da funcionalidade"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Test Suite (opcional)
            </label>
            <input
              type="text"
              value={formData.testSuite || ''}
              onChange={(e) => setFormData({ ...formData, testSuite: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary"
              placeholder="Nome da suite de teste para associar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Meta de Cobertura (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.targetCoverage || ''}
              onChange={(e) => setFormData({ ...formData, targetCoverage: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary"
              placeholder="0-100"
            />
          </div>
          {editingId ? (
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="btn btn-primary flex-1"
                aria-label="Atualizar funcionalidade"
              >
                Atualizar
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '', testSuite: '', targetCoverage: undefined });
                }}
                className="btn btn-secondary"
                aria-label="Cancelar edição"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="btn btn-primary w-full"
              aria-label="Adicionar funcionalidade"
            >
              Adicionar Funcionalidade
            </button>
          )}
        </div>

        {/* Lista de funcionalidades */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Funcionalidades Cadastradas</h3>
          {functionalities.length === 0 ? (
            <p className="text-sm text-text-secondary p-4 text-center">
              Nenhuma funcionalidade cadastrada. Adicione uma acima.
            </p>
          ) : (
            <div className="space-y-2">
              {functionalities.map((func) => (
                <div
                  key={func.id}
                  className="p-3 bg-surface-hover rounded-lg border border-surface-border flex items-start justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{func.name}</p>
                    {func.description && (
                      <p className="text-sm text-text-secondary mt-1">{func.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                      {func.testSuite && (
                        <span>Suite: {func.testSuite}</span>
                      )}
                      {func.targetCoverage !== undefined && (
                        <span>Meta: {func.targetCoverage}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(func)}
                      className="text-accent hover:text-accent-light text-sm"
                      aria-label={`Editar ${func.name}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(func.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                      aria-label={`Deletar ${func.name}`}
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 pt-4 border-t border-surface-border">
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1"
            aria-label="Salvar alterações"
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            aria-label="Cancelar"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};

