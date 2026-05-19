import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';

interface RecentActivityProps {
  project: Project;
  className?: string;
  onViewAll?: () => void;
}

/**
 * Linha do tempo de atividades recentes do projeto (grade de cards).
 */
export const RecentActivity = React.memo<RecentActivityProps>(({ project, className, onViewAll }) => {
  const metrics = useProjectMetrics(project);
  const tasks = project.tasks || [];

  const activities = useMemo(() => {
    const activitiesList: Array<{
      id: string;
      type: 'pass' | 'fail' | 'pending' | 'report' | 'warning';
      title: string;
      description: string;
      time: string;
      icon: typeof CheckCircle2;
      iconBg: string;
      iconColor: string;
    }> = [];

    const testCasesWithTask = tasks.flatMap(t =>
      (t.testCases || []).filter(tc => tc.status !== 'Not Run').map(tc => ({ tc, task: t }))
    );
    const taskDate = (t: { completedAt?: string; createdAt?: string }) => {
      const d = t.completedAt || t.createdAt;
      return d ? new Date(d).getTime() : 0;
    };
    const recentTestCases = testCasesWithTask
      .sort((a, b) => taskDate(b.task) - taskDate(a.task))
      .slice(0, 6);

    recentTestCases.forEach(({ tc, task }) => {
      const dateForTime = task.completedAt || task.createdAt;
      const timeStr = dateForTime
        ? formatDistanceToNow(new Date(dateForTime), { addSuffix: true, locale: ptBR })
        : 'Recentemente';
      const isPass = tc.status === 'Passed';
      const isFail = tc.status === 'Failed';
      activitiesList.push({
        id: `test-${tc.id}`,
        type: isPass ? 'pass' : isFail ? 'fail' : 'pending',
        title: isPass
          ? 'Caso de Teste Aprovado'
          : isFail
            ? 'Caso de Teste Falhou'
            : 'Caso de Teste Executado',
        description: `${task.title}: ${tc.action?.substring(0, 50)}${tc.action && tc.action.length > 50 ? '...' : ''}`,
        time: timeStr,
        icon: isPass ? CheckCircle2 : isFail ? XCircle : Clock,
        iconBg: isPass
          ? 'bg-success/15 ring-success/25'
          : isFail
            ? 'bg-error/15 ring-error/25'
            : 'bg-warning/15 ring-warning/25',
        iconColor: isPass ? 'text-success' : isFail ? 'text-error' : 'text-warning',
      });
    });

    if (metrics.bugsBySeverity['Crítico'] > 0) {
      activitiesList.unshift({
        id: 'critical-bug',
        type: 'warning',
        title: 'Bug Crítico Detectado',
        description: `${metrics.bugsBySeverity['Crítico']} bug(s) crítico(s) aberto(s)`,
        time: formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }),
        icon: AlertTriangle,
        iconBg: 'bg-error/15 ring-error/25',
        iconColor: 'text-error',
      });
    }

    if (metrics.totalTasks > 0 && metrics.taskStatus.done === metrics.totalTasks) {
      activitiesList.unshift({
        id: 'sprint-complete',
        type: 'pass',
        title: 'Sprint Concluída',
        description: `Todas as ${metrics.totalTasks} tarefas foram concluídas`,
        time: formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }),
        icon: CheckCircle2,
        iconBg: 'bg-success/15 ring-success/25',
        iconColor: 'text-success',
      });
    }

    if (activitiesList.length === 0) {
      activitiesList.push({
        id: 'no-activity',
        type: 'report',
        title: 'Nenhuma atividade recente',
        description: 'Execute testes ou atualize tarefas para ver atividades aqui',
        time: 'Agora',
        icon: FileText,
        iconBg: 'bg-base-200 ring-base-300/50',
        iconColor: 'text-base-content/60',
      });
    }

    return activitiesList.slice(0, 6);
  }, [tasks, metrics]);

  return (
    <section className={cn('rounded-[var(--rounded-box)] border border-base-300/65 bg-base-100 p-4 soft-shadow sm:p-5', className)} role="region" aria-label="Atividades recentes">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-base-300/60 pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/50">
            Linha do tempo
          </p>
          <h2 className="font-heading mt-0.5 text-lg font-bold text-base-content sm:text-xl">
            Atividades recentes
          </h2>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-[var(--brand-text-strong)] underline-offset-2 hover:underline"
          >
            Ver tudo
          </button>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {activities.map(activity => {
          const Icon = activity.icon;
          return (
            <li
              key={activity.id}
              className="flex gap-3 rounded-lg border border-base-300/60 bg-base-100/80 p-3 transition-shadow hover:shadow-sm"
            >
              <div
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1',
                  activity.iconBg
                )}
              >
                <Icon className={cn('h-4 w-4', activity.iconColor)} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-base-content">{activity.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-base-content/70">
                  {activity.description}
                </p>
                <span className="mt-1 block text-[10px] text-base-content/50">{activity.time}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

RecentActivity.displayName = 'RecentActivity';
