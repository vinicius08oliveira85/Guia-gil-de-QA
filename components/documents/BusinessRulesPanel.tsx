import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, Scale, Search, Download, Upload, ChevronDown } from 'lucide-react';
import type { BusinessRule, Project } from '../../types';
import { filterBusinessRulesByQuery } from '../../utils/businessRulesFilter';
import { sortBusinessRules, type BusinessRuleSortKey } from '../../utils/businessRulesSort';
import { downloadFile, exportBusinessRulesToJSON } from '../../utils/exportService';
import { mergeBusinessRulesInto, parseBusinessRulesImportJson } from '../../utils/businessRulesImport';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';

function stripRuleFromTasks(project: Project, ruleId: string): Project {
  const businessRules = (project.businessRules ?? []).filter((r) => r.id !== ruleId);
  const tasks = project.tasks.map((t) => ({
    ...t,
    linkedBusinessRuleIds: (t.linkedBusinessRuleIds ?? []).filter((id) => id !== ruleId),
  }));
  return { ...project, businessRules, tasks };
}

export const BusinessRulesPanel: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
}> = ({ project, onUpdateProject }) => {
  const rules = project.businessRules ?? [];
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<BusinessRuleSortKey>('created_desc');

  const filteredRules = useMemo(
    () => filterBusinessRulesByQuery(rules, searchQuery),
    [rules, searchQuery]
  );

  const displayRules = useMemo(
    () => sortBusinessRules(filteredRules, sortBy),
    [filteredRules, sortBy]
  );

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const json = exportBusinessRulesToJSON(project.name, rules);
    const safe = project.name.replace(/[^\w\-]+/g, '_').slice(0, 80) || 'projeto';
    downloadFile(json, `${safe}-regras-negocio.json`, 'application/json');
    toast.success('Arquivo JSON das regras baixado.');
  };

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseBusinessRulesImportJson(text);
      if (!parsed.ok) {
        toast.error(parsed.error);
        return;
      }
      const { merged, updatedCount, addedCount } = mergeBusinessRulesInto(rules, parsed.rules);
      onUpdateProject({ ...project, businessRules: merged });
      const parts = [`${addedCount} nova(s)`, `${updatedCount} atualizada(s)`];
      if (parsed.skipped > 0) parts.push(`${parsed.skipped} linha(s) ignorada(s)`);
      toast.success(`Importação: ${parts.join(', ')}.`);
    };
    reader.onerror = () => toast.error('Não foi possível ler o arquivo.');
    reader.readAsText(file);
  };

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setFormOpen(true);
  };

  const openEdit = (rule: BusinessRule) => {
    setEditingId(rule.id);
    setTitle(rule.title);
    setDescription(rule.description);
    setFormOpen(true);
  };

  const handleSave = () => {
    const t = title.trim();
    const d = description.trim();
    if (!t) return;

    const list = [...(project.businessRules ?? [])];
    if (editingId) {
      const idx = list.findIndex((r) => r.id === editingId);
      if (idx === -1) return;
      list[idx] = { ...list[idx], title: t, description: d };
    } else {
      const now = new Date().toISOString();
      list.push({
        id: crypto.randomUUID(),
        title: t,
        description: d,
        createdAt: now,
      });
    }
    onUpdateProject({ ...project, businessRules: list });
    setFormOpen(false);
  };

  const confirmRemove = () => {
    if (!deleteId) return;
    onUpdateProject(stripRuleFromTasks(project, deleteId));
    setDeleteId(null);
  };

  return (
    <section
      className="rounded-xl border border-base-300 bg-base-200/40 backdrop-blur-sm p-4 md:p-6 space-y-4"
      aria-labelledby="business-rules-heading"
    >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 id="business-rules-heading" className="text-xl md:text-2xl font-bold tracking-tight text-base-content flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary shrink-0" aria-hidden />
            Regras de Negócio
          </h2>
          <p className="text-sm text-base-content/70 mt-1 max-w-2xl">
            Lista por título — clique em uma regra para expandir a descrição e as ações. Vincule regras às tarefas no detalhe da tarefa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
          <input
            ref={importInputRef}
            id="business-rules-import-json"
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Importar regras de negócio de arquivo JSON"
            onChange={handleImportFile}
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={() => importInputRef.current?.click()}
            title="Mescla regras a partir de JSON (mesmo id atualiza título/descrição)"
          >
            <Upload className="w-4 h-4" aria-hidden />
            Importar JSON
          </Button>
          <Button type="button" variant="outline" size="default" className="w-full sm:w-auto" onClick={handleExportJson} title="Exporta todas as regras do projeto em JSON">
            <Download className="w-4 h-4" aria-hidden />
            Exportar JSON
          </Button>
          <Button type="button" variant="default" size="default" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="w-4 h-4" aria-hidden />
            Nova regra
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-base-content/60 py-2">Nenhuma regra cadastrada. Adicione a primeira para contextualizar a IA.</p>
      ) : (
        <>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="input input-bordered w-full pl-10 bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Filtrar regras de negócio"
            />
          </div>
          <label className="flex flex-col gap-1 sm:min-w-[200px]">
            <span className="text-xs font-medium text-base-content/60">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BusinessRuleSortKey)}
              className="select select-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl text-sm"
              aria-label="Ordenar lista de regras"
            >
              <option value="created_desc">Mais recentes</option>
              <option value="created_asc">Mais antigas</option>
              <option value="title_asc">Título (A–Z)</option>
              <option value="title_desc">Título (Z–A)</option>
            </select>
          </label>
        </div>
        {displayRules.length === 0 ? (
          <p className="text-sm text-base-content/60 py-2" role="status">
            Nenhuma regra corresponde à busca.
          </p>
        ) : (
        <ul className="space-y-2" role="list">
          {displayRules.map((rule) => (
            <li key={rule.id}>
              <details className="group rounded-lg border border-base-300 bg-base-100/80 overflow-hidden open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 min-h-[44px] text-left font-semibold text-base-content hover:bg-base-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">{rule.title}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-base-content/45 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="border-t border-base-300 bg-base-100/90 px-4 pb-4 pt-3 space-y-3">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                    {rule.description.trim() ? rule.description : (
                      <span className="italic text-base-content/50">Sem descrição</span>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(rule)} aria-label={`Editar regra ${rule.title}`}>
                      <Pencil className="w-4 h-4" aria-hidden />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(rule.id)}
                      aria-label={`Excluir regra ${rule.title}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                      Excluir
                    </Button>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
        )}
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar regra de negócio' : 'Nova regra de negócio'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="br-title" className="block text-sm font-semibold text-base-content/70 mb-2">
              Título
            </label>
            <input
              id="br-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="br-desc" className="block text-sm font-semibold text-base-content/70 mb-2">
              Descrição
            </label>
            <textarea
              id="br-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex justify-end gap-2 flex-wrap">
            <Button type="button" variant="ghost" size="default" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="default" size="default" onClick={handleSave} disabled={!title.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmRemove}
        title="Excluir regra de negócio"
        message="Esta regra será removida do projeto e desvinculada de todas as tarefas. Deseja continuar?"
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </section>
  );
};
