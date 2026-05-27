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
import { ConfirmDialog } from '../common/ConfirmDialog';
import { leveViewInlineCodeClass } from '../common/projectCardUi';
import {
  viewHeroChromeClass,
  viewHeroHeaderShellClass,
  viewHeroJiraBadgeClass,
  viewHeroSubtitleClass,
  viewHeroTitleClass,
} from '../common/viewHeroChromeUi';
import {
  businessRulesCardActionsClass,
  businessRulesCardBodyClass,
  businessRulesCardChevronClass,
  businessRulesCardClass,
  businessRulesCardEmptyDescClass,
  businessRulesCardInsetClass,
  businessRulesCardLabelClass,
  businessRulesCardLinkedTextClass,
  businessRulesCardOutlineBtnClass,
  businessRulesCardSummaryClass,
  businessRulesCardTitleClass,
  businessRulesCategoryBadgeClass,
  businessRulesListPanelClass,
  businessRulesViewScopeClass,
} from './businessRulesNeuUi';
import {
  tasksPanelCardClass,
  tasksViewHeaderFilterIconClass,
  tasksViewHeaderIconWrapClass,
  tasksViewHeaderPrimaryBtnClass,
  tasksViewHeaderSecondaryBtnClass,
  tasksViewHeaderSecondaryToolbarClass,
  tasksViewHeaderSecondaryToolbarDividerClass,
  tasksPanelFormCancelBtnClass,
  tasksPanelFormFieldLabelAccentClass,
  tasksPanelFormFieldLabelClass,
  tasksPanelFormFooterClass,
  tasksPanelFormInputClass,
  tasksPanelFormListItemMetaClass,
  tasksPanelFormListItemTitleClass,
  tasksPanelFormListShellClass,
  tasksPanelFormMutedClass,
  tasksPanelFormSaveBtnClass,
  tasksPanelFormSelectClass,
  tasksPanelFormTextareaClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from '../tasks/tasksPanelNeuStyles';
import { projectViewShell } from '../common/viewUi';
import { cn } from '../../utils/cn';
import { EmptyState } from '../common/EmptyState';
import { SafeMarkdown } from '../common/SafeMarkdown';
import { BusinessRulesFiltersToolbar } from './BusinessRulesFiltersToolbar';
import { BusinessRuleCategoryPresetsModal } from './BusinessRuleCategoryPresetsModal';
import { AppSelect } from '../common/AppSelect';
import {
  badgeVariantForBusinessRuleCategory,
  businessRuleCategoryLabel,
  getMergedBusinessRuleCategories,
} from '../../utils/businessRuleCategoryPresets';

/** Valor sentinela do `<AppSelect>` de categoria quando o nome não está na lista unida do projeto. */
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

  const [quickLinkSelectValue, setQuickLinkSelectValue] = useState('');

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

  const jiraProjectKey = project.settings?.jiraProjectKey;

  return (
    <>
      <div
        className={cn(projectViewShell, businessRulesViewScopeClass)}
        role="main"
        aria-label="Regras de negócio do projeto"
      >
        <div className={viewHeroChromeClass}>
          <header className={viewHeroHeaderShellClass}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h1
                    id="business-rules-heading"
                    className={cn(viewHeroTitleClass, 'inline-flex items-center gap-2')}
                  >
                    <Scale
                      className="h-7 w-7 shrink-0 text-[var(--workspace-panel-accent)]"
                      aria-hidden
                    />
                    Regras de negócio
                  </h1>
                  {jiraProjectKey ? (
                    <span className={viewHeroJiraBadgeClass}>Jira: {jiraProjectKey}</span>
                  ) : null}
                </div>
                <p className={cn(viewHeroSubtitleClass, 'max-w-3xl')}>
                  Defina regras por categoria e vincule-as às tarefas para a IA gerar BDD e casos mais
                  assertivos. Use <code className={leveViewInlineCodeClass}>@NomeDaRegra</code> na
                  descrição ao vincular regras entre si.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <input
                  ref={importInputRef}
                  id="business-rules-import-json"
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-label="Importar regras de negócio de arquivo JSON"
                  onChange={handleImportFile}
                />
                <div
                  className={cn(tasksViewHeaderSecondaryToolbarClass, 'w-full sm:w-auto')}
                  role="group"
                  aria-label="Importar e exportar regras"
                >
                  <button
                    type="button"
                    className={cn(tasksViewHeaderSecondaryBtnClass, 'min-h-[44px] sm:min-h-0')}
                    onClick={() => importInputRef.current?.click()}
                    title="Mescla regras a partir de JSON (mesmo id atualiza título/descrição)"
                  >
                    <span className={tasksViewHeaderIconWrapClass} aria-hidden>
                      <Upload className={tasksViewHeaderFilterIconClass} />
                    </span>
                    <span>Importar JSON</span>
                  </button>
                  <div className={tasksViewHeaderSecondaryToolbarDividerClass} aria-hidden />
                  <button
                    type="button"
                    className={cn(tasksViewHeaderSecondaryBtnClass, 'min-h-[44px] sm:min-h-0')}
                    onClick={handleExportJson}
                    title="Exporta todas as regras do projeto em JSON"
                  >
                    <span className={tasksViewHeaderIconWrapClass} aria-hidden>
                      <Download className={tasksViewHeaderFilterIconClass} />
                    </span>
                    <span>Exportar JSON</span>
                  </button>
                </div>
                <button
                  type="button"
                  className={cn(tasksViewHeaderPrimaryBtnClass, 'w-full sm:w-auto')}
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Nova regra
                </button>
              </div>
            </div>
          </header>
        </div>

        <section className={tasksPanelCardClass} aria-label="Filtros de regras de negócio">
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
        </section>

        <section className={businessRulesListPanelClass} aria-label="Lista de regras de negócio">
          <div className="flex flex-col gap-4">
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
                <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2" role="list" aria-label="Lista de regras de negócio">
                  {displayRules.map(rule => {
                    const catLabel = businessRuleCategoryLabel(rule);
                    const badgeVariant = badgeVariantForBusinessRuleCategory(catLabel);
                    return (
                      <li key={rule.id}>
                        <div className={businessRulesCardClass}>
                          <details className="group">
                            <summary className={businessRulesCardSummaryClass}>
                              <span className="min-w-0 flex-1">
                                <span className={businessRulesCardTitleClass}>{rule.title}</span>
                                <span className="mt-2 inline-flex flex-wrap items-center gap-2">
                                  <span
                                    className={businessRulesCategoryBadgeClass(badgeVariant)}
                                    role="status"
                                  >
                                    {catLabel}
                                  </span>
                                </span>
                              </span>
                              <ChevronDown className={businessRulesCardChevronClass} aria-hidden />
                            </summary>
                            <div className={businessRulesCardBodyClass}>
                              <div>
                                <p className={businessRulesCardLabelClass}>Descrição</p>
                                {rule.description.trim() ? (
                                  <SafeMarkdown
                                    source={rule.description}
                                    className={businessRulesCardInsetClass}
                                  />
                                ) : (
                                  <p className={businessRulesCardEmptyDescClass}>Sem descrição</p>
                                )}
                              </div>
                              {(rule.linkedBusinessRuleIds?.length ?? 0) > 0 && (
                                <div>
                                  <p className={cn(businessRulesCardLabelClass, 'mb-1.5')}>
                                    Vinculada a
                                  </p>
                                  <p className={businessRulesCardLinkedTextClass}>
                                    {(rule.linkedBusinessRuleIds ?? [])
                                      .map(id => rules.find(x => x.id === id)?.title ?? id)
                                      .join(', ')}
                                  </p>
                                </div>
                              )}
                              <div className={businessRulesCardActionsClass}>
                                <button
                                  type="button"
                                  className={businessRulesCardOutlineBtnClass}
                                  onClick={() => openEdit(rule)}
                                  aria-label={`Editar regra ${rule.title}`}
                                >
                                  <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className={cn(
                                    businessRulesCardOutlineBtnClass,
                                    'border-error/40 text-error hover:border-error/55 hover:bg-error/10'
                                  )}
                                  onClick={() => setDeleteId(rule.id)}
                                  aria-label={`Excluir regra ${rule.title}`}
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </details>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar regra de negócio' : 'Nova regra de negócio'}
        panelClassName={tasksPanelNeuModalPanelClass}
        titleClassName={tasksPanelNeuModalTitleClass}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="br-title" className={tasksPanelFormFieldLabelClass}>
              Título
            </label>
            <input
              id="br-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={tasksPanelFormInputClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="br-category" className={tasksPanelFormFieldLabelClass}>
              Categoria
            </label>
            <AppSelect
              id="br-category"
              value={categorySelectValue}
              onChange={v => {
                if (v === BR_CATEGORY_SELECT_OTHER) {
                  setCategory(prev => (uniqueCategories.includes(prev) ? '' : prev));
                } else {
                  setCategory(v);
                }
              }}
              className={tasksPanelFormSelectClass}
            >
              {uniqueCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={BR_CATEGORY_SELECT_OTHER}>Outra…</option>
            </AppSelect>
            {categorySelectValue === BR_CATEGORY_SELECT_OTHER && (
              <input
                id="br-category-custom"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={cn(tasksPanelFormInputClass, 'mt-2')}
                autoComplete="off"
                placeholder="Digite o nome da categoria"
                aria-label="Nome da categoria personalizada"
              />
            )}
          </div>
          <div>
            <label htmlFor="br-desc" className={tasksPanelFormFieldLabelClass}>
              Descrição
            </label>
            <textarea
              id="br-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              className={tasksPanelFormTextareaClass}
            />
          </div>
          {linkableRules.length > 0 && (
            <div className={cn('border-t pt-4', 'border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]')}>
              <div className={tasksPanelFormFieldLabelAccentClass}>
                <Link2 className="h-4 w-4 shrink-0" aria-hidden />
                Vincular a outras regras
              </div>
              <p className={cn(tasksPanelFormMutedClass, 'mb-2')}>
                Ao marcar, inclui{' '}
                <code className={leveViewInlineCodeClass}>@NomeDaRegra</code> na descrição
                (nome derivado do título; títulos iguais no projeto ganham sufixo para diferenciar).
              </p>
              <label htmlFor="br-quick-link-rule" className={cn(tasksPanelFormFieldLabelClass, 'mb-1 text-xs')}>
                Escolher regra existente
              </label>
              <AppSelect
                id="br-quick-link-rule"
                value={quickLinkSelectValue}
                onChange={id => {
                  setQuickLinkSelectValue('');
                  if (!id) return;
                  if (!linkedRuleIds.includes(id)) handleToggleLinkRule(id, true);
                }}
                className={cn(tasksPanelFormSelectClass, 'mb-3')}
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
              </AppSelect>
              <ul className={tasksPanelFormListShellClass} role="list">
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
                        <span className={tasksPanelFormListItemTitleClass}>{r.title}</span>
                        <span className={tasksPanelFormListItemMetaClass}>Inserirá {preview}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className={tasksPanelFormFooterClass}>
            <button type="button" className={tasksPanelFormCancelBtnClass} onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={tasksPanelFormSaveBtnClass}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              Salvar
            </button>
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
