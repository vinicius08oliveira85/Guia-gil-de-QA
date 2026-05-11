import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '../../types';
import {
  Layout,
  Bug,
  ChevronRight,
  ListTodo,
  FlaskConical,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';
import { computePhaseCompletionPercent } from '../../utils/workspaceAnalytics';

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onTaskClick?: (taskId: string) => void;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Card de projeto — listagem minimalista: fundo base-200, hover suave, tipografia heading/body.
 */
export const ProjectCard = React.memo<ProjectCardProps>(
  ({ project, onSelect, onTaskClick, icon: Icon = Layout, className }) => {
    const metrics = useMemo(() => calculateProjectMetrics(project), [project]);
    const tasks = project.tasks || [];
    const openBugsCount = metrics.openVsClosedBugs?.open ?? 0;

    const updatedAtLabel = useMemo(() => {
      const date = project.updatedAt || project.createdAt;
      if (!date) return null;
      try {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
      } catch {
        return null;
      }
    }, [project.updatedAt, project.createdAt]);

    const createdLabel = useMemo(() => {
      if (!project.createdAt) return null;
      try {
        return formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: ptBR });
      } catch {
        return null;
      }
    }, [project.createdAt]);

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

    const description = project.description?.trim() ?? '';

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
      if (target.closest('a') || target.closest('[data-task-link]')) return;
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
          'group relative flex cursor-pointer flex-col overflow-hidden rounded-[1.4rem] border border-base-300 bg-base-200',
          'p-6 shadow-sm shadow-base-content/[0.06] transition-[background-color,border-color,box-shadow] duration-200 ease-out',
          'hover:bg-base-300 hover:shadow-md hover:shadow-base-content/[0.1]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100',
          /** Faixa inferior primary no hover (2px), sem saltar layout */
          'before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:z-[1] before:h-[2px] before:origin-bottom before:scale-y-0 before:bg-primary before:transition-transform before:duration-200 before:ease-out hover:before:scale-y-100',
          'h-full min-h-0 justify-between gap-5',
          className
        )}
      >
        <div className="relative z-[2] flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-base-100/90 text-primary shadow-sm ring-1 ring-base-300/60 transition-colors duration-200 group-hover:ring-primary/25',
                'dark:bg-base-100/40'
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </div>
            <ChevronRight
              className="mt-1 h-5 w-5 shrink-0 text-base-content/25 transition-colors duration-200 group-hover:text-primary"
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-heading text-balance text-xl font-semibold leading-snug tracking-tight text-primary">
              {project.name}
            </h3>
            {description ? (
              <p className="line-clamp-2 font-body text-sm leading-relaxed text-base-content/65">
                {description}
              </p>
            ) : (
              <p className="font-body text-sm italic text-base-content/45">Sem descrição cadastrada.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-base-100/90 px-2.5 py-1 font-body text-xs font-medium tabular-nums text-base-content/75 ring-1 ring-base-300/50 dark:bg-base-100/25">
              <ListTodo className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-base-100/90 px-2.5 py-1 font-body text-xs font-medium tabular-nums text-base-content/75 ring-1 ring-base-300/50 dark:bg-base-100/25">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {metrics.totalTestCases} {metrics.totalTestCases === 1 ? 'teste' : 'testes'}
            </span>
            {updatedAtLabel && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-base-100/90 px-2.5 py-1 font-body text-xs text-base-content/65 ring-1 ring-base-300/50 dark:bg-base-100/25"
                title="Última atualização"
              >
                <CalendarClock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {updatedAtLabel}
              </span>
            )}
            {createdLabel && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-base-100/80 px-2.5 py-1 font-body text-xs text-base-content/55 ring-1 ring-base-300/40 dark:bg-base-100/20"
                title="Criação do projeto"
              >
                Criado {createdLabel}
              </span>
            )}
            {jiraKey && (
              <span className="inline-flex rounded-full bg-base-100/80 px-2.5 py-1 font-body text-xs font-medium text-base-content/70 ring-1 ring-base-300/45 dark:bg-base-100/20">
                Jira · {jiraKey}
              </span>
            )}
            {openBugsCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-error/20 bg-error/10 px-2.5 py-1 font-body text-xs font-medium text-error">
                <Bug className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {openBugsCount} {openBugsCount === 1 ? 'bug' : 'bugs'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-base-300/40 pt-4 font-body text-xs tabular-nums text-base-content/60">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span title="Execução de testes">Exec. testes {testsPercent}%</span>
              <span title="Tarefas concluídas">Tarefas {tasksDonePercent}%</span>
              <span title="Taxa de sucesso nos testes">Sucesso {metrics.testPassRate}%</span>
            </div>
          </div>

          {onTaskClick && latestCompletedTask && (
            <div className="pt-0.5">
              <button
                type="button"
                data-task-link
                onClick={e => {
                  e.stopPropagation();
                  onTaskClick(latestCompletedTask.id);
                }}
                className="btn btn-ghost btn-xs h-auto min-h-0 gap-1.5 rounded-full px-2 py-1.5 font-normal text-base-content/50 hover:bg-base-100/80 hover:text-primary"
                aria-label={`Abrir tarefa concluída: ${latestCompletedTask.title}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="max-w-[16rem] truncate text-left font-body text-xs">
                  {latestCompletedTask.title}
                </span>
              </button>
            </div>
          )}
        </div>

        {(project.phases?.length ?? 0) > 0 && (
          <div className="relative z-[2] mt-1 space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-base-content/55">
              <span>Fases SDLC</span>
              <span className="tabular-nums text-base-content/70">{phaseCompletionPercent}%</span>
            </div>
            <progress
              className="progress progress-primary h-1.5 w-full rounded-full"
              value={phaseCompletionPercent}
              max={100}
              aria-label={`Conclusão das fases: ${phaseCompletionPercent}%`}
            />
          </div>
        )}
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
