import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Tags } from 'lucide-react';
import type { Project } from '../../types';
import {
  addCategoryPreset,
  countRulesInCategory,
  effectiveCategoryPresets,
  removeCategoryPreset,
  renameCategoryPreset,
} from '../../utils/businessRuleCategoryPresets';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';

export type BusinessRuleCategoryPresetsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  rules: Project['businessRules'];
  onUpdateProject: (project: Project) => void;
};

export const BusinessRuleCategoryPresetsModal: React.FC<BusinessRuleCategoryPresetsModalProps> = ({
  isOpen,
  onClose,
  project,
  rules,
  onUpdateProject,
}) => {
  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sortedPresets = useMemo(() => {
    const list = effectiveCategoryPresets(project);
    return [...list].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [project]);

  const resetLocal = () => {
    setNewName('');
    setEditingName(null);
    setEditDraft('');
    setDeleteTarget(null);
  };

  const handleClose = () => {
    resetLocal();
    onClose();
  };

  const handleAdd = () => {
    const { project: next, error } = addCategoryPreset(project, newName);
    if (error === 'empty') {
      toast.error('Informe um nome para a categoria.');
      return;
    }
    if (error === 'duplicate') {
      toast.error('Já existe uma categoria com esse nome.');
      return;
    }
    onUpdateProject(next);
    setNewName('');
    toast.success('Categoria adicionada.');
  };

  const startEdit = (name: string) => {
    setEditingName(name);
    setEditDraft(name);
  };

  const cancelEdit = () => {
    setEditingName(null);
    setEditDraft('');
  };

  const saveEdit = () => {
    if (!editingName) return;
    const { project: next, error } = renameCategoryPreset(project, editingName, editDraft);
    if (error === 'empty') {
      toast.error('Nome inválido.');
      return;
    }
    if (error === 'duplicate') {
      toast.error('Já existe uma categoria com esse nome.');
      return;
    }
    onUpdateProject(next);
    cancelEdit();
    toast.success('Categoria atualizada.');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onUpdateProject(removeCategoryPreset(project, deleteTarget));
    setDeleteTarget(null);
    toast.success('Categoria removida da lista de presets.');
  };

  const rulesUsing = deleteTarget ? countRulesInCategory(rules, deleteTarget) : 0;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Gerenciar categorias">
        <div className="space-y-4">
          <div className="flex gap-2 items-start">
            <Tags className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-base-content/75">
              Estes nomes aparecem no filtro e como sugestões ao criar regras. Remover da lista não altera
              categorias já gravadas nas regras. Renomear atualiza também todas as regras que usavam o nome
              anterior.
            </p>
          </div>

          <ul className="rounded-lg border border-base-300 divide-y divide-base-300 max-h-56 overflow-y-auto bg-base-100/80" role="list">
            {sortedPresets.map((name) => (
              <li key={name} className="px-3 py-2 flex flex-wrap items-center gap-2">
                {editingName === name ? (
                  <>
                    <input
                      type="text"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="input input-bordered input-sm flex-1 min-w-[120px] bg-base-100 border-base-300 rounded-lg"
                      aria-label={`Novo nome para ${name}`}
                    />
                    <Button type="button" variant="default" size="sm" onClick={saveEdit}>
                      Salvar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-base-content flex-1 min-w-0">{name}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(name)}>
                      Editar
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(name)}>
                      Excluir
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="new-category-preset" className="block text-xs font-medium text-base-content/60 mb-1">
                Nova categoria
              </label>
              <input
                id="new-category-preset"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex.: Performance"
                className="input input-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl"
                autoComplete="off"
              />
            </div>
            <Button type="button" variant="default" className="w-full sm:w-auto shrink-0" onClick={handleAdd}>
              Adicionar
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Excluir categoria dos presets"
        message={
          rulesUsing > 0
            ? `${rulesUsing} regra(s) ainda usam "${deleteTarget}". Elas continuarão com a mesma categoria até você editar cada regra; apenas o nome some da lista de presets e sugestões. Deseja continuar?`
            : `Remover "${deleteTarget}" da lista de categorias do projeto?`
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};
