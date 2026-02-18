import React, { useMemo } from 'react';
import { Project } from '../../types';
import { Layout, CheckCircle2, ArrowUpRight, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutRingProps {
  percent: number;
  strokeClass: string;
  label: string;
}

function DonutRing({ percent, strokeClass, label }: DonutRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const dashArray = `${(clamped / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle
            className="stroke-base-300"
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
          <span className="text-[10px] font-bold text-base-content">{Math.round(clamped)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-base-content/70">{label}</span>
    </div>
  );
}

export interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
  onDelete?: () => void;
  onTaskClick?: (taskId: string) => void;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Card horizontal de projeto: ícone, nome, Jira, 3 donuts (Testes/Tarefas/Sucesso), atividades recentes e link Detalhes.
 */
export const ProjectCard = React.memo<ProjectCardProps>(({
  project,
  onSelect,
  onDelete,
  onTaskClick,
  icon: Icon = Layout,
  className,
}) => {
  const metrics = useMemo(() => calculateProjectMetrics(project), [project]);
  const tasks = project.tasks || [];

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

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        'bg-base-100 rounded-3xl p-5 shadow-sm border border-base-300 relative',
        'flex flex-col md:flex-row md:items-center gap-6',
        'transition-all hover:shadow-md cursor-pointer',
        className
      )}
    >
      {onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-base-content/50 hover:text-error hover:bg-error/10 transition-colors z-10"
          aria-label={`Excluir projeto ${project.name}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
      {/* Seção esquerda: ícone + nome + Jira */}
      <div className="flex items-center gap-4 md:w-1/4">
        <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm uppercase tracking-tight leading-tight text-base-content truncate">
            {project.name}
          </h3>
          <p className="text-xs text-base-content/60">{jiraLabel}</p>
        </div>
      </div>

      {/* Seção central: donuts + atividades + link Detalhes */}
      <div className="flex items-center justify-between gap-4 flex-grow border-t md:border-t-0 md:border-l border-base-300 pt-4 md:pt-0 md:pl-6 flex-wrap">
        <div className="flex gap-6 md:gap-8">
          <DonutRing percent={testsPercent} strokeClass="stroke-success" label="Testes" />
          <DonutRing percent={tasksPercent} strokeClass="stroke-secondary" label="Tarefas" />
          <DonutRing percent={successPercent} strokeClass="stroke-primary" label="Sucesso" />
        </div>
        <div className="hidden lg:flex flex-col gap-2 max-w-xs flex-grow ml-8">
          {recentActivity.length > 0 ? (
            recentActivity.map(item => (
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
                className="w-full text-left bg-primary/5 border border-primary/10 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-primary/10 transition-colors"
                aria-label={`Ir para a tarefa: ${item.title}`}
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span className="text-[11px] text-base-content truncate">{item.title}</span>
              </button>
            ))
          ) : (
            <span className="text-[11px] text-base-content/60">Nenhuma tarefa concluída</span>
          )}
        </div>
        <a
          href="#"
          onClick={handleLinkClick}
          className="flex items-center text-primary font-semibold text-sm hover:gap-2 transition-all ml-auto pl-4 flex-shrink-0"
          aria-label={`Ver detalhes de ${project.name}`}
        >
          <span className="hidden sm:inline">Detalhes</span>
          <ArrowUpRight className="w-4 h-4 sm:ml-1" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
