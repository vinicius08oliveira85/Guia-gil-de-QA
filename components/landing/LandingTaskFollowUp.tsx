import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { getJiraConfig } from '../../services/jiraService';
import { useFilasTaskTracking } from '../../hooks/useFilasTaskTracking';
import { cn } from '../../utils/cn';
import {
  collectAssigneeOptions,
  collectOpenFilasTasks,
  computeFollowUpSummary,
  countTasksByAssignee,
  filterTasksByAssignees,
  formatTaskActivityLabel,
  getJiraProjectKeyFromTaskId,
  SLA_BUCKET_LABELS,
  sortTasksForFollowUp,
} from '../../utils/landingTaskFollowUp';
import {
  readLandingTaskFollowUpAssignees,
  writeLandingTaskFollowUpAssignees,
} from '../../utils/landingTaskFollowUpStorage';
import { classifyTaskSla } from '../../utils/jiraFilasMetrics';
import { getTaskAssigneeLabel, getTaskStatusLabel } from '../../utils/taskDisplayLabels';
import {
  landingAccentTextClass,
  landingNeuAccentBarClass,
  landingNeuEmptyClass,
  landingNeuFilterBtnClass,
  landingNeuFilterCountClass,
  landingNeuFilterToolbarClass,
  landingNeuLinkBtnClass,
  landingNeuListClass,
  landingNeuOrbCtaClass,
  landingNeuOrbHighlightClass,
  landingNeuPanelBodyClass,
  landingNeuPanelClass,
  landingNeuRowClass,
  landingNeuSectionDescClass,
  landingNeuSectionHeaderClass,
  landingNeuSectionLabelClass,
  landingNeuSlaBadgeClass,
  landingNeuSummaryClass,
  landingNeuSummaryStatClass,
  landingTextMutedClass,
  landingTextStrongClass,
  landingTextSubtleClass,
} from './landingNeuUi';

const LIST_LIMIT = 20;

