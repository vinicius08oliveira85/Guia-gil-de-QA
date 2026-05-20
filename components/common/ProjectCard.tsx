import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../../types';
import { Bug, Clock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';
import { computePhaseCompletionPercent } from '../../utils/workspaceAnalytics';
import { getProjectIconMeta } from '../../utils/projectIcon';

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onTaskClick?: (taskId: string) => void;
  /** Sobrescreve heurística automática de ícone */
  icon?: LucideIcon;
  className?: string;
}

/**
 * Card de projeto na listagem do dashboard — layout compacto com métricas EXEC / TASKS / SUC.
 */
export const ProjectCard = React.memo<ProjectCardProps>(
  ({ project, onSelect, onTaskClick, icon: iconOverride, className }) => {
    const metrics = useMemo(() => calculateProjectMetrics(project), [project]);
    const tasks = project.tasks || [];
    const openBugsCount = metrics.openVsClosedBugs?.open ?? 0;

    const iconMeta = useMemo(() => {
      const meta = getProjectIconMeta(project);
      if (iconOverride) return { ...meta, icon: iconOverride };
      return meta;
    }, [project, iconOverride]);

    const Icon = iconMeta.icon;

    const updatedAtLabel = useMemo(() => {
      const date = project.updatedAt || project.createdAt;
      if (!date) return null;
      try {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
      } catch {
        return null;
      }
    }, [project.updatedAt, project.createdAt]);

    const testsPercent = useMemo(() => {
      if (metrics.totalTestCases === 0) return 0;
      return Math.round((metrics.executedTestCases / metrics.totalTestCases) * 100);
    }, [metrics.totalTestCases, metrics.executedTestCases]);

    const tasksDonePercent = useMemo(() => {
      if (tasks.length === 0) return 0;
      const completed = tasks.filter(t => getTaskStatusCategory(t) === 'Concluído').length;
      return Math.round((completed / tasks.length) * 100);
    }, [tasks]);

    const phaseCompletionPercent = useMemo(() => computePhaseCompletionPercent(project), [project]);

    const jiraKey = project.settings?.jiraProjectKey;

    const latestCompletedTask = useMemo(() => {
      const completed = tasks
        .filter(t => getTaskStatusCategory(t) === 'Concluído')
        .sort((a, b) => {
          const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bDate - aDate;
        });
      return completed[0] ?? null;
    }, [tasks]);

    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-link]')) return;
      onSelect?.();
    };

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Abrir projeto: ${project.name}`}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.();
          }
        }}
        className={cn(
          'group relative flex h-full cursor-pointer flex-col rounded-[var(--rounded-box)] border border-base-300/70 bg-base-100 soft-shadow',
          'min-h-0 p-3 sm:min-h-[14.5rem] sm:p-4',
          'transition-[box-shadow,border-color,transform] duration-200',
          'hover:border-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)] hover:shadow-md',
          'active:scale-[0.99] motion-reduce:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] focus-visible:ring-offset-2',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-9 sm:w-9',
              iconMeta.containerClassName
            )}
            aria-label={iconMeta.label}
            title={iconMeta.label}
          >
            <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', iconMeta.iconClassName)} aria-hidden />
          </div>
          {openBugsCount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-error/10 px-1.5 py-0.5 text-[11px] font-semibold text-error ring-1 ring-error/20 sm:text-xs">
              <Bug className="h-3 w-3" aria-hidden />
              {openBugsCount}
            </span>
          )}
        </div>

        <div className="mt-2 min-w-0 flex-1 space-y-0.5 sm:mt-3 sm:space-y-1">
          <h3 className="line-clamp-2 font-heading text-[0.9375rem] font-bold leading-snug text-[var(--brand-text-strong)] sm:text-lg">
            {project.name}
          </h3>
          {jiraKey ? (
            <p className="truncate text-[11px] text-base-content/55 sm:text-xs">Jira: {jiraKey}</p>
          ) : (
            <p className="text-[11px] italic text-base-content/40 sm:text-xs">Sem chave Jira</p>
          )}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-0.5 border-y border-base-300/40 py-2 text-center sm:mt-3 sm:gap-1 sm:py-2.5">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wide text-base-content/50 sm:text-[9px]">
              Exec.
            </p>
            <p className="text-xs font-bold tabular-nums text-base-content sm:text-sm">{testsPercent}%</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wide text-base-content/50 sm:text-[9px]">
              Tasks
            </p>
            <p className="text-xs font-bold tabular-nums text-base-content sm:text-sm">
              {tasksDonePercent}%
            </p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wide text-base-content/50 sm:text-[9px]">
              Suc.
            </p>
            <p className="text-xs font-bold tabular-nums text-success sm:text-sm">
              {metrics.testPassRate}%
            </p>
          </div>
        </div>

        {(project.phases?.length ?? 0) > 0 && (
          <div className="mt-2 space-y-0.5 sm:mt-2.5 sm:space-y-1">
            <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide text-base-content/55 sm:text-[10px]">
              <span>Fase SDLC</span>
              <span className="tabular-nums">{phaseCompletionPercent}%</span>
            </div>
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-base-200 sm:h-1.5"
              role="progressbar"
              aria-valuenow={phaseCompletionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fase SDLC: ${phaseCompletionPercent}%`}
            >
              <div
                className="h-full rounded-full bg-[var(--brand-cta)] transition-[width] duration-300"
                style={{ width: `${phaseCompletionPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-base-content/55 sm:pt-3 sm:text-xs">
          {updatedAtLabel && (
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <Clock className="h-3 w-3 shrink-0 opacity-70 sm:h-3.5 sm:w-3.5" aria-hidden />
              <span className="truncate">{updatedAtLabel}</span>
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
            <Users className="h-3 w-3 shrink-0 opacity-70 sm:h-3.5 sm:w-3.5" aria-hidden />
            {tasks.length}
          </span>
        </div>

        {onTaskClick && latestCompletedTask && (
          <button
            type="button"
            data-task-link
            onClick={e => {
              e.stopPropagation();
              onTaskClick(latestCompletedTask.id);
            }}
            className="mt-1.5 hidden w-full truncate rounded-md border border-base-300/50 bg-base-200/40 px-2 py-1 text-left text-[11px] text-base-content/60 hover:border-primary/30 hover:text-primary sm:mt-2 sm:block"
            aria-label={`Abrir tarefa concluída: ${latestCompletedTask.title}`}
          >
            {latestCompletedTask.title}
          </button>
        )}
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
