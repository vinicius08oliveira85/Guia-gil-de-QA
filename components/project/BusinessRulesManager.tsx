import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Scale, Download, Upload, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import type { BusinessRule, Project } from '../../types';
import { filterBusinessRulesByQuery } from '../../utils/businessRulesFilter';
import { sortBusinessRules, type BusinessRuleSortKey } from '../../utils/businessRulesSort';
import { downloadFile, exportBusinessRulesToJSON } from '../../utils/exportService';
import {
  mergeBusinessRulesInto,
  parseBusinessRulesImportJson,
} from '../../utils/businessRulesImport';
import { removeBusinessRuleFromProject } from '../../utils/businessRuleTaskLinking';
import { refreshBusinessRuleDossier, type DossierAiProgress } from '../../services/ai/businessRuleDossierService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  tasksViewHeaderFilterIconClass,
  tasksViewHeaderIconWrapClass,
  tasksViewHeaderPrimaryBtnClass,
  tasksViewHeaderSecondaryBtnClass,
  tasksViewHeaderSecondaryToolbarClass,
  tasksViewHeaderSecondaryToolbarDividerClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
  tasksPanelFormFieldLabelClass,
  tasksPanelFormInputClass,
  tasksPanelFormSelectClass,
} from '../tasks/tasksPanelNeuStyles';
import {
  businessRulesViewContentClass,
  businessRulesViewEyebrowClass,
  businessRulesViewHeaderShellClass,
  businessRulesViewHeroChromeClass,
  businessRulesViewHeroJiraBadgeClass,
  businessRulesViewHeroShellClass,
  businessRulesViewHeroSubtitleClass,
  businessRulesViewHeroTitleClass,
  businessRulesViewListPanelClass,
  businessRulesViewPageShellClass,
  businessRulesViewPanelClass,
  businessRulesViewSectionDescClass,
  businessRulesViewSectionHeaderClass,
  businessRulesViewSectionHeaderFollowClass,
  businessRulesViewSectionLabelClass,
} from './businessRulesViewNeuUi';
import { businessRulesListPanelClass } from './businessRulesNeuUi';
import { cn } from '../../utils/cn';
import { EmptyState } from '../common/EmptyState';
import { BusinessRuleDossierForm } from './BusinessRuleDossierForm';
import { BusinessRuleDossierCard } from './BusinessRuleDossierCard';
import { AppSelect } from '../common/AppSelect';

type StatusFilter = 'all' | 'outdated' | 'analyzing';