function toggleAssignee(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

interface AssigneeFilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

const AssigneeFilterChip: React.FC<AssigneeFilterChipProps> = ({
  label,
  count,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={landingNeuFilterBtnClass(active)}
    aria-pressed={active}
    aria-label={`${label}, ${count} tarefa(s)`}
  >
    {label}
    <span className={landingNeuFilterCountClass}>{count}</span>
  </button>
);

/**
 * Painel de acompanhamento das Filas Jira na home, com filtro por responsável.
 */
export const LandingTaskFollowUp = React.memo(() => {
  const navigate = useNavigate();
  const { tasks: filasTasks, slaRiskWindowHours, hasFilasSelection } = useFilasTaskTracking();
  const jiraConfigured = Boolean(getJiraConfig());

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(() =>
    readLandingTaskFollowUpAssignees()
  );

  const openTasks = useMemo(() => collectOpenFilasTasks(filasTasks), [filasTasks]);
  const assigneeOptions = useMemo(() => collectAssigneeOptions(openTasks), [openTasks]);

  const filteredTasks = useMemo(() => {
    const filtered = filterTasksByAssignees(openTasks, selectedAssignees);
    return sortTasksForFollowUp(filtered).slice(0, LIST_LIMIT);
  }, [openTasks, selectedAssignees]);

  const summary = useMemo(
    () =>
      computeFollowUpSummary(
        filterTasksByAssignees(openTasks, selectedAssignees),
        Date.now(),
        slaRiskWindowHours
      ),
    [openTasks, selectedAssignees, slaRiskWindowHours]
  );

  const totalFiltered = useMemo(
    () => filterTasksByAssignees(openTasks, selectedAssignees).length,
    [openTasks, selectedAssignees]
  );

  const persistAssignees = useCallback((next: string[]) => {
    setSelectedAssignees(next);
    writeLandingTaskFollowUpAssignees(next);
  }, []);

  const handleSelectAll = useCallback(() => {
    persistAssignees([]);
  }, [persistAssignees]);

  const handleToggleAssignee = useCallback(
    (assignee: string) => {
      persistAssignees(toggleAssignee(selectedAssignees, assignee));
    },
    [persistAssignees, selectedAssignees]
  );

  const handleOpenTask = useCallback(
    (taskId: string) => {
      sessionStorage.setItem('taskIdToFocus', taskId);
      navigate('/jira-solus');
    },
    [navigate]
  );

  if (!jiraConfigured) return null;

  const allSelected = selectedAssignees.length === 0;

  return (
    <section
      className={cn(landingNeuPanelClass, 'group')}
      aria-labelledby="landing-task-follow-up-heading"
    >
      <div className={landingNeuAccentBarClass} aria-hidden />
      <div className={landingNeuOrbCtaClass} aria-hidden />
      <div className={landingNeuOrbHighlightClass} aria-hidden />

      <div className={landingNeuPanelBodyClass}>
        <div className={landingNeuSectionHeaderClass}>
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <ClipboardList className={cn('h-4 w-4 shrink-0', landingAccentTextClass)} aria-hidden />
              <h2
                id="landing-task-follow-up-heading"
                className={landingNeuSectionLabelClass}
              >
                Acompanhamento de tarefas
              </h2>
            </div>
            <p className={landingNeuSectionDescClass}>
              Filas Jira · sincronizado localmente
            </p>
          </div>
          <Link
            to="/jira-solus"
            className={landingNeuLinkBtnClass}
            aria-label="Ver tarefas em Filas Jira"
          >
            Ver em Filas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {openTasks.length > 0 ? (
          <>
            {summary.total > 0 ? (
              <div className={landingNeuSummaryClass} role="status" aria-live="polite">
                <span className={landingNeuSummaryStatClass}>
                  {summary.total} aberta{summary.total === 1 ? '' : 's'}
                </span>
                {summary.inProgress > 0 ? (
                  <span className={landingNeuSummaryStatClass}>
                    {summary.inProgress} em andamento
                  </span>
                ) : null}
                {summary.atRisk > 0 ? (
                  <span className={landingNeuSummaryStatClass}>
                    {summary.atRisk} em risco
                  </span>
                ) : null}
                {summary.overdue > 0 ? (
                  <span className={landingNeuSummaryStatClass}>
                    {summary.overdue} atrasada{summary.overdue === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
            ) : null}

            {assigneeOptions.length > 0 ? (
              <div
                className="flex flex-col gap-2"
                role="group"
                aria-label="Filtrar por responsável"
              >
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    landingTextSubtleClass
                  )}
                >
                  Responsável
                </span>
                <div className={landingNeuFilterToolbarClass}>
                  <AssigneeFilterChip
                    label="Todos"
                    count={openTasks.length}
                    active={allSelected}
                    onClick={handleSelectAll}
                  />
                  {assigneeOptions.map(assignee => (
                    <AssigneeFilterChip
                      key={assignee}
                      label={assignee}
                      count={countTasksByAssignee(openTasks, assignee)}
                      active={selectedAssignees.includes(assignee)}
                      onClick={() => handleToggleAssignee(assignee)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {filteredTasks.length > 0 ? (
              <>
                <ul className={landingNeuListClass} role="list">
                  {filteredTasks.map(({ task }) => {
                    const slaBucket = classifyTaskSla(task, Date.now(), slaRiskWindowHours);
                    const jiraProjectKey = getJiraProjectKeyFromTaskId(task.id);
                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => handleOpenTask(task.id)}
                          className={landingNeuRowClass}
                          aria-label={`Abrir tarefa ${task.id}: ${task.title}`}
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span
                                className={cn(
                                  'shrink-0 font-mono text-xs font-bold',
                                  landingAccentTextClass
                                )}
                              >
                                {task.id}
                              </span>
                              <span
                                className={cn(
                                  'min-w-0 truncate text-sm font-semibold',
                                  landingTextStrongClass,
                                  'group-hover:text-[var(--project-card-accent)]'
                                )}
                              >
                                {task.title}
                              </span>
                            </div>
                            <p className={cn('mt-0.5 truncate text-xs', landingTextMutedClass)}>
                              {jiraProjectKey}
                              {' · '}
                              {getTaskStatusLabel(task)}
                              {' · '}
                              {getTaskAssigneeLabel(task)}
                              {' · '}
                              {formatTaskActivityLabel(task)}
                            </p>
                          </div>
                          <span className={landingNeuSlaBadgeClass(slaBucket)}>
                            {SLA_BUCKET_LABELS[slaBucket]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {totalFiltered > LIST_LIMIT ? (
                  <p className={cn('text-center text-xs font-medium', landingTextSubtleClass)}>
                    Exibindo {LIST_LIMIT} de {totalFiltered} tarefas.{' '}
                    <Link
                      to="/jira-solus"
                      className={cn('font-semibold hover:underline', landingAccentTextClass)}
                    >
                      Ver todas
                    </Link>
                  </p>
                ) : null}
              </>
            ) : (
              <p className={landingNeuEmptyClass} role="status">
                Nenhuma tarefa em aberto corresponde ao responsável selecionado.
              </p>
            )}
          </>
        ) : (
          <p className={landingNeuEmptyClass} role="status">
            {hasFilasSelection
              ? 'Nenhuma tarefa em aberto nas Filas Jira importadas.'
              : 'Importe filas em Acompanhamento para ver suas tarefas aqui.'}{' '}
            <Link to="/jira-solus" className={cn('font-semibold hover:underline', landingAccentTextClass)}>
              Abrir Filas
            </Link>
          </p>
        )}
      </div>
    </section>
  );
});

LandingTaskFollowUp.displayName = 'LandingTaskFollowUp';
