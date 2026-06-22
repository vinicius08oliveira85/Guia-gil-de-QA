import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../../types';
import { Bug, Clock, Users, TrendingUp, CheckCircle2, Zap, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';
import { computePhaseCompletionPercent } from '../../utils/workspaceAnalytics';
import { getProjectIconMeta } from '../../utils/projectIcon';
import {
  projectCardAccentBarClass,
  projectCardChipClass,
  projectCardIconWrapClass,
  projectCardMetricFillClass,
  projectCardMetricKnobClass,
  projectCardMetricRowClass,
  projectCardMetricTrackClass,
  projectCardMetricsPanelClass,
  projectCardOrbCtaClass,
  projectCardOrbHighlightClass,
  projectCardShellClass,
} from './projectCardUi';

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onTaskClick?: (taskId: string) => void;
  icon?: LucideIcon;
  className?: string;
}

function NeumorphicProgressBar({
  value,
  label,
  ariaLabel,
}: {
  value: number;
  label: string;
  ariaLabel: string;
}) {
  const progress = Math.min(100, Math.max(0, value));
  const knobLeft = `clamp(0px, calc(${progress}% - 6px), calc(100% - 12px))`;

  return (
    <div
      className={projectCardMetricTrackClass}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className={projectCardMetricFillClass} style={{ width: `${progress}%` }} />
      {progress > 0 ? (
        <span
          className={projectCardMetricKnobClass}
          style={{ left: knobLeft }}
          aria-hidden
        />
      ) : null}
      <span className="sr-only">{label}: {progress}%</span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className={projectCardMetricRowClass}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3 w-3 shrink-0 text-[var(--project-card-text-muted)] opacity-80" aria-hidden />
          <span className="text-[10px] font-semibold text-[var(--project-card-text-muted)] sm:text-[11px]">
            {label}
          </span>
        </div>
        <span className="text-[11px] font-bold tabular-nums text-[var(--project-card-accent)] sm:text-xs">
          {value}%
        </span>
      </div>
      <NeumorphicProgressBar value={value} label={label} ariaLabel={`${label}: ${value}%`} />
    </div>
  );
}

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
          projectCardShellClass,
          'cursor-pointer p-4 sm:p-[1.125rem]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--project-card-bg)]',
          'active:scale-[0.99] motion-reduce:active:scale-100',
          className
        )}
      >
        <div className={projectCardAccentBarClass} aria-hidden />
        <div className={projectCardOrbCtaClass} aria-hidden />
        <div className={projectCardOrbHighlightClass} aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div
            className={projectCardIconWrapClass}
            aria-label={iconMeta.label}
            title={iconMeta.label}
          >
            <Icon
              className="h-[1.125rem] w-[1.125rem] text-[var(--project-card-accent)] sm:h-5 sm:w-5"
              aria-hidden
            />
          </div>
          {openBugsCount > 0 ? (
            <div
              className={cn(
                projectCardChipClass,
                'inline-flex items-center gap-1 px-2.5 py-1'
              )}
            >
              <Bug
                className="h-3 w-3 shrink-0 text-[color-mix(in_srgb,#dc2626_88%,var(--project-card-accent))]"
                aria-hidden
              />
              <span className="text-[11px] font-bold tabular-nums text-[color-mix(in_srgb,#b91c1c_82%,var(--project-card-text))]">
                {openBugsCount}
              </span>
            </div>
          ) : null}
        </div>

        <div className="relative mt-3 min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 font-sans text-[0.9375rem] font-extrabold leading-snug text-[var(--project-card-text)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)] sm:text-base">
            {project.name}
          </h3>
          {jiraKey ? (
            <span
              className={cn(
                projectCardChipClass,
                'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium',
                'text-[color-mix(in_srgb,var(--project-card-text)_90%,transparent)]'
              )}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--project-card-accent)]" aria-hidden />
              Jira: {jiraKey}
            </span>
          ) : (
            <p className="text-[11px] italic text-[var(--project-card-text-subtle)]">Sem chave Jira</p>
          )}
        </div>

        <div className={cn(projectCardMetricsPanelClass, 'mt-3 sm:mt-3.5')}>
          <MetricRow value={testsPercent} label="Exec." icon={Zap} />
          <MetricRow value={tasksDonePercent} label="Tasks" icon={CheckCircle2} />
          <MetricRow value={metrics.testPassRate} label="Suc." icon={TrendingUp} />
        </div>

        {(project.phases?.length ?? 0) > 0 && (
          <div className={cn(projectCardMetricRowClass, 'mt-3 sm:mt-3.5')}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[var(--project-card-text-muted)]">
                <Activity className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
                  Fase SDLC
                </span>
              </div>
              <span className="text-[11px] font-bold tabular-nums text-[var(--project-card-accent)] sm:text-xs">
                {phaseCompletionPercent}%
              </span>
            </div>
            <NeumorphicProgressBar
              value={phaseCompletionPercent}
              label="Fase SDLC"
              ariaLabel={`Fase SDLC: ${phaseCompletionPercent}%`}
            />
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-3.5">
          {updatedAtLabel ? (
            <div className={cn(projectCardChipClass, 'flex min-w-0 items-center gap-1 px-2 py-1')}>
              <Clock className="h-3 w-3 shrink-0 text-[var(--project-card-text-muted)]" aria-hidden />
              <span className="truncate text-[10px] font-medium text-[var(--project-card-text-muted)] sm:text-[11px]">
                {updatedAtLabel}
              </span>
            </div>
          ) : (
            <span />
          )}
          <div
            className={cn(
              projectCardChipClass,
              'flex shrink-0 items-center gap-1 px-2 py-1 tabular-nums'
            )}
          >
            <Users className="h-3 w-3 text-[var(--project-card-text-muted)]" aria-hidden />
            <span className="text-[10px] font-semibold text-[var(--project-card-text-muted)] sm:text-[11px]">
              {tasks.length}
            </span>
          </div>
        </div>

        {onTaskClick && latestCompletedTask ? (
          <button
            type="button"
            data-task-link
            onClick={e => {
              e.stopPropagation();
              onTaskClick(latestCompletedTask.id);
            }}
            className={cn(
              projectCardChipClass,
              'mt-2.5 hidden w-full truncate px-2.5 py-1.5 text-left sm:block',
              'text-[11px] font-medium text-[var(--project-card-text-muted)]',
              'transition-[box-shadow,color] duration-200',
              'hover:text-[var(--project-card-accent)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]'
            )}
            aria-label={`Abrir tarefa concluída: ${latestCompletedTask.title}`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              <span className="truncate">{latestCompletedTask.title}</span>
            </span>
          </button>
        ) : null}
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
