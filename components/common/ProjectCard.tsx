import React, { useMemo, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../../types';
import {
  Bug,
  Clock,
  Users,
  CheckCircle2,
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  Crosshair,
  Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';
import {
  computePhaseCompletionPercent,
  computeProjectHealth,
  type ProjectHealthTone,
} from '../../utils/workspaceAnalytics';
import { getProjectIconMeta } from '../../utils/projectIcon';
import { normalizeProjectWorkflow } from '../../utils/projectWorkflow';
import { RadialProgress } from './RadialProgress';
import { ConfirmDialog } from './ConfirmDialog';
import {
  projectCardAccentBarClass,
  projectCardChipClass,
  projectCardHealthDotClass,
  projectCardHealthPillClass,
  projectCardIconWrapClass,
  projectCardIndicatorBarClass,
  projectCardIndicatorBarFillClass,
  projectCardIndicatorChipClass,
  projectCardIndicatorIconWrapClass,
  projectCardIndicatorLabelClass,
  projectCardIndicatorValueClass,
  projectCardOrbCtaClass,
  projectCardOrbHighlightClass,
  projectCardShellClass,
  projectCardStatTileClass,
  projectCardStatTileFillClass,
  projectCardStatTileTrackClass,
} from './projectCardUi';

const HEALTH_META: Record<ProjectHealthTone, { label: string; icon: LucideIcon }> = {
  healthy: { label: 'Saudável', icon: ShieldCheck },
  attention: { label: 'Atenção', icon: AlertTriangle },
  critical: { label: 'Crítico', icon: ShieldAlert },
};

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onTaskClick?: (taskId: string) => void;
  onDeleteProject?: () => void | Promise<void>;
  icon?: LucideIcon;
  className?: string;
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  const progress = Math.min(100, Math.max(0, value));
  return (
    <div className={projectCardStatTileClass}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <Icon
            className="h-3 w-3 shrink-0 text-[var(--project-card-text-muted)] opacity-80"
            aria-hidden
          />
          <span className="truncate text-[10px] font-semibold text-[var(--project-card-text-muted)]">
            {label}
          </span>
        </div>
        <span className="text-[11px] font-extrabold tabular-nums text-[var(--project-card-accent)]">
          {value}%
        </span>
      </div>
      <div
        className={projectCardStatTileTrackClass}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${progress}%`}
      >
        <div className={projectCardStatTileFillClass} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export const ProjectCard = React.memo<ProjectCardProps>(
  ({ project, onSelect, onTaskClick, onDeleteProject, icon: iconOverride, className }) => {
    const metrics = useMemo(() => calculateProjectMetrics(project), [project]);
    const tasks = project.tasks || [];
    const health = useMemo(() => computeProjectHealth(project), [project]);
    const openBugsCount = health.openBugs;

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

    const healthTone = health.tone;
    const healthMeta = HEALTH_META[healthTone];
    const HealthIcon = healthMeta.icon;

    const jiraKey = project.settings?.jiraProjectKey;
    const workflow = normalizeProjectWorkflow(project.workflow);
    const workflowLabel = workflow === 'qa' ? 'QA' : 'Dev';

    const hasNoTestCases = metrics.totalTestCases === 0;
    const hasNoExecutedTests = metrics.executedTestCases === 0;
    const hasNoTasks = metrics.totalTasks === 0;

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

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-link]')) return;
      if (target.closest('[data-delete-btn]')) return;
      onSelect?.();
    };

    const handleConfirmDelete = useCallback(async () => {
      if (!onDeleteProject) return;
      setIsDeleting(true);
      try {
        await onDeleteProject();
        setShowDeleteConfirm(false);
      } catch {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    }, [onDeleteProject]);

    const dividerClass =
      'my-2.5 border-t border-[color-mix(in_srgb,var(--project-card-neu-dark)_14%,transparent)]';

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
          'project-card-light',
          'cursor-pointer p-4 sm:p-[1.125rem]',
          'min-h-[12.5rem] sm:min-h-[14rem]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--project-card-bg)]',
          'active:scale-[0.99] motion-reduce:active:scale-100',
          className
        )}
      >
        <div className={projectCardAccentBarClass} aria-hidden />
        <div className={projectCardOrbCtaClass} aria-hidden />
        <div className={projectCardOrbHighlightClass} aria-hidden />

        <div className="relative flex items-center gap-3">
          <div
            className={cn(projectCardIconWrapClass, 'shrink-0')}
            aria-label={iconMeta.label}
            title={iconMeta.label}
          >
            <Icon
              className="h-[1.125rem] w-[1.125rem] text-[var(--project-card-accent)] sm:h-5 sm:w-5"
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3
                className="truncate font-sans text-[0.9375rem] font-extrabold leading-tight text-[var(--project-card-text)] transition-colors duration-200 group-hover:text-[var(--project-card-accent)] sm:text-base"
                title={project.name}
              >
                {project.name}
              </h3>
              <span
                className={cn(
                  projectCardChipClass,
                  'inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5',
                  'text-[9px] font-bold uppercase tracking-wider',
                  workflow === 'qa'
                    ? 'text-primary'
                    : 'text-[color-mix(in_srgb,var(--project-card-text)_80%,transparent)]'
                )}
              >
                <span
                  className="h-1 w-1 shrink-0 rounded-full bg-current opacity-70"
                  aria-hidden
                />
                {workflowLabel}
              </span>
            </div>
            {jiraKey ? (
              <span
                className={cn(
                  projectCardChipClass,
                  'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium',
                  'text-[color-mix(in_srgb,var(--project-card-text)_90%,transparent)]'
                )}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--project-card-accent)]"
                  aria-hidden
                />
                Jira: {jiraKey}
              </span>
            ) : (
              <p className="text-[11px] italic text-[var(--project-card-text-subtle)]">
                Sem chave Jira
              </p>
            )}
          </div>

          <RadialProgress
            value={tasksDonePercent}
            ariaLabel="Conclusão de tarefas"
            className="shrink-0"
          >
            <span className="flex flex-col items-center leading-none">
              <span className="font-sans text-sm font-extrabold tabular-nums text-[var(--project-card-accent)]">
                {tasksDonePercent}%
              </span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-[var(--project-card-text-muted)]">
                Tasks
              </span>
            </span>
          </RadialProgress>
        </div>

        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className={projectCardHealthPillClass(healthTone)}>
            <HealthIcon className="h-3 w-3 shrink-0" aria-hidden />
            <span className={projectCardHealthDotClass(healthTone)} aria-hidden />
            {healthMeta.label}
          </span>
        </div>

        <div className={dividerClass} />

        <div className="flex gap-2">
          <StatTile value={testsPercent} label="Exec." icon={Zap} />
        </div>

        {(project.phases?.length ?? 0) > 0 && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[var(--project-card-text-muted)]">
              <Activity className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                SDLC
              </span>
            </div>
            <span className={cn(projectCardIndicatorValueClass, 'ml-auto')}>
              {phaseCompletionPercent}%
            </span>
          </div>
        )}
        {(project.phases?.length ?? 0) > 0 && (
          <div className={cn(projectCardIndicatorBarClass, 'mt-1.5')} role="progressbar" aria-valuenow={phaseCompletionPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Fase SDLC: ${phaseCompletionPercent}%`}>
            <div className={projectCardIndicatorBarFillClass} style={{ width: `${phaseCompletionPercent}%` }} />
          </div>
        )}

        <div className={dividerClass} />

        <div className="grid grid-cols-2 gap-2">
          <div className={projectCardIndicatorChipClass}>
            <div className="flex items-center gap-2">
              <div className={projectCardIndicatorIconWrapClass}>
                <Crosshair className="h-3 w-3 text-[var(--project-card-accent)]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                <span className={projectCardIndicatorLabelClass}>Cobertura</span>
                <span className={projectCardIndicatorValueClass}>{hasNoTasks ? '\u2014' : `${metrics.testCoverage}%`}</span>
              </div>
            </div>
            <div className={projectCardIndicatorBarClass} role="progressbar" aria-valuenow={hasNoTasks ? 0 : metrics.testCoverage} aria-valuemin={0} aria-valuemax={100} aria-label={`Cobertura: ${hasNoTasks ? 'sem dados' : `${metrics.testCoverage}%`}`}>
              <div className={projectCardIndicatorBarFillClass} style={{ width: `${hasNoTasks ? 0 : metrics.testCoverage}%` }} />
            </div>
          </div>
          <div className={cn(projectCardIndicatorChipClass, 'max-sm:hidden')}>
            <div className="flex items-center gap-2">
              <div className={projectCardIndicatorIconWrapClass}>
                <Bot className="h-3 w-3 text-[var(--project-card-accent)]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                <span className={projectCardIndicatorLabelClass}>Automação</span>
                <span className={projectCardIndicatorValueClass}>{hasNoTestCases ? '\u2014' : `${metrics.automationRatio}%`}</span>
              </div>
            </div>
            <div className={projectCardIndicatorBarClass} role="progressbar" aria-valuenow={hasNoTestCases ? 0 : metrics.automationRatio} aria-valuemin={0} aria-valuemax={100} aria-label={`Automação: ${hasNoTestCases ? 'sem dados' : `${metrics.automationRatio}%`}`}>
              <div className={projectCardIndicatorBarFillClass} style={{ width: `${hasNoTestCases ? 0 : metrics.automationRatio}%` }} />
            </div>
          </div>
          <div className={projectCardIndicatorChipClass}>
            <div className="flex items-center gap-2">
              <div className={projectCardIndicatorIconWrapClass}>
                <CheckCircle2 className="h-3 w-3 text-[var(--project-card-accent)]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                <span className={projectCardIndicatorLabelClass}>Aprovação</span>
                <span className={projectCardIndicatorValueClass}>{hasNoExecutedTests ? '\u2014' : `${metrics.testPassRate}%`}</span>
              </div>
            </div>
            <div className={projectCardIndicatorBarClass} role="progressbar" aria-valuenow={hasNoExecutedTests ? 0 : metrics.testPassRate} aria-valuemin={0} aria-valuemax={100} aria-label={`Aprovação: ${hasNoExecutedTests ? 'sem dados' : `${metrics.testPassRate}%`}`}>
              <div className={projectCardIndicatorBarFillClass} style={{ width: `${hasNoExecutedTests ? 0 : metrics.testPassRate}%` }} />
            </div>
          </div>
          <div className={cn(projectCardIndicatorChipClass, 'max-sm:hidden')}>
            <div className="flex items-center gap-2">
              <div className={projectCardIndicatorIconWrapClass}>
                <Bug className="h-3 w-3 text-[var(--project-card-accent)]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                <span className={projectCardIndicatorLabelClass}>Bugs</span>
                <span className={cn(projectCardIndicatorValueClass, openBugsCount > 0 && 'text-error')}>{openBugsCount}</span>
              </div>
            </div>
            <div className={projectCardIndicatorBarClass} role="progressbar" aria-valuenow={Math.min(openBugsCount + (openBugsCount > 0 ? 1 : 0), 10)} aria-valuemin={0} aria-valuemax={10} aria-label={`Bugs abertos: ${openBugsCount}`}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${openBugsCount > 0 ? Math.min((openBugsCount / 20) * 100, 100) : 0}%`,
                  background: openBugsCount > 0
                    ? 'linear-gradient(90deg, color-mix(in srgb, #dc2626 72%, white) 0%, #dc2626 100%)'
                    : 'var(--project-card-progress-fill)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-3.5">
          <div className={cn(projectCardChipClass, 'flex min-w-0 items-center gap-1.5 px-2 py-1')}>
            <Clock className="h-3 w-3 shrink-0 text-[var(--project-card-text-muted)]" aria-hidden />
            <span className="truncate text-[10px] font-medium text-[var(--project-card-text-muted)] sm:text-[11px]">
              {updatedAtLabel || 'sem atividade'}
            </span>
            <span className="text-[var(--project-card-text-muted)] opacity-30" aria-hidden>·</span>
            <Users className="h-3 w-3 shrink-0 text-[var(--project-card-text-muted)]" aria-hidden />
            <span className="text-[10px] font-semibold tabular-nums text-[var(--project-card-text-muted)] sm:text-[11px]">
              {tasks.length}
            </span>
          </div>
          {onDeleteProject ? (
            <button
              type="button"
              data-delete-btn
              onClick={e => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className={cn(
                projectCardChipClass,
                'flex shrink-0 items-center gap-1 px-2 py-1',
                'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                'text-[color-mix(in_srgb,#dc2626_72%,var(--project-card-text-muted))]',
                'hover:text-error hover:bg-[color-mix(in_srgb,#dc2626_8%,var(--project-card-bg))]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#dc2626_35%,transparent)]'
              )}
              aria-label={`Excluir projeto ${project.name}`}
              title="Excluir este projeto"
            >
              <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
            </button>
          ) : null}
        </div>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => void handleConfirmDelete()}
          title={`Excluir "${project.name}"`}
          message="Esta ação não pode ser desfeita. Todas as tarefas, documentos e dados deste projeto serão removidos."
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isDeleting}
        />

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
