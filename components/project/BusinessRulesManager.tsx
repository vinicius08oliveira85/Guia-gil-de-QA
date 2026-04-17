import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, Scale, Download, Upload, ChevronDown, Link2 } from 'lucide-react';
import type { BusinessRule, Project } from '../../types';
import { filterBusinessRulesByQuery } from '../../utils/businessRulesFilter';
import {
  appendMentionToDescription,
  mentionTokenForRule,
  removeMentionFromDescription,
} from '../../utils/businessRuleMention';
import { DEFAULT_BUSINESS_RULE_CATEGORY } from '../../utils/businessRuleDefaults';
import { sortBusinessRules, type BusinessRuleSortKey } from '../../utils/businessRulesSort';
import { downloadFile, exportBusinessRulesToJSON } from '../../utils/exportService';
import { mergeBusinessRulesInto, parseBusinessRulesImportJson } from '../../utils/businessRulesImport';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BusinessRulesFiltersToolbar } from './BusinessRulesFiltersToolbar';

const SUGGESTED_CATEGORIES = ['Geral', 'Segurança', 'Financeiro', 'UX', 'Compliance', 'Integração'] as const;

function ruleCategoryLabel(rule: BusinessRule): string {
  const t = rule.category?.trim();
  return t ? t : DEFAULT_BUSINESS_RULE_CATEGORY;
}

function stripRuleFromProject(project: Project, deletedRule: BusinessRule): Project {
  const allRules = project.businessRules;
  const mention = mentionTokenForRule(deletedRule, allRules);
  const businessRules = allRules
    .filter((r) => r.id !== deletedRule.id)
    .map((r) => {
      const linkedBusinessRuleIds = (r.linkedBusinessRuleIds ?? []).filter((id) => id !== deletedRule.id);
      const description = removeMentionFromDescription(r.description, mention);
      const { linkedBusinessRuleIds: _drop, ...rest } = r;
      return {
        ...rest,
        ...(linkedBusinessRuleIds.length > 0 ? { linkedBusinessRuleIds } : {}),
        description,
      };
    });
  const tasks = project.tasks.map((t) => ({
    ...t,
    linkedBusinessRuleIds: (t.linkedBusinessRuleIds ?? []).filter((id) => id !== deletedRule.id),
  }));
  return { ...project, businessRules, tasks };
}

