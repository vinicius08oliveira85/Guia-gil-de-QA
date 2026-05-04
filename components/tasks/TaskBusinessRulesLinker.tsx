import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JiraTask, Project, BusinessRule } from '../../types';
import { Button } from '../common/Button';
import { filterBusinessRulesByQuery } from '../../utils/businessRulesFilter';
import { Search, ChevronDown } from 'lucide-react';

const CARD_TITLE_CLASS = 'text-sm sm:text-base font-bold text-base-content flex items-center gap-2';

/** Exibe campo de busca ao vincular regras quando há muitas entradas. */
const TASK_BR_SEARCH_MIN_COUNT = 5;

export interface TaskBusinessRulesLinkerProps {
  task: Pick<JiraTask, 'id' | 'linkedBusinessRuleIds' | 'linkedBusinessRuleCategories'>;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
}

/**
 * Vincula regras de negócio à tarefa por categoria inteira e/ou por ids (`linkedBusinessRuleCategories`, `linkedBusinessRuleIds`)
 * para inclusão no prompt da IA (estratégia, BDD, casos de teste).
 */
export const TaskBusinessRulesLinker: React.FC<TaskBusinessRulesLinkerProps> = ({
  task,
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);
  const [search, setSearch] = useState('');
  const projectRules = project.businessRules ?? [];

  const selectedCategorySet = useMemo(() => {
    return new Set(
      (task.linkedBusinessRuleCategories ?? [])
        .map(c => (typeof c === 'string' ? c.trim() : ''))
        .filter(Boolean)
    );
  }, [task.linkedBusinessRuleCategories]);

  const uniqueCategories = useMemo(() => {
    const s = new Set(projectRules.map(r => (r.category ?? '').trim()).filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [projectRules]);

  const filteredRules = useMemo(
    () => filterBusinessRulesByQuery(projectRules, search),
    [projectRules, search]
  );

  const linkedHiddenByFilter = useMemo((): BusinessRule[] => {
    const q = search.trim();
    if (!q) return [];
    const linked = new Set(task.linkedBusinessRuleIds ?? []);
    const visible = new Set(filteredRules.map(r => r.id));
    return projectRules.filter(r => linked.has(r.id) && !visible.has(r.id));
  }, [search, filteredRules, projectRules, task.linkedBusinessRuleIds]);

  useEffect(() => {
    setSearch('');
  }, [task.id]);

  const handleToggleCategory = useCallback(
    (category: string, checked: boolean) => {
      const key = category.trim();
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => {
          if (t.id !== task.id) return t;
          const next = new Set(
            (t.linkedBusinessRuleCategories ?? [])
              .map(c => (typeof c === 'string' ? c.trim() : ''))
              .filter(Boolean)
          );
          if (checked) next.add(key);
          else next.delete(key);
          const linkedBusinessRuleCategories = [...next].sort((a, b) =>
            a.localeCompare(b, 'pt-BR')
          );
          return { ...t, linkedBusinessRuleCategories };
        }),
      });
    },
    [onUpdateProject, project, task.id]
  );

  const handleToggle = useCallback(
    (ruleId: string, checked: boolean) => {
      const ids = new Set(task.linkedBusinessRuleIds ?? []);
      if (checked) ids.add(ruleId);
      else ids.delete(ruleId);
      const linkedBusinessRuleIds = [...ids];
      onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === task.id ? { ...t, linkedBusinessRuleIds } : t)),
      });
    },
    [onUpdateProject, project, task.id]
  );

  return (
    <div className="space-y-3">
      <section
        className="space-y-3 rounded-xl border border-base-300 bg-base-100/60 p-4"
        aria-labelledby={`task-br-heading-${safeDomId}`}
      >
        <h3 id={`task-br-heading-${safeDomId}`} className={CARD_TITLE_CLASS}>
          Regras de negócio
        </h3>
        {projectRules.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-base-content/70">
              Nenhuma regra cadastrada. Crie regras na aba Regras de negócio do projeto e marque
              categorias ou regras nesta aba para a IA usar na geração de testes e BDD.
            </p>
            {onNavigateToTab && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateToTab('businessRules')}
              >
                Ir para Regras de negócio
              </Button>
            )}
          </div>
        ) : (
          <fieldset className="min-w-0 space-y-4">
            <legend className="sr-only">
              Selecionar regras de negócio aplicáveis a esta tarefa
            </legend>
            <p id={`task-br-hint-${safeDomId}`} className="text-xs text-base-content/60">
              Por categoria: todas as regras da categoria entram no prompt. Por regra: apenas as
              marcadas. A IA usa a união dos dois modos (sem duplicar a mesma regra). Sem vínculos,
              usa só título e descrição da tarefa.
            </p>

            <div className="space-y-2 rounded-lg border border-base-300/60 bg-base-200/30 p-3">
              <h4 className="text-sm font-semibold text-base-content">Vincular por categoria</h4>
              <p className="text-xs text-base-content/60">
                Marque categorias para incluir automaticamente todas as regras do projeto nessa
                classificação.
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Categorias de regras de negócio"
              >
                {uniqueCategories.map(cat => {
                  const checked = selectedCategorySet.has(cat);
                  return (
                    <label
                      key={cat}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-sm text-base-content hover:bg-base-200/80"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary shrink-0"
                        checked={checked}
                        onChange={e => handleToggleCategory(cat, e.target.checked)}
                        aria-label={`${checked ? 'Desmarcar' : 'Marcar'} categoria: ${cat}`}
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-base-content">Vincular por regra</h4>
              <p className="text-xs text-base-content/60">
                Escolha regras individuais. Clique no título de cada cartão para expandir a
                descrição.
              </p>
              {projectRules.length >= TASK_BR_SEARCH_MIN_COUNT && (
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filtrar regras..."
                    className="input input-bordered min-h-[44px] w-full rounded-xl border-base-300 bg-base-100 pl-10 text-sm text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Filtrar lista de regras de negócio"
                  />
                </div>
              )}
              {linkedHiddenByFilter.length > 0 && (
                <div
                  className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3"
                  role="region"
                  aria-label="Regras vinculadas ocultas pelo filtro"
                >
                  <p className="text-xs font-semibold text-primary">
                    Vinculadas por regra (fora do filtro — permanecem ativas na IA)
                  </p>
                  <ul className="max-h-48 space-y-2 overflow-y-auto pr-1" role="list">
                    {linkedHiddenByFilter.map(rule => (
                      <li key={`br-hidden-${rule.id}`}>
                        <div className="flex overflow-hidden rounded-lg border border-primary/30 bg-base-100/90">
                          <label
                            className="flex shrink-0 cursor-pointer items-start p-3"
                            htmlFor={`br-cb-hidden-${safeDomId}-${rule.id}`}
                          >
                            <input
                              id={`br-cb-hidden-${safeDomId}-${rule.id}`}
                              type="checkbox"
                              className="checkbox checkbox-primary mt-0.5 shrink-0"
                              checked
                              onChange={e => handleToggle(rule.id, e.target.checked)}
                              aria-label={`Desvincular regra: ${rule.title}`}
                            />
                          </label>
                          <details className="group min-w-0 flex-1 border-l border-primary/25">
                            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 py-3 pr-3 text-left text-sm font-medium text-base-content hover:bg-base-200/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25 [&::-webkit-details-marker]:hidden">
                              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <span>{rule.title}</span>
                                <span className="shrink-0 rounded-full bg-base-300/70 px-2 py-0.5 text-[10px] font-normal text-base-content/80">
                                  {rule.category}
                                </span>
                              </span>
                              <ChevronDown
                                className="h-5 w-5 shrink-0 text-base-content/45 transition-transform group-open:rotate-180"
                                aria-hidden
                              />
                            </summary>
                            <div className="border-t border-base-300/60 pb-3 pr-3 pt-2 text-sm whitespace-pre-wrap text-base-content/75">
                              {rule.description.trim() ? (
                                rule.description
                              ) : (
                                <span className="italic text-base-content/50">Sem descrição</span>
                              )}
                            </div>
                          </details>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {filteredRules.length === 0 && search.trim() && linkedHiddenByFilter.length === 0 ? (
                <p className="py-1 text-sm text-base-content/60" role="status">
                  Nenhuma regra corresponde à busca.
                </p>
              ) : filteredRules.length > 0 ? (
                <ul
                  className="max-h-48 space-y-2 overflow-y-auto pr-1"
                  role="list"
                  aria-label="Lista de regras de negócio do projeto"
                >
                  {filteredRules.map(rule => {
                    const checked = (task.linkedBusinessRuleIds ?? []).includes(rule.id);
                    return (
                      <li key={rule.id}>
                        <div className="flex overflow-hidden rounded-lg border border-base-300 bg-base-200/50 hover:bg-base-200/70">
                          <label
                            className="flex shrink-0 cursor-pointer items-start p-3"
                            htmlFor={`br-cb-${safeDomId}-${rule.id}`}
                          >
                            <input
                              id={`br-cb-${safeDomId}-${rule.id}`}
                              type="checkbox"
                              className="checkbox checkbox-primary mt-0.5 shrink-0"
                              checked={checked}
                              onChange={e => handleToggle(rule.id, e.target.checked)}
                              aria-label={`${checked ? 'Desmarcar' : 'Marcar'} vínculo da regra: ${rule.title}`}
                            />
                          </label>
                          <details className="group min-w-0 flex-1 border-l border-base-300">
                            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 py-3 pr-3 text-left text-sm font-medium text-base-content hover:bg-base-200/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25 [&::-webkit-details-marker]:hidden">
                              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <span>{rule.title}</span>
                                <span className="shrink-0 rounded-full bg-base-300/70 px-2 py-0.5 text-[10px] font-normal text-base-content/80">
                                  {rule.category}
                                </span>
                              </span>
                              <ChevronDown
                                className="h-5 w-5 shrink-0 text-base-content/45 transition-transform group-open:rotate-180"
                                aria-hidden
                              />
                            </summary>
                            <div className="border-t border-base-300/60 pb-3 pr-3 pt-2 text-sm whitespace-pre-wrap text-base-content/75">
                              {rule.description.trim() ? (
                                rule.description
                              ) : (
                                <span className="italic text-base-content/50">Sem descrição</span>
                              )}
                            </div>
                          </details>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </fieldset>
        )}
      </section>
    </div>
  );
};

TaskBusinessRulesLinker.displayName = 'TaskBusinessRulesLinker';
