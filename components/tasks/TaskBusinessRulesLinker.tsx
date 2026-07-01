import React, { useMemo, useState } from 'react';
import { JiraTask, Project } from '../../types';
import { Button } from '../common/Button';
import {
  getLinkedBusinessRuleIdsForTask,
  isBusinessRuleCoveredByTaskCategory,
  isBusinessRuleLinkedToTask,
  toggleBusinessRuleTaskLink,
} from '../../utils/businessRuleTaskLinking';
import { sortBusinessRules } from '../../utils/businessRulesSort';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalSectionClass,
} from '../common/projectCardUi';
import { BusinessRuleLinkCard } from './BusinessRuleLinkCard';

export interface TaskBusinessRulesLinkerProps {
  task: Pick<JiraTask, 'id' | 'linkedBusinessRuleIds' | 'linkedBusinessRuleCategories'>;
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
}

/**
 * Vincula regras de negócio à tarefa com seleção por checkbox (sincroniza dossiê ↔ task).
 */
export const TaskBusinessRulesLinker: React.FC<TaskBusinessRulesLinkerProps> = ({
  task,
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);
  const [searchQuery, setSearchQuery] = useState('');

  const projectRules = project.businessRules ?? [];
  const linkedCount = useMemo(
    () => getLinkedBusinessRuleIdsForTask(task as JiraTask, project).length,
    [task, project]
  );

  const sortedRules = useMemo(
    () => sortBusinessRules(projectRules, 'title_asc'),
    [projectRules]
  );

  const filteredRules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedRules;
    return sortedRules.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        (r.searchKeywords ?? []).some(k => k.toLowerCase().includes(q))
    );
  }, [sortedRules, searchQuery]);

  const handleToggle = (ruleId: string, checked: boolean) => {
    if (!onUpdateProject) return;
    const updated = toggleBusinessRuleTaskLink(project, task.id, ruleId, checked);
    onUpdateProject(updated);
  };

  return (
    <div className="space-y-3">
      <section
        className={cn(leveTaskModalSectionClass, 'space-y-3 p-4')}
        aria-labelledby={`task-br-heading-${safeDomId}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 id={`task-br-heading-${safeDomId}`} className={leveTaskModalFieldLabelClass}>
              Regras de negócio
            </h3>
            <p className={cn('mt-1', leveTaskModalMutedClass)}>
              Marque as regras que se aplicam a esta task. O vínculo é salvo nos dois sentidos (task
              e dossiê).
              {linkedCount > 0 ? ` ${linkedCount} vinculada(s).` : ''}
            </p>
          </div>
          {onNavigateToTab && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('businessRules')}
            >
              Gerenciar dossiês
            </Button>
          )}
        </div>

        {projectRules.length === 0 ? (
          <div className="space-y-2">
            <p className={leveTaskModalMutedClass}>
              Nenhuma regra cadastrada. Crie regras na aba Regras de negócio para gerar dossiês com
              IA.
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
          <>
            <label className="sr-only" htmlFor={`task-br-search-${safeDomId}`}>
              Buscar regra de negócio
            </label>
            <input
              id={`task-br-search-${safeDomId}`}
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar regra por nome ou palavra-chave…"
              className="input input-bordered input-sm w-full"
              aria-label="Buscar regra de negócio"
            />

            {filteredRules.length === 0 ? (
              <p className={leveTaskModalMutedClass}>Nenhuma regra corresponde à busca.</p>
            ) : (
              <ul className="space-y-2" role="list">
                {filteredRules.map(rule => {
                  const coveredByCategory = isBusinessRuleCoveredByTaskCategory(
                    task as JiraTask,
                    rule
                  );
                  const linked =
                    isBusinessRuleLinkedToTask(task as JiraTask, rule) || coveredByCategory;

                  return (
                    <li key={rule.id}>
                      <BusinessRuleLinkCard
                        rule={rule}
                        checked={linked}
                        coveredByCategory={coveredByCategory}
                        domIdPrefix={safeDomId}
                        variant="task"
                        onToggle={checked => {
                          if (coveredByCategory) return;
                          handleToggle(rule.id, checked);
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
};

TaskBusinessRulesLinker.displayName = 'TaskBusinessRulesLinker';