export const BusinessRulesManager: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
}> = ({ project, onUpdateProject }) => {
  const rules = project.businessRules;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_BUSINESS_RULE_CATEGORY);
  const [description, setDescription] = useState('');
  /** IDs de outras regras vinculadas; ao marcar, insere `@NomeDaRegra` na descrição. */
  const [linkedRuleIds, setLinkedRuleIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryScope, setCategoryScope] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<BusinessRuleSortKey>('created_desc');

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rules) set.add(ruleCategoryLabel(r));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [rules]);

  useEffect(() => {
    if (categoryScope === 'all') return;
    if (!uniqueCategories.includes(categoryScope)) setCategoryScope('all');
  }, [categoryScope, uniqueCategories]);

  const filteredRules = useMemo(() => {
    const scoped =
      categoryScope === 'all' ? rules : rules.filter((r) => ruleCategoryLabel(r) === categoryScope);
    return filterBusinessRulesByQuery(scoped, searchQuery);
  }, [rules, categoryScope, searchQuery]);

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
    setCategory(DEFAULT_BUSINESS_RULE_CATEGORY);
    setDescription('');
    setLinkedRuleIds([]);
    setFormOpen(true);
  };

  const openEdit = (rule: BusinessRule) => {
    setEditingId(rule.id);
    setTitle(rule.title);
    setCategory(rule.category?.trim() ? rule.category.trim() : DEFAULT_BUSINESS_RULE_CATEGORY);
    setDescription(rule.description);
    setLinkedRuleIds([...(rule.linkedBusinessRuleIds ?? [])]);
    setFormOpen(true);
  };

  const linkableRules = useMemo(() => {
    if (!editingId) return rules;
    return rules.filter((r) => r.id !== editingId);
  }, [rules, editingId]);

  const handleToggleLinkRule = useCallback(
    (otherId: string, checked: boolean) => {
      const target = rules.find((r) => r.id === otherId);
      if (!target) return;
      const token = mentionTokenForRule(target, rules);
      setLinkedRuleIds((prev) => {
        const s = new Set(prev);
        if (checked) s.add(otherId);
        else s.delete(otherId);
        return [...s];
      });
      setDescription((prev) =>
        checked ? appendMentionToDescription(prev, token) : removeMentionFromDescription(prev, token)
      );
    },
    [rules]
  );

  const handleSave = () => {
    const t = title.trim();
    if (!t) return;

    const cat = category.trim() || DEFAULT_BUSINESS_RULE_CATEGORY;
    const list = [...project.businessRules];
    let d = description.trim();
    const uniqueLinked = [...new Set(linkedRuleIds)];
    for (const id of uniqueLinked) {
      const target = list.find((r) => r.id === id);
      if (!target) continue;
      const token = mentionTokenForRule(target, list);
      d = appendMentionToDescription(d, token);
    }

    if (editingId) {
      const idx = list.findIndex((r) => r.id === editingId);
      if (idx === -1) return;
      const prev = list[idx];
      const { linkedBusinessRuleIds: _drop, ...rest } = prev;
      list[idx] = {
        ...rest,
        title: t,
        category: cat,
        description: d,
        ...(uniqueLinked.length > 0 ? { linkedBusinessRuleIds: uniqueLinked } : {}),
      };
    } else {
      const now = new Date().toISOString();
      const row: BusinessRule = {
        id: crypto.randomUUID(),
        title: t,
        category: cat,
        description: d,
        createdAt: now,
      };
      if (uniqueLinked.length > 0) row.linkedBusinessRuleIds = uniqueLinked;
      list.push(row);
    }
    onUpdateProject({ ...project, businessRules: list });
    setFormOpen(false);
  };

  const confirmRemove = () => {
    if (!deleteId) return;
    const deleted = rules.find((r) => r.id === deleteId);
    if (!deleted) {
      setDeleteId(null);
      return;
    }
    onUpdateProject(stripRuleFromProject(project, deleted));
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
            Defina regras por categoria e vincule-as às tarefas no detalhe da tarefa para a IA gerar BDD e casos mais assertivos. Vincule regras entre si ao editar (insere{' '}
            <code className="text-xs bg-base-300/50 px-1 rounded">@NomeDaRegra</code> na descrição).
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
        <p className="text-sm text-base-content/60 py-2">
          Nenhuma regra cadastrada. Adicione a primeira e vincule-a às tarefas para contextualizar a geração por IA.
        </p>
      ) : (
        <>
          <BusinessRulesFiltersToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            categoryScope={categoryScope}
            onCategoryScopeChange={setCategoryScope}
            uniqueCategories={uniqueCategories}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
          {displayRules.length === 0 ? (
            <p className="text-sm text-base-content/60 py-2" role="status">
              Nenhuma regra corresponde à busca ou ao filtro de categoria.
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {displayRules.map((rule) => (
                <li key={rule.id}>
                  <details className="group rounded-lg border border-base-300 bg-base-100/80 overflow-hidden open:shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 min-h-[44px] text-left font-semibold text-base-content hover:bg-base-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                        <span>{rule.title}</span>
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-base-300/60 text-base-content/80 shrink-0">
                          {rule.category}
                        </span>
                      </span>
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
                      {(rule.linkedBusinessRuleIds?.length ?? 0) > 0 && (
                        <p className="text-xs text-base-content/65 flex flex-wrap gap-x-1 gap-y-0.5 items-baseline">
                          <span className="font-medium text-base-content/75 shrink-0">Vinculada a:</span>
                          <span>
                            {(rule.linkedBusinessRuleIds ?? [])
                              .map((id) => rules.find((x) => x.id === id)?.title ?? id)
                              .join(', ')}
                          </span>
                        </p>
                      )}
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
            <label htmlFor="br-category" className="block text-sm font-semibold text-base-content/70 mb-2">
              Categoria
            </label>
            <input
              id="br-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="br-category-suggestions"
              className="input input-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="off"
              placeholder={DEFAULT_BUSINESS_RULE_CATEGORY}
            />
            <datalist id="br-category-suggestions">
              {SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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
          {linkableRules.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-primary shrink-0" aria-hidden />
                <span className="block text-sm font-semibold text-base-content/70">Vincular a outras regras</span>
              </div>
              <p className="text-xs text-base-content/55 mb-2">
                Ao marcar, inclui <code className="text-xs bg-base-200 px-1 rounded">@NomeDaRegra</code> na descrição (nome derivado do
                título; títulos iguais no projeto ganham sufixo para diferenciar).
              </p>
              <ul
                className="max-h-48 overflow-y-auto rounded-lg border border-base-300 divide-y divide-base-300 bg-base-100/80"
                role="list"
              >
                {linkableRules.map((r) => {
                  const checked = linkedRuleIds.includes(r.id);
                  const preview = mentionTokenForRule(r, rules);
                  return (
                    <li key={r.id} className="flex items-start gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        id={`br-link-${r.id}`}
                        className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                        checked={checked}
                        onChange={(e) => handleToggleLinkRule(r.id, e.target.checked)}
                        aria-label={
                          checked ? `Desvincular regra ${r.title}` : `Vincular regra ${r.title}; insere ${preview} na descrição`
                        }
                      />
                      <label htmlFor={`br-link-${r.id}`} className="text-sm cursor-pointer flex-1 min-w-0">
                        <span className="font-medium text-base-content">{r.title}</span>
                        <span className="block text-xs text-base-content/50">Inserirá {preview}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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
        message="Esta regra será removida do projeto, desvinculada de tarefas e das referências de outras regras (incluindo menções @ na descrição). Deseja continuar?"
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </section>
  );
};