export const BusinessRulesManager: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
  analyzingRuleIds?: string[];
}> = ({ project, onUpdateProject, analyzingRuleIds = [] }) => {
  const rules = project.businessRules;
  const { handleError, handleSuccess } = useErrorHandler();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<BusinessRuleSortKey>('created_desc');
  const [localAnalyzing, setLocalAnalyzing] = useState<Set<string>>(new Set());
  const [analyzingProgressByRule, setAnalyzingProgressByRule] = useState<
    Map<string, DossierAiProgress>
  >(() => new Map());
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(() => new Set());

  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredRules = useMemo(() => {
    let scoped = filterBusinessRulesByQuery(rules, searchQuery);
    if (statusFilter === 'outdated') {
      scoped = scoped.filter(r => r.isOutdated);
    } else if (statusFilter === 'analyzing') {
      const analyzing = new Set([...analyzingRuleIds, ...localAnalyzing]);
      scoped = scoped.filter(r => analyzing.has(r.id));
    }
    return sortBusinessRules(scoped, sortBy);
  }, [rules, searchQuery, statusFilter, sortBy, analyzingRuleIds, localAnalyzing]);

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
      toast.success(`Importação: ${addedCount} nova(s), ${updatedCount} atualizada(s).`);
    };
    reader.onerror = () => toast.error('Não foi possível ler o arquivo.');
    reader.readAsText(file);
  };

  const openCreate = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const openEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const confirmRemove = () => {
    if (!deleteId) return;
    onUpdateProject(removeBusinessRuleFromProject(project, deleteId));
    setDeleteId(null);
  };

  const handleReanalyze = async (rule: BusinessRule) => {
    if (!rule.analysis) {
      openEdit(rule);
      return;
    }
    setLocalAnalyzing(prev => new Set(prev).add(rule.id));
    setExpandedRuleIds(prev => new Set(prev).add(rule.id));
    try {
      const { rule: updated } = await refreshBusinessRuleDossier(project, rule, undefined, {
        onProgress: progress => {
          setAnalyzingProgressByRule(prev => {
            const next = new Map(prev);
            next.set(rule.id, progress);
            return next;
          });
        },
      });
      onUpdateProject({
        ...project,
        businessRules: project.businessRules.map(r => (r.id === updated.id ? updated : r)),
      });
      handleSuccess(`Dossiê "${rule.title}" reanalisado.`);
    } catch (error) {
      handleError(error, 'Reanalisar dossiê');
    } finally {
      setLocalAnalyzing(prev => {
        const next = new Set(prev);
        next.delete(rule.id);
        return next;
      });
      setAnalyzingProgressByRule(prev => {
        const next = new Map(prev);
        next.delete(rule.id);
        return next;
      });
    }
  };

  const jiraProjectKey = project.settings?.jiraProjectKey;
  const analyzingSet = new Set([...analyzingRuleIds, ...localAnalyzing]);

  const collapseAllRules = () => setExpandedRuleIds(new Set());

  const expandAllRules = () => {
    setExpandedRuleIds(new Set(filteredRules.map(rule => rule.id)));
  };

  const handleRuleExpandedChange = (ruleId: string, open: boolean) => {
    setExpandedRuleIds(prev => {
      const next = new Set(prev);
      if (open) {
        next.add(ruleId);
      } else {
        next.delete(ruleId);
      }
      return next;
    });
  };

  return (
    <>
      <div
        className={businessRulesViewPageShellClass}
        role="main"
        aria-label="Regras de negócio do projeto"
      >
        <div className={businessRulesViewContentClass}>
          <div className={businessRulesViewHeroShellClass}>
            <div className={businessRulesViewHeroChromeClass}>
              <header className={businessRulesViewHeaderShellClass}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className={businessRulesViewEyebrowClass}>
                      <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Projeto · Regras de negócio
                    </p>
                    <div className="mb-1.5 mt-2 flex flex-wrap items-center gap-2 sm:mt-2.5">
                      <h1 id="business-rules-heading" className={businessRulesViewHeroTitleClass}>
                        Regras de negócio
                      </h1>
                      {jiraProjectKey ? (
                        <span className={businessRulesViewHeroJiraBadgeClass}>
                          Jira: {jiraProjectKey}
                        </span>
                      ) : null}
                    </div>
                    <p className={cn(businessRulesViewHeroSubtitleClass, 'max-w-3xl')}>
                      Defina o nome da regra e as palavras-chave (separadas por vírgula). A IA busca
                      as tasks relacionadas e gera o dossiê: como era, como está e como será.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <input
                      ref={importInputRef}
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
                        className={tasksViewHeaderSecondaryBtnClass}
                        onClick={() => importInputRef.current?.click()}
                      >
                        <span className={tasksViewHeaderIconWrapClass} aria-hidden>
                          <Upload className={tasksViewHeaderFilterIconClass} />
                        </span>
                        <span className="hidden md:inline">Importar JSON</span>
                      </button>
                      <div className={tasksViewHeaderSecondaryToolbarDividerClass} aria-hidden />
                      <button
                        type="button"
                        className={tasksViewHeaderSecondaryBtnClass}
                        onClick={handleExportJson}
                      >
                        <span className={tasksViewHeaderIconWrapClass} aria-hidden>
                          <Download className={tasksViewHeaderFilterIconClass} />
                        </span>
                        <span className="hidden md:inline">Exportar JSON</span>
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
          </div>

          <div className={businessRulesViewSectionHeaderClass}>
            <h2 className={businessRulesViewSectionLabelClass}>Explorar regras</h2>
            <p className={businessRulesViewSectionDescClass}>
              Busque por nome, filtre por status do dossiê e ordene a lista de regras.
            </p>
          </div>

          <section className={businessRulesViewPanelClass} aria-label="Filtros de regras de negócio">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="br-search" className={tasksPanelFormFieldLabelClass}>
                Buscar
              </label>
              <input
                id="br-search"
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={tasksPanelFormInputClass}
                placeholder="Nome da regra…"
                aria-label="Filtrar regras de negócio"
              />
            </div>
            <div className="min-w-[10rem]">
              <label htmlFor="br-status" className={tasksPanelFormFieldLabelClass}>
                Status
              </label>
              <AppSelect
                id="br-status"
                value={statusFilter}
                onChange={v => setStatusFilter(v as StatusFilter)}
                className={tasksPanelFormSelectClass}
                aria-label="Filtrar por status do dossiê"
              >
                <option value="all">Todas</option>
                <option value="outdated">Desatualizadas</option>
                <option value="analyzing">Analisando</option>
              </AppSelect>
            </div>
            <div className="min-w-[10rem]">
              <label htmlFor="br-sort" className={tasksPanelFormFieldLabelClass}>
                Ordenar
              </label>
              <AppSelect
                id="br-sort"
                value={sortBy}
                onChange={v => setSortBy(v as BusinessRuleSortKey)}
                className={tasksPanelFormSelectClass}
                aria-label="Ordenar lista de regras"
              >
                <option value="created_desc">Mais recentes</option>
                <option value="created_asc">Mais antigas</option>
                <option value="title_asc">Título A–Z</option>
                <option value="title_desc">Título Z–A</option>
              </AppSelect>
            </div>
            {filteredRules.length > 0 ? (
              <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
                <button
                  type="button"
                  className={tasksViewHeaderSecondaryBtnClass}
                  onClick={expandAllRules}
                  aria-label="Expandir todas as regras de negócio"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Expandir todas</span>
                </button>
                <button
                  type="button"
                  className={tasksViewHeaderSecondaryBtnClass}
                  onClick={collapseAllRules}
                  aria-label="Recolher todas as regras de negócio"
                >
                  <ChevronsDownUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Recolher todas</span>
                </button>
              </div>
            ) : null}
          </div>
        </section>

          <div className={businessRulesViewSectionHeaderFollowClass}>
            <h2 className={businessRulesViewSectionLabelClass}>Dossiês de regras</h2>
            <p className={businessRulesViewSectionDescClass}>
              Expanda cada regra para ver o dossiê gerado pela IA, editar ou reanalisar.
            </p>
          </div>

        <section className={cn(businessRulesViewListPanelClass, businessRulesListPanelClass)} aria-label="Lista de regras de negócio">
          {rules.length === 0 ? (
            <EmptyState
              title="Nenhuma regra cadastrada"
              description="Crie a primeira regra pelo nome do domínio. A IA gera o dossiê a partir das tasks do Jira."
              icon="⚖️"
              action={{ label: 'Nova regra', onClick: openCreate, variant: 'primary' }}
            />
          ) : filteredRules.length === 0 ? (
            <EmptyState
              compact
              title="Nenhum resultado"
              description="Nenhuma regra corresponde aos filtros."
              secondaryAction={{
                label: 'Limpar busca',
                onClick: () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                },
              }}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3" role="list">
              {filteredRules.map(rule => (
                <li key={rule.id}>
                  <BusinessRuleDossierCard
                    rule={rule}
                    isExpanded={expandedRuleIds.has(rule.id)}
                    onExpandedChange={open => handleRuleExpandedChange(rule.id, open)}
                    isAnalyzing={analyzingSet.has(rule.id)}
                    analyzingProgress={analyzingProgressByRule.get(rule.id) ?? null}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                    onReanalyze={rule => void handleReanalyze(rule)}
                    onConvertLegacy={openEdit}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRule ? 'Editar regra de negócio' : 'Nova regra de negócio'}
        size="3xl"
        panelClassName={tasksPanelNeuModalPanelClass}
        titleClassName={tasksPanelNeuModalTitleClass}
      >
        <BusinessRuleDossierForm
          project={project}
          editingRule={editingRule}
          onClose={() => setFormOpen(false)}
          onSaved={onUpdateProject}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmRemove}
        title="Excluir regra de negócio"
        message="Esta regra e seu dossiê serão removidos. Os vínculos com tasks serão desfeitos."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};
