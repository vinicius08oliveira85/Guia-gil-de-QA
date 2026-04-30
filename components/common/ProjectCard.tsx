import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../../types';
import { Layout, CheckCircle2, Bug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';
import { computePhaseCompletionPercent } from '../../utils/workspaceAnalytics';

/** Risco: 2+ bugs abertos ou taxa de sucesso < 70% (com testes executados). Aviso: 1 bug ou taxa < 90%. */
function getProjectHealth(openBugs: number, testPassRate: number, executedTestCases: number): 'ok' | 'warning' | 'risk' {
    if (openBugs >= 2 || (executedTestCases > 0 && testPassRate < 70)) return 'risk';
    if (openBugs >= 1 || (executedTestCases > 0 && testPassRate < 90)) return 'warning';
    return 'ok';
}

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutRingProps {
  percent: number;
  strokeClass: string;
  label: string;
  /** Métricas em grade 3×1: donut empilhado com rótulo abaixo. */
  compact?: boolean;
}

function DonutRing({ percent, strokeClass, label, compact }: DonutRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const dashArray = `${(clamped / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;

  if (compact) {
    return (
      <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
        <div className="relative h-11 w-11 flex-shrink-0 rounded-full bg-base-200/40 p-0.5 shadow-inner ring-1 ring-base-content/[0.04]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
            <circle
              className="stroke-base-300/80"
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
            />
            <circle
              className={cn('transition-all duration-300', strokeClass)}
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              strokeDasharray={dashArray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold tabular-nums text-base-content">{Math.round(clamped)}%</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold leading-tight tracking-wide text-base-content/65">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 flex-shrink-0 rounded-full bg-base-200/40 p-0.5 shadow-inner ring-1 ring-base-content/[0.04]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle
            className="stroke-base-300/80"
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
          />
          <circle
            className={cn('transition-all duration-300', strokeClass)}
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            strokeDasharray={dashArray}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold tabular-nums text-base-content">{Math.round(clamped)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold tracking-wide text-base-content/65">{label}</span>
    </div>
  );
}

/** Decoração de canto inspirada em stat cards (21st/Magic): profundidade sem competir com o conteúdo. */
function CardCornerDecoration({ subtle }: { subtle?: boolean }) {
  return (
    <svg
      className={cn(
        'pointer-events-none absolute z-0 text-primary',
        subtle ? '-right-4 -top-4 h-32 w-32' : '-right-6 -top-6 h-44 w-44 sm:h-52 sm:w-52'
      )}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden
    >
      <circle cx="130" cy="70" r="78" className="fill-current opacity-[0.06]" />
      <circle cx="168" cy="130" r="52" className="fill-current opacity-[0.05]" />
      <circle cx="100" cy="150" r="28" className="fill-current opacity-[0.04]" />
    </svg>
  );
}

/** Textura de pontos sutil no hover (Bento Grid / Magic MCP). */
function CardDotTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 text-base-content/[0.07] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] bg-[length:5px_5px]" />
    </div>
  );
}

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onTaskClick?: (taskId: string) => void;
  icon?: LucideIcon;
  className?: string;
  /** Grade no dashboard: coluna única + métricas 3×1 compactas (bento-style). */
  layout?: 'grid' | 'row';
}

/**
 * Card de projeto: ícone, nome, Jira, 3 donuts (Testes/Tarefas/Sucesso) e atividades recentes; clique no card abre o projeto.
 * `layout="grid"` otimiza para grade 3×N no dashboard.
 */
export const ProjectCard = React.memo<ProjectCardProps>(({
  project,
  onSelect,
  onTaskClick,
  icon: Icon = Layout,
  className,
  layout = 'row',
}) => {
  const isGrid = layout === 'grid';
  const metrics = useMemo(() => calculateProjectMetrics(project), [project]);
  const tasks = project.tasks || [];
  const openBugsCount = metrics.openVsClosedBugs?.open ?? 0;
  const health = useMemo(
    () => getProjectHealth(openBugsCount, metrics.testPassRate, metrics.executedTestCases),
    [openBugsCount, metrics.testPassRate, metrics.executedTestCases]
  );
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

  const tasksPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => getTaskStatusCategory(t) === 'Concluído').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const successPercent = useMemo(() => metrics.testPassRate, [metrics.testPassRate]);

  const phaseCompletionPercent = useMemo(() => computePhaseCompletionPercent(project), [project]);

  const recentActivity = useMemo(() => {
    const completed = tasks
      .filter(t => getTaskStatusCategory(t) === 'Concluído')
      .sort((a, b) => {
        const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 2);
    return completed.map(t => ({ id: t.id, title: t.title }));
  }, [tasks]);

  const jiraLabel = project.settings?.jiraProjectKey
    ? `Jira: ${project.settings.jiraProjectKey}`
    : 'Projeto QA';

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('[data-task-activity]')) return;
    onSelect?.();
  };

  const healthBarClass =
    health === 'risk'
      ? 'from-error/90 via-error to-error/80'
      : health === 'warning'
        ? 'from-warning/90 via-warning to-warning/80'
        : 'from-success/90 via-success to-success/80';

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
        'group relative isolate cursor-pointer overflow-hidden rounded-3xl border border-base-300/80',
        'bg-gradient-to-br from-base-100 via-base-100 to-base-200/35',
        'p-4 shadow-sm shadow-base-content/[0.03] ring-1 ring-base-content/[0.025]',
        isGrid
          ? 'flex h-full min-h-0 flex-col gap-4'
          : 'flex flex-wrap flex-col gap-6 md:flex-row md:items-center',
        'transition-[box-shadow,border-color] duration-300 ease-out',
        'hover:border-base-300 hover:shadow-md hover:shadow-base-content/[0.06] hover:ring-base-content/[0.05]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200',
        className
      )}
    >
      {isGrid && <CardDotTexture />}
      <CardCornerDecoration subtle={isGrid} />
      {/* Barra de saúde no topo */}
      <div
        className={cn(
          'absolute left-0 right-0 top-0 z-[2] h-1 bg-gradient-to-r opacity-95',
          healthBarClass
        )}
        aria-hidden
      />
      {/* Seção esquerda / topo: ícone + nome + Jira */}
      <div
        className={cn(
          'relative z-[1] flex gap-3 sm:gap-4',
          isGrid ? 'w-full items-start' : 'items-center md:w-1/4'
        )}
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-[1.02]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'line-clamp-2 text-balance text-sm font-bold uppercase leading-tight tracking-tight text-base-content sm:line-clamp-3 sm:tracking-wide',
              isGrid && 'line-clamp-3'
            )}
          >
            {project.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-base-content/55">{jiraLabel}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {openBugsCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-lg border border-error/15 bg-error/10 px-2 py-0.5 text-xs font-medium text-error shadow-sm"
                title={`${openBugsCount} bug(s) aberto(s)`}
              >
                <Bug className="w-3.5 h-3.5" aria-hidden />
                {openBugsCount} {openBugsCount === 1 ? 'bug aberto' : 'bugs abertos'}
              </span>
            )}
            {updatedAtLabel && (
              <span className="text-[11px] text-base-content/50" title="Última atualização">
                Atualizado {updatedAtLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seção central: donuts + atividades recentes */}
      <div
        className={cn(
          'relative z-[1] border-t border-base-300/70',
          isGrid
            ? 'flex w-full flex-1 flex-col gap-3 pt-3'
            : 'flex flex-grow flex-wrap items-center justify-between gap-4 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0'
        )}
      >
        <div
          className={cn(
            isGrid ? 'grid w-full grid-cols-3 gap-1 sm:gap-2' : 'flex gap-6 md:gap-8'
          )}
        >
          <DonutRing
            percent={testsPercent}
            strokeClass="stroke-success"
            label="Testes"
            compact={isGrid}
          />
          <DonutRing
            percent={tasksPercent}
            strokeClass="stroke-secondary"
            label="Tarefas"
            compact={isGrid}
          />
          <DonutRing
            percent={successPercent}
            strokeClass="stroke-primary"
            label="Sucesso"
            compact={isGrid}
          />
        </div>
        <div
          className={cn(
            'flex flex-col gap-2',
            isGrid ? 'w-full' : 'ml-8 hidden max-w-xs flex-1 md:flex'
          )}
        >
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 2).map((item, i) => (
              <button
                key={item.id}
                type="button"
                data-task-activity
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick?.(item.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onTaskClick?.(item.id);
                  }
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-xl border border-primary/10 bg-primary/[0.06] px-3 py-2 text-left shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/10',
                  !isGrid && i > 0 && 'hidden lg:flex'
                )}
                aria-label={`Ir para a tarefa: ${item.title}`}
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-[11px] text-base-content">{item.title}</span>
              </button>
            ))
          ) : (
            <span className="text-[11px] text-base-content/60">Nenhuma tarefa concluída</span>
          )}
        </div>
      </div>

      {(project.phases?.length ?? 0) > 0 && (
        <div
          className={cn(
            'relative z-[1] order-last mt-1 min-w-0 flex-[1_1_100%] rounded-2xl border border-base-300/50 bg-base-200/20 px-3 py-3 sm:px-4',
            isGrid && 'mt-auto'
          )}
        >
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-base-content/45">
            <span>Fases SDLC</span>
            <span className="tabular-nums text-base-content/70">{phaseCompletionPercent}%</span>
          </div>
          <progress
            className="progress progress-primary h-2 w-full rounded-full"
            value={phaseCompletionPercent}
            max={100}
            aria-label={`Conclusão das fases do projeto: ${phaseCompletionPercent}%`}
          />
        </div>
      )}
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
