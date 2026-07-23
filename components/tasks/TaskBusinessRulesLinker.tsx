import React, { useCallback, useMemo } from 'react';
import { Link2, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import { JiraTask, Project } from '../../types';
import { Button } from '../common/Button';
import {
  getLinkedBusinessRuleIdsForTask,
  linkTaskToBusinessRule,
  unlinkTaskFromBusinessRule,
} from '../../utils/businessRuleTaskLinking';
import { getBusinessRulePromptText } from '../../utils/businessRulePromptText';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalInsetClass,
  leveTaskModalMutedClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';
import { taskDetailsModalSectionClass } from './taskDetailsNeuUi';
import { BusinessRuleLinkCard } from './BusinessRuleLinkCard';

export interface TaskBusinessRulesLinkerProps {
  task: Pick<JiraTask, 'id' | 'linkedBusinessRuleIds' | 'linkedBusinessRuleCategories'>;
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
}

/**
 * Gerencia vínculos entre a tarefa e regras de negócio do projeto (sem excluir regras).
 */
export const TaskBusinessRulesLinker: React.FC<TaskBusinessRulesLinkerProps> = ({
  task,
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);
  const projectRules = project.businessRules ?? [];
  const canEdit = Boolean(onUpdateProject);

  const linkedIds = useMemo(
    () => new Set(getLinkedBusinessRuleIdsForTask(project, task)),
    [project, task]
  );

  const linkedRules = useMemo(
    () => projectRules.filter(r => linkedIds.has(r.id)),
    [projectRules, linkedIds]
  );

  const availableToLink = useMemo(
    () => projectRules.filter(r => !linkedIds.has(r.id)),
    [projectRules, linkedIds]
  );

  const handleToggle = useCallback(
    (ruleId: string, checked: boolean) => {
      if (!onUpdateProject) return;
      const next = checked
        ? linkTaskToBusinessRule(project, task.id, ruleId)
        : unlinkTaskFromBusinessRule(project, task.id, ruleId);
      onUpdateProject(next);
      toast.success(checked ? 'Regra vinculada à tarefa.' : 'Regra desvinculada da tarefa.');
    },
    [onUpdateProject, project, task.id]
  );

  const handleUnlink = useCallback(
    (ruleId: string) => {
      handleToggle(ruleId, false);
    },
    [handleToggle]
  );

  return (
    <div className="space-y-2.5">
      <section
        className={cn(taskDetailsModalSectionClass, 'space-y-2 px-3 py-2.5')}
        aria-labelledby={`task-br-heading-${safeDomId}`}
      >
        <h3 id={`task-br-heading-${safeDomId}`} className={cn(leveTaskModalFieldLabelClass, 'mb-0')}>
          Regras vinculadas
          <span className="ml-2 font-normal normal-case tracking-normal text-base-content/60">
            ({linkedRules.length})
          </span>
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
          <p className={leveTaskModalMutedClass}>
            Nenhuma regra vinculada a esta tarefa. Use a lista abaixo para vincular uma regra
            existente.
          </p>
        ) : (
          <ul className={leveTaskModalInsetClass} role="list">
            {linkedRules.map(rule => (
              <li
                key={rule.id}
                className="flex items-start justify-between gap-2 border-b border-base-300/30 py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-semibold', leveTaskModalStrongClass)}>
                    {rule.title}
                  </p>
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
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs shrink-0 gap-1 text-error"
                    onClick={() => handleUnlink(rule.id)}
                    aria-label={`Desvincular regra ${rule.title}`}
                  >
                    <Unlink className="h-3.5 w-3.5" aria-hidden />
                    Desvincular
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {projectRules.length > 0 && canEdit && (
        <section
          className={cn(taskDetailsModalSectionClass, 'space-y-2 px-3 py-2.5')}
          aria-labelledby={`task-br-link-heading-${safeDomId}`}
        >
          <h3 id={`task-br-link-heading-${safeDomId}`} className={cn(leveTaskModalFieldLabelClass, 'mb-0')}>
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              Vincular outra regra
            </span>
          </h3>
          <p className={cn(leveTaskModalMutedClass, 'text-xs')}>
            Associe uma regra do projeto. Desvincular não exclui a regra.
          </p>
          {availableToLink.length === 0 ? (
            <p className={leveTaskModalMutedClass}>Todas as regras do projeto já estão vinculadas.</p>
          ) : (
            <ul className="space-y-1.5" role="list">
              {availableToLink.map(rule => (
                <li key={rule.id}>
                  <BusinessRuleLinkCard
                    rule={rule}
                    checked={false}
                    onToggle={checked => handleToggle(rule.id, checked)}
                    domIdPrefix={safeDomId}
                    variant="link"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

TaskBusinessRulesLinker.displayName = 'TaskBusinessRulesLinker';
