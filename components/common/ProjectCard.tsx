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
import { contextBadgeClass } from './viewUi';
import {
  projectCardAccentBarClass,
  projectCardMetricCellClass,
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

type MetricTheme = {
  ringClass: string;
  valueClass: string;
  iconClass: string;
};

const METRIC_THEMES: Record<'exec' | 'tasks' | 'success', MetricTheme> = {
  exec: {
    ringClass: 'text-[var(--project-card-accent)]',
    valueClass: 'text-[var(--project-card-accent)]',
    iconClass: 'text-[var(--project-card-accent)]',
  },
  tasks: {
    ringClass: 'text-[var(--project-card-accent)]',
    valueClass: 'text-[var(--project-card-accent)]',
    iconClass: 'text-[var(--project-card-accent)]',
  },
  success: {
    ringClass: 'text-[var(--project-card-accent)]',
    valueClass: 'text-[var(--project-card-accent)]',
    iconClass: 'text-[var(--project-card-accent)]',
  },
};

function MetricRing({
  value,
  theme,
  icon: Icon,
  label,
}: {
  value: number;
  theme: MetricTheme;
  icon: LucideIcon;
  label: string;
}) {
  const size = 40;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={projectCardMetricCellClass}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            className="text-[color-mix(in_srgb,var(--project-card-text)_22%,transparent)]"
            cx={size / 2}
            cy={size / 2}
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <circle
            className={cn(theme.ringClass, 'transition-all duration-700 ease-out')}
            cx={size / 2}
            cy={size / 2}
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Icon className={cn('h-3 w-3 opacity-70', theme.iconClass)} />
        </span>
      </div>
      <p className={cn('text-[11px] font-bold tabular-nums leading-none sm:text-xs', theme.valueClass)}>
        {value}%
      </p>
      <p className="text-[8px] font-semibold uppercase tracking-wider text-[var(--project-card-text-muted)] sm:text-[9px]">
        {label}
      </p>
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
          'cursor-pointer p-3.5 sm:p-4',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--project-card-bg)]',
          'active:scale-[0.99] motion-reduce:active:scale-100',
          className
        )}
      >
        <div className={projectCardAccentBarClass} aria-hidden />
        <div className={projectCardOrbCtaClass} aria-hidden />
        <div className={projectCardOrbHighlightClass} aria-hidden />

        <div className="relative flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--project-card-inner-radius)] ring-1 sm:h-10 sm:w-10',
              'bg-[color-mix(in_srgb,var(--project-card-accent)_16%,transparent)]',
              'ring-[color-mix(in_srgb,white_22%,transparent)]',
              'shadow-sm transition-transform duration-300 group-hover:scale-[1.04]'
            )}
            aria-label={iconMeta.label}
            title={iconMeta.label}
          >
            <Icon
              className="h-4 w-4 text-[var(--project-card-accent)] sm:h-[1.125rem] sm:w-[1.125rem]"
              aria-hidden
            />
          </div>
          {openBugsCount > 0 ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-[var(--project-card-inner-radius)] px-2 py-0.5',
                'border border-error/40 bg-error/20 text-error-content',
                'text-[11px] font-bold tabular-nums shadow-sm'
              )}
            >
              <Bug className="h-3 w-3 shrink-0" aria-hidden />
              {openBugsCount}
            </div>
          ) : null}
        </div>

        <div className="relative mt-2.5 min-w-0 flex-1 space-y-1 sm:mt-3">
          <h3 className="line-clamp-2 font-sans text-[0.9375rem] font-extrabold leading-snug text-[var(--project-card-text)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)] sm:text-base">
            {project.name}
          </h3>
          {jiraKey ? (
            <span
              className={cn(
                contextBadgeClass,
                'inline-flex items-center gap-1.5 border-white/15 bg-white/10 text-[var(--project-card-text-muted)]'
              )}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--project-card-accent)]" aria-hidden />
              Jira: {jiraKey}
            </span>
          ) : (
            <p className="text-[11px] italic text-[var(--project-card-text-subtle)]">Sem chave Jira</p>
          )}
        </div>

        <div className={cn(projectCardMetricsPanelClass, 'mt-2.5 sm:mt-3')}>
          <MetricRing value={testsPercent} theme={METRIC_THEMES.exec} icon={Zap} label="Exec." />
          <MetricRing value={tasksDonePercent} theme={METRIC_THEMES.tasks} icon={CheckCircle2} label="Tasks" />
          <MetricRing value={metrics.testPassRate} theme={METRIC_THEMES.success} icon={TrendingUp} label="Suc." />
        </div>

        {(project.phases?.length ?? 0) > 0 && (
          <div className="mt-2.5 space-y-1 sm:mt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[var(--project-card-text-muted)]">
                <Activity className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
                  Fase SDLC
                </span>
              </div>
              <span className="text-[11px] font-bold tabular-nums text-[var(--project-card-accent)]">
                {phaseCompletionPercent}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-[var(--project-card-inner-radius)] bg-[color-mix(in_srgb,white_12%,transparent)]"
              role="progressbar"
              aria-valuenow={phaseCompletionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fase SDLC: ${phaseCompletionPercent}%`}
            >
              <div
                className="h-full rounded-[var(--project-card-inner-radius)] bg-[var(--project-card-accent)] transition-[width] duration-500 ease-out"
                style={{ width: `${phaseCompletionPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 sm:pt-3">
          {updatedAtLabel ? (
            <div className="flex min-w-0 items-center gap-1 rounded-[var(--project-card-inner-radius)] bg-[var(--project-card-chip)] px-2 py-0.5">
              <Clock className="h-3 w-3 shrink-0 text-[var(--project-card-text-muted)]" aria-hidden />
              <span className="truncate text-[10px] font-medium text-[var(--project-card-text-muted)] sm:text-[11px]">
                {updatedAtLabel}
              </span>
            </div>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 items-center gap-1 rounded-[var(--project-card-inner-radius)] bg-[var(--project-card-chip)] px-2 py-0.5 tabular-nums">
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
              'mt-2 hidden w-full truncate rounded-[var(--project-card-inner-radius)] border border-[var(--project-card-border)] sm:block',
              'bg-[var(--project-card-chip)] px-2.5 py-1.5 text-left text-[11px] font-medium text-[var(--project-card-text-muted)]',
              'transition-colors duration-200',
              'hover:border-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--project-card-accent)_12%,transparent)] hover:text-[var(--project-card-accent)]'
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
