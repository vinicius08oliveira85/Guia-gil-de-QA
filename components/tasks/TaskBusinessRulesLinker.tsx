import React, { useMemo } from 'react';
import { JiraTask, Project } from '../../types';
import { Button } from '../common/Button';
import { getBusinessRulePromptText } from '../../utils/businessRulePromptText';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalInsetClass,
  leveTaskModalMutedClass,
  leveTaskModalSectionClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';

export interface TaskBusinessRulesLinkerProps {
  task: Pick<JiraTask, 'id' | 'linkedBusinessRuleIds' | 'linkedBusinessRuleCategories'>;
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
}

/**
 * Exibe regras de negócio vinculadas automaticamente à tarefa (somente leitura).
 */
export const TaskBusinessRulesLinker: React.FC<TaskBusinessRulesLinkerProps> = ({
  task,
  project,
  onNavigateToTab,
}) => {
  const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);
  const projectRules = project.businessRules ?? [];

  const linkedRules = useMemo(() => {
    const ids = new Set(task.linkedBusinessRuleIds ?? []);
    for (const rule of projectRules) {
      if ((rule.linkedTaskIds ?? []).includes(task.id)) {
        ids.add(rule.id);
      }
    }
    return projectRules.filter(r => ids.has(r.id));
  }, [projectRules, task.id, task.linkedBusinessRuleIds]);

  return (
    <div className="space-y-3">
      <section
        className={cn(leveTaskModalSectionClass, 'space-y-3 p-4')}
        aria-labelledby={`task-br-heading-${safeDomId}`}
      >
        <h3 id={`task-br-heading-${safeDomId}`} className={leveTaskModalFieldLabelClass}>
          Regras de negócio
        </h3>
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
        ) : linkedRules.length === 0 ? (
          <div className="space-y-2">
            <p className={leveTaskModalMutedClass}>
              Nenhuma regra vinculada a esta tarefa. Os vínculos são criados automaticamente ao
              gerar dossiês na aba Regras de negócio.
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
          <ul className={leveTaskModalInsetClass} role="list">
            {linkedRules.map(rule => (
              <li key={rule.id} className="border-b border-base-300/30 py-3 last:border-0">
                <p className={cn('text-sm font-semibold', leveTaskModalStrongClass)}>{rule.title}</p>
                {rule.analysis ? (
                  <p className="mt-1 text-xs text-base-content/70">
                    Dossiê v{rule.analysis.version}
                    {rule.isOutdated ? ' · desatualizado' : ''}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-base-content/80">
                  {getBusinessRulePromptText(rule).slice(0, 400)}
                  {getBusinessRulePromptText(rule).length > 400 ? '…' : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

TaskBusinessRulesLinker.displayName = 'TaskBusinessRulesLinker';
