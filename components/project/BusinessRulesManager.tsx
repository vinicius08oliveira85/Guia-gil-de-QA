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
import {
  mergeBusinessRulesInto,
  parseBusinessRulesImportJson,
} from '../../utils/businessRulesImport';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { SafeMarkdown } from '../common/SafeMarkdown';
import { BusinessRulesFiltersToolbar } from './BusinessRulesFiltersToolbar';
import { BusinessRuleCategoryPresetsModal } from './BusinessRuleCategoryPresetsModal';
import {
  badgeVariantForBusinessRuleCategory,
  businessRuleCategoryLabel,
  getMergedBusinessRuleCategories,
} from '../../utils/businessRuleCategoryPresets';
import { cn } from '../../utils/cn';

/** Valor sentinela do `<select>` de categoria quando o nome não está na lista unida do projeto. */
const BR_CATEGORY_SELECT_OTHER = '__br_category_other__';

function stripRuleFromProject(project: Project, deletedRule: BusinessRule): Project {
  const allRules = project.businessRules;
  const mention = mentionTokenForRule(deletedRule, allRules);
  const businessRules = allRules
    .filter(r => r.id !== deletedRule.id)
    .map(r => {
      const linkedBusinessRuleIds = (r.linkedBusinessRuleIds ?? []).filter(
        id => id !== deletedRule.id
      );
      const description = removeMentionFromDescription(r.description, mention);
      const { linkedBusinessRuleIds: _drop, ...rest } = r;
      return {
        ...rest,
        ...(linkedBusinessRuleIds.length > 0 ? { linkedBusinessRuleIds } : {}),
        description,
      };
    });
  const tasks = project.tasks.map(t => ({
    ...t,
    linkedBusinessRuleIds: (t.linkedBusinessRuleIds ?? []).filter(id => id !== deletedRule.id),
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
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  const uniqueCategories = useMemo(
    () => getMergedBusinessRuleCategories(project, rules),
    [project, rules]
  );

  const categorySelectValue = useMemo(
    () => (uniqueCategories.includes(category) ? category : BR_CATEGORY_SELECT_OTHER),
    [uniqueCategories, category]
  );

  useEffect(() => {
    if (categoryScope === 'all') return;
    if (!uniqueCategories.includes(categoryScope)) setCategoryScope('all');
  }, [categoryScope, uniqueCategories]);

  const filteredRules = useMemo(() => {
    const scoped =
      categoryScope === 'all'
        ? rules
        : rules.filter(r => businessRuleCategoryLabel(r) === categoryScope);
    return filterBusinessRulesByQuery(scoped, searchQuery);
  }, [rules, categoryScope, searchQuery]);

  const displayRules = useMemo(
    () => sortBusinessRules(filteredRules, sortBy),
    [filteredRules, sortBy]
  );

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const json = exportBusinessRulesToJSON(project.name, rules);
    const safe = project.name.replace(/[^\w-]+/g, '_').slice(0, 80) || 'projeto';
    downloadFile(json, `${safe}-regras-negocio.json`, 'application/json');
    toast.success('Arquivo JSON das regras baixado.');
  };

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = e => {
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
    return rules.filter(r => r.id !== editingId);
  }, [rules, editingId]);

  const linkableRulesSorted = useMemo(
    () =>
      [...linkableRules].sort((a, b) =>
        a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
      ),
    [linkableRules]
  );

  const quickLinkSelectRef = useRef<HTMLSelectElement>(null);

  const handleToggleLinkRule = useCallback(
    (otherId: string, checked: boolean) => {
      const target = rules.find(r => r.id === otherId);
      if (!target) return;
      const token = mentionTokenForRule(target, rules);
      setLinkedRuleIds(prev => {
        const s = new Set(prev);
        if (checked) s.add(otherId);
        else s.delete(otherId);
        return [...s];
      });
      setDescription(prev =>
        checked
          ? appendMentionToDescription(prev, token)
          : removeMentionFromDescription(prev, token)
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
      const target = list.find(r => r.id === id);
      if (!target) continue;
      const token = mentionTokenForRule(target, list);
      d = appendMentionToDescription(d, token);
    }

    if (editingId) {
      const idx = list.findIndex(r => r.id === editingId);
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
    const deleted = rules.find(r => r.id === deleteId);
    if (!deleted) {
      setDeleteId(null);
      return;
    }
    onUpdateProject(stripRuleFromProject(project, deleted));
    setDeleteId(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryScope('all');
  };

  return (
    <>
      <div className="space-y-6 py-8 md:py-10 lg:py-12">
        <Card hoverable={false} className="p-3 py-4 sm:p-4 sm:py-6 lg:p-5">
          <div className="tasks-panel-scope flex flex-col gap-tasks-panel-loose">
            <div
              className="flex flex-col gap-4 rounded-xl border border-base-300/80 bg-base-100/95 p-3 shadow-sm backdrop-blur-md sm:p-4"
              aria-labelledby="business-rules-heading"
            >
              <div className="border-b border-base-300/80 pb-4">
                <SectionHeader
                  as="h1"
                  align="left"
                  fullWidth
                  titleSize="page"
                  density="dense"
                  headingId="business-rules-heading"
                  title={
                    <span className="inline-flex items-center gap-2.5">
                      <Scale className="h-7 w-7 shrink-0 text-primary" aria-hidden />
                      <span>Regras de negócio</span>
                    </span>
                  }
                  description={
                    <>
                      Defina regras por categoria e vincule-as às tarefas no detalhe da tarefa para a
                      IA gerar BDD e casos mais assertivos. Ao editar, você pode vincular regras entre
                      si — insere{' '}
                      <code className="rounded bg-base-300/60 px-1.5 py-0.5 text-xs font-mono">
                        @NomeDaRegra
                      </code>{' '}
                      na descrição.
                    </>
                  }
                  className="max-w-3xl"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
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
                  size="sm"
                  className="w-full rounded-full sm:w-auto"
                  onClick={() => importInputRef.current?.click()}
                  title="Mescla regras a partir de JSON (mesmo id atualiza título/descrição)"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Importar JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full sm:w-auto"
                  onClick={handleExportJson}
                  title="Exporta todas as regras do projeto em JSON"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Exportar JSON
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="w-full rounded-full px-5 shadow-md shadow-primary/15 sm:w-auto"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Nova regra
                </Button>
              </div>

              <BusinessRulesFiltersToolbar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                categoryScope={categoryScope}
                onCategoryScopeChange={setCategoryScope}
                uniqueCategories={uniqueCategories}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                onManageCategoriesClick={() => setCategoriesModalOpen(true)}
              />
            </div>

            <div className="flex flex-col gap-tasks-panel">
              {rules.length === 0 ? (
                <EmptyState
                  title="Nenhuma regra cadastrada"
                  description="Adicione a primeira regra e vincule-a às tarefas no detalhe da tarefa para contextualizar a geração por IA."
                  icon="⚖️"
                  action={{
                    label: 'Nova regra',
                    onClick: openCreate,
                    variant: 'primary',
                  }}
                />
              ) : displayRules.length === 0 ? (
                <EmptyState
                  compact
                  title="Nenhum resultado"
                  description="Nenhuma regra corresponde à busca ou ao filtro de categoria."
                  secondaryAction={{
                    label: 'Limpar filtros',
                    onClick: clearFilters,
                  }}
                />
              ) : (
                <ul className="space-y-3" role="list" aria-label="Lista de regras de negócio">
                  {displayRules.map(rule => {
                    const catLabel = businessRuleCategoryLabel(rule);
                    const badgeVariant = badgeVariantForBusinessRuleCategory(catLabel);
                    return (
                      <li key={rule.id}>
                        <Card hoverable={false} className="overflow-hidden p-0 shadow-sm">
                          <details className="group open:shadow-md">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 min-h-[44px] text-left transition-colors hover:bg-base-200/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                              <span className="min-w-0 flex-1">
                                <span className="block border-b border-transparent pb-1 text-base font-bold tracking-tight text-base-content group-open:border-base-300/80">
                                  {rule.title}
                                </span>
                                <span className="mt-2 inline-flex flex-wrap items-center gap-2">
                                  <Badge variant={badgeVariant} size="sm" appearance="pill">
                                    <span className="normal-case">{catLabel}</span>
                                  </Badge>
                                </span>
                              </span>
                              <ChevronDown
                                className="h-5 w-5 shrink-0 text-base-content/45 transition-transform duration-200 group-open:rotate-180"
                                aria-hidden
                              />
                            </summary>
                            <div className="space-y-4 border-t border-base-300/80 bg-base-200/40 px-4 py-4 sm:px-5">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60 mb-2">
                                  Descrição
                                </p>
                                {rule.description.trim() ? (
                                  <SafeMarkdown
                                    source={rule.description}
                                    className={cn(
                                      'jira-rich-content prose-headings:font-heading prose-headings:text-base-content',
                                      'rounded-xl border border-base-300 bg-base-100/90 px-4 py-4 shadow-inner sm:px-5 sm:py-5',
                                      'prose-h2:border-b prose-h2:border-base-300/80 prose-h2:pb-2 prose-h2:mb-3',
                                      'prose-h3:border-b prose-h3:border-base-200 prose-h3:pb-1.5 prose-h3:mb-2',
                                      'prose-p:leading-relaxed prose-strong:text-base-content',
                                      'prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6'
                                    )}
                                  />
                                ) : (
                                  <p className="rounded-xl border border-dashed border-base-300/80 bg-base-100/80 px-4 py-6 text-center text-sm italic text-base-content/50">
                                    Sem descrição
                                  </p>
                                )}
                              </div>
                              {(rule.linkedBusinessRuleIds?.length ?? 0) > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60 mb-1.5">
                                    Vinculada a
                                  </p>
                                  <p className="text-sm leading-relaxed text-base-content/85">
                                    {(rule.linkedBusinessRuleIds ?? [])
                                      .map(id => rules.find(x => x.id === id)?.title ?? id)
                                      .join(', ')}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 border-t border-base-300/60 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full gap-1.5"
                                  onClick={() => openEdit(rule)}
                                  aria-label={`Editar regra ${rule.title}`}
                                >
                                  <Pencil className="h-4 w-4" aria-hidden />
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full gap-1.5 border-error/40 text-error hover:border-error/55 hover:bg-error/10"
                                  onClick={() => setDeleteId(rule.id)}
                                  aria-label={`Excluir regra ${rule.title}`}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </details>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar regra de negócio' : 'Nova regra de negócio'}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="br-title"
              className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-base-content/60"
            >
              Título
            </label>
            <input
              id="br-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input input-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="br-category"
              className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-base-content/60"
            >
              Categoria
            </label>
            <select
              id="br-category"
              value={categorySelectValue}
              onChange={e => {
                const v = e.target.value;
                if (v === BR_CATEGORY_SELECT_OTHER) {
                  setCategory(prev => (uniqueCategories.includes(prev) ? '' : prev));
                } else {
                  setCategory(v);
                }
              }}
              className="select select-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {uniqueCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={BR_CATEGORY_SELECT_OTHER}>Outra…</option>
            </select>
            {categorySelectValue === BR_CATEGORY_SELECT_OTHER && (
              <input
                id="br-category-custom"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input input-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 mt-2"
                autoComplete="off"
                placeholder="Digite o nome da categoria"
                aria-label="Nome da categoria personalizada"
              />
            )}
          </div>
          <div>
            <label
              htmlFor="br-desc"
              className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-base-content/60"
            >
              Descrição
            </label>
            <textarea
              id="br-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {linkableRules.length > 0 && (
            <div className="border-t border-base-200/80 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/60">
                  Vincular a outras regras
                </span>
              </div>
              <p className="text-xs text-base-content/55 mb-2">
                Ao marcar, inclui{' '}
                <code className="text-xs bg-base-200 px-1 rounded">@NomeDaRegra</code> na descrição
                (nome derivado do título; títulos iguais no projeto ganham sufixo para diferenciar).
              </p>
              <label
                htmlFor="br-quick-link-rule"
                className="block text-xs font-medium text-base-content/60 mb-1"
              >
                Escolher regra existente
              </label>
              <select
                ref={quickLinkSelectRef}
                id="br-quick-link-rule"
                defaultValue=""
                onChange={() => {
                  const el = quickLinkSelectRef.current;
                  if (!el) return;
                  const id = el.value;
                  el.value = '';
                  if (!id) return;
                  if (!linkedRuleIds.includes(id)) handleToggleLinkRule(id, true);
                }}
                className="select select-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl text-sm mb-3"
                aria-label="Vincular rapidamente escolhendo uma regra existente na lista"
              >
                <option value="">Selecione uma regra para vincular…</option>
                {linkableRulesSorted.map(r => {
                  const linked = linkedRuleIds.includes(r.id);
                  return (
                    <option key={r.id} value={r.id} disabled={linked}>
                      {r.title} ({businessRuleCategoryLabel(r)}){linked ? ' — já vinculada' : ''}
                    </option>
                  );
                })}
              </select>
              <ul
                className="max-h-48 overflow-y-auto rounded-lg border border-base-300 divide-y divide-base-300 bg-base-100/80"
                role="list"
              >
                {linkableRules.map(r => {
                  const checked = linkedRuleIds.includes(r.id);
                  const preview = mentionTokenForRule(r, rules);
                  return (
                    <li key={r.id} className="flex items-start gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        id={`br-link-${r.id}`}
                        className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                        checked={checked}
                        onChange={e => handleToggleLinkRule(r.id, e.target.checked)}
                        aria-label={
                          checked
                            ? `Desvincular regra ${r.title}`
                            : `Vincular regra ${r.title}; insere ${preview} na descrição`
                        }
                      />
                      <label
                        htmlFor={`br-link-${r.id}`}
                        className="text-sm cursor-pointer flex-1 min-w-0"
                      >
                        <span className="font-medium text-base-content">{r.title}</span>
                        <span className="block text-xs text-base-content/50">
                          Inserirá {preview}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-base-200/80 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full px-5"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="rounded-full px-6 shadow-md shadow-primary/15"
              onClick={handleSave}
              disabled={!title.trim()}
            >
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

      <BusinessRuleCategoryPresetsModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        project={project}
        rules={rules}
        onUpdateProject={onUpdateProject}
      />
    </>
  );
};
