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
      <div className="flex min-w-0 flex-col items-center gap-1 text-center">
        <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-base-200/50 p-0.5 shadow-inner ring-1 ring-base-content/[0.06] transition-[box-shadow,transform] duration-200 group-hover:ring-base-content/10 motion-reduce:transition-none">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
            <circle
              className="stroke-base-300/85"
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
        <span className="text-[11px] font-semibold leading-tight tracking-wide text-base-content/78">{label}</span>
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
        subtle ? '-right-3 -top-3 h-24 w-24 sm:h-28 sm:w-28' : '-right-6 -top-6 h-44 w-44 sm:h-52 sm:w-52'
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
      className="pointer-events-none absolute inset-0 z-0 text-base-content/[0.08] opacity-[0.35] transition-opacity duration-300 group-hover:opacity-100"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] bg-[length:4px_4px]" />
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
        'group relative isolate cursor-pointer overflow-hidden rounded-2xl border border-base-300/75',
        'bg-gradient-to-br from-base-100/95 via-base-100/90 to-base-200/40 backdrop-blur-[2px]',
        'p-3 shadow-sm shadow-base-content/[0.04] ring-1 ring-base-content/[0.04] sm:p-3.5',
        isGrid
          ? 'flex h-full min-h-0 flex-col gap-2.5 motion-reduce:transition-none sm:gap-3'
          : 'flex flex-wrap flex-col gap-6 md:flex-row md:items-center',
        'transition-[box-shadow,border-color,transform] duration-300 ease-out',
        'hover:-translate-y-px hover:border-primary/20 hover:shadow-md hover:shadow-base-content/[0.07] hover:ring-primary/10 motion-reduce:hover:translate-y-0',
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
          'relative z-[1] flex gap-2.5 sm:gap-3',
          isGrid ? 'w-full items-start' : 'items-center md:w-1/4'
        )}
      >
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/18 to-primary/6 text-primary shadow-sm ring-1 ring-primary/18 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100',
            isGrid ? 'h-10 w-10' : 'h-12 w-12 rounded-2xl'
          )}
        >
          <Icon className={cn(isGrid ? 'h-5 w-5' : 'h-6 w-6')} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'line-clamp-2 text-balance text-sm font-bold uppercase leading-snug tracking-tight text-base-content sm:tracking-wide',
              isGrid && 'sm:line-clamp-2'
            )}
          >
            {project.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-base-content/72">{jiraLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {openBugsCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-error/25 bg-error/12 px-1.5 py-0.5 text-xs font-semibold text-error"
                title={`${openBugsCount} bug(s) aberto(s)`}
              >
                <Bug className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {openBugsCount} {openBugsCount === 1 ? 'bug aberto' : 'bugs abertos'}
              </span>
            )}
            {updatedAtLabel && (
              <span className="text-xs text-base-content/70" title="Última atualização">
                Atualizado {updatedAtLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seção central: donuts + atividades recentes */}
      <div
        className={cn(
          'relative z-[1] border-t border-base-300/65',
          isGrid
            ? 'flex w-full flex-1 flex-col gap-2 pt-2 sm:gap-2.5 sm:pt-2.5'
            : 'flex flex-grow flex-wrap items-center justify-between gap-4 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0'
        )}
      >
        <div
          className={cn(
            isGrid ? 'grid w-full grid-cols-3 gap-0.5 sm:gap-1.5' : 'flex gap-6 md:gap-8'
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
            'flex flex-col',
            isGrid ? 'w-full gap-1.5' : 'ml-8 hidden max-w-xs flex-1 gap-2 md:flex'
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
                  'flex w-full cursor-pointer items-start gap-2 rounded-lg border border-primary/15 bg-primary/[0.07] px-2.5 py-1.5 text-left shadow-sm ring-0 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-primary/30 hover:bg-primary/12 hover:shadow-sm motion-reduce:transition-none',
                  isGrid && 'hover:-translate-y-px motion-reduce:hover:translate-y-0',
                  !isGrid && i > 0 && 'hidden lg:flex'
                )}
                aria-label={`Ir para a tarefa: ${item.title}`}
              >
                <CheckCircle2
                  className={cn(
                    'mt-0.5 flex-shrink-0 text-primary',
                    isGrid ? 'h-3.5 w-3.5' : 'h-4 w-4'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'min-w-0 flex-1 text-left leading-snug text-base-content',
                    isGrid ? 'line-clamp-2 text-xs' : 'truncate text-[11px]'
                  )}
                >
                  {item.title}
                </span>
              </button>
            ))
          ) : (
            <span className="text-xs text-base-content/70">Nenhuma tarefa concluída</span>
          )}
        </div>
      </div>

      {(project.phases?.length ?? 0) > 0 && (
        <div
          className={cn(
            'relative z-[1] order-last mt-0.5 min-w-0 flex-[1_1_100%] rounded-xl border border-base-300/55 bg-base-200/30 px-2.5 py-2 backdrop-blur-sm sm:px-3',
            isGrid && 'mt-auto'
          )}
        >
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-base-content/72">
            <span>Fases SDLC</span>
            <span className="tabular-nums text-base-content">{phaseCompletionPercent}%</span>
          </div>
          <progress
            className="progress progress-primary h-1.5 w-full rounded-full sm:h-2"
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
