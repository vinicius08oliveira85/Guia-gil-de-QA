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

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onTaskClick?: (taskId: string) => void;
  /** Sobrescreve heurística automática de ícone */
  icon?: LucideIcon;
  className?: string;
}

/** Mini donut chart para métricas */
const MiniDonut: React.FC<{
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor?: string;
}> = ({ percent, size = 36, strokeWidth = 4, color, bgColor = 'currentColor' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
        className="opacity-15"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
};

/** Card de métrica individual */
const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgGradient: string;
}> = ({ label, value, icon: Icon, color, bgGradient }) => (
  <div className={cn(
    'relative flex flex-col items-center justify-center gap-1 rounded-xl p-2 sm:p-2.5',
    'transition-all duration-300',
    bgGradient
  )}>
    <div className="relative">
      <MiniDonut percent={value} size={38} strokeWidth={3.5} color={color} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 opacity-60" style={{ color }} aria-hidden />
      </div>
    </div>
    <div className="text-center">
      <p className="text-xs font-bold tabular-nums sm:text-sm" style={{ color }}>
        {value}%
      </p>
      <p className="text-[8px] font-semibold uppercase tracking-wider text-base-content/50 sm:text-[9px]">
        {label}
      </p>
    </div>
  </div>
);

/**
 * Card de projeto na listagem do dashboard — layout moderno com métricas visuais.
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
          'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl',
          'bg-gradient-to-br from-base-100 via-base-100 to-base-100/80',
          'border border-base-300/60',
          'min-h-0 p-4 sm:min-h-[17rem] sm:p-5',
          'transition-all duration-300 ease-out',
          'hover:border-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)]',
          'hover:shadow-[0_8px_30px_-12px_color-mix(in_srgb,var(--brand-cta)_25%,transparent)]',
          'hover:-translate-y-0.5',
          'active:scale-[0.98] motion-reduce:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_50%,transparent)] focus-visible:ring-offset-2',
          className
        )}
      >
        {/* Decorative gradient blob */}
        <div 
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]"
          style={{ background: `radial-gradient(circle, var(--brand-cta) 0%, transparent 70%)` }}
          aria-hidden
        />
        <div 
          className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full opacity-[0.05] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.10]"
          style={{ background: `radial-gradient(circle, var(--brand-highlight) 0%, transparent 70%)` }}
          aria-hidden
        />

        {/* Header: Icon + Bug badge */}
        <div className="relative flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-11 sm:w-11',
              'shadow-sm transition-transform duration-300 group-hover:scale-105',
              iconMeta.containerClassName
            )}
            aria-label={iconMeta.label}
            title={iconMeta.label}
          >
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconMeta.iconClassName)} aria-hidden />
          </div>
          {openBugsCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-error/15 to-error/5 px-2.5 py-1 ring-1 ring-error/25 backdrop-blur-sm">
              <Bug className="h-3.5 w-3.5 text-error" aria-hidden />
              <span className="text-xs font-bold tabular-nums text-error">{openBugsCount}</span>
            </div>
          )}
        </div>

        {/* Project title and Jira key */}
        <div className="mt-3 min-w-0 flex-1 space-y-1 sm:mt-4">
          <h3 className="line-clamp-2 font-heading text-base font-bold leading-snug text-[var(--brand-text-strong)] transition-colors duration-200 group-hover:text-[var(--brand-cta)] sm:text-lg">
            {project.name}
          </h3>
          {jiraKey ? (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-base-200/60 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-cta)]" aria-hidden />
              <p className="text-[11px] font-medium text-base-content/60 sm:text-xs">Jira: {jiraKey}</p>
            </div>
          ) : (
            <p className="text-[11px] italic text-base-content/40 sm:text-xs">Sem chave Jira</p>
          )}
        </div>

        {/* Metrics grid with mini donuts */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2">
          <MetricCard
            label="Exec."
            value={testsPercent}
            icon={Zap}
            color="var(--brand-cta)"
            bgGradient="bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-cta)_8%,transparent)] to-transparent"
          />
          <MetricCard
            label="Tasks"
            value={tasksDonePercent}
            icon={CheckCircle2}
            color="#3b82f6"
            bgGradient="bg-gradient-to-br from-blue-500/8 to-transparent"
          />
          <MetricCard
            label="Suc."
            value={metrics.testPassRate}
            icon={TrendingUp}
            color="#10b981"
            bgGradient="bg-gradient-to-br from-emerald-500/8 to-transparent"
          />
        </div>

        {/* SDLC Phase progress */}
        {(project.phases?.length ?? 0) > 0 && (
          <div className="mt-3 space-y-1.5 sm:mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-base-content/50" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/55 sm:text-[11px]">
                  Fase SDLC
                </span>
              </div>
              <span className="text-[11px] font-bold tabular-nums text-[var(--brand-cta)] sm:text-xs">
                {phaseCompletionPercent}%
              </span>
            </div>
            <div
              className="relative h-2 w-full overflow-hidden rounded-full bg-base-200/80"
              role="progressbar"
              aria-valuenow={phaseCompletionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fase SDLC: ${phaseCompletionPercent}%`}
            >
              {/* Animated shimmer overlay */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--brand-cta)] via-[color-mix(in_srgb,var(--brand-cta)_80%,var(--brand-highlight))] to-[var(--brand-cta)] transition-all duration-500 ease-out"
                  style={{ width: `${phaseCompletionPercent}%` }}
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ 
                    width: `${phaseCompletionPercent}%`,
                    animation: 'shimmer 2s infinite'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer: timestamp + users */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
          {updatedAtLabel && (
            <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-base-200/50 px-2 py-1">
              <Clock className="h-3 w-3 shrink-0 text-base-content/50" aria-hidden />
              <span className="truncate text-[10px] font-medium text-base-content/55 sm:text-[11px]">
                {updatedAtLabel}
              </span>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-base-200/50 px-2 py-1 tabular-nums">
            <Users className="h-3 w-3 text-base-content/50" aria-hidden />
            <span className="text-[10px] font-semibold text-base-content/60 sm:text-[11px]">
              {tasks.length}
            </span>
          </div>
        </div>

        {/* Latest completed task link */}
        {onTaskClick && latestCompletedTask && (
          <button
            type="button"
            data-task-link
            onClick={e => {
              e.stopPropagation();
              onTaskClick(latestCompletedTask.id);
            }}
            className={cn(
              'mt-2.5 hidden w-full truncate rounded-xl border border-base-300/50 sm:block',
              'bg-gradient-to-r from-base-200/40 to-base-200/20',
              'px-3 py-2 text-left text-[11px] font-medium text-base-content/60',
              'transition-all duration-200',
              'hover:border-[var(--brand-cta)]/30 hover:bg-[color-mix(in_srgb,var(--brand-cta)_5%,transparent)] hover:text-[var(--brand-cta)]'
            )}
            aria-label={`Abrir tarefa concluída: ${latestCompletedTask.title}`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              <span className="truncate">{latestCompletedTask.title}</span>
            </span>
          </button>
        )}
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
