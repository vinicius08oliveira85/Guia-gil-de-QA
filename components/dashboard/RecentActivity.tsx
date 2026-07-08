import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';
import {
  recentActivityDescriptionClass,
  recentActivityEyebrowClass,
  recentActivityHeaderDividerClass,
  recentActivityIconWrapClass,
  recentActivityItemClass,
  recentActivityShellClass,
  recentActivityStatusBadgeClass,
  recentActivityStatusBadgeNeutralClass,
  recentActivityTimeClass,
  recentActivityTitleClass,
  workspacePanelLinkClass,
} from '../common/projectCardUi';

interface RecentActivityProps {
  project: Project;
  className?: string;
  onViewAll?: () => void;
}

type ActivityType = 'pass' | 'fail' | 'pending' | 'report' | 'warning';

function activityStatusBadgeClass(type: ActivityType): string {
  return type === 'pending' || type === 'report'
    ? recentActivityStatusBadgeNeutralClass
    : recentActivityStatusBadgeClass;
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
      type: ActivityType;
      title: string;
      description: string;
      time: string;
      icon: typeof CheckCircle2;
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
      });
    }

    return activitiesList.slice(0, 6);
  }, [tasks, metrics]);

  return (
    <section
      className={cn(recentActivityShellClass, className)}
      role="region"
      aria-label="Atividades recentes"
    >
      <div className={recentActivityHeaderDividerClass}>
        <div>
          <p className={recentActivityEyebrowClass}>Linha do tempo</p>
          <h2 className={recentActivityTitleClass}>Atividades recentes</h2>
        </div>
        {onViewAll ? (
          <button type="button" onClick={onViewAll} className={workspacePanelLinkClass}>
            Ver tudo →
          </button>
        ) : null}
      </div>
      <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4 xl:gap-4 2xl:grid-cols-6">
        {activities.map(activity => {
          const Icon = activity.icon;
          return (
            <li key={activity.id} className={recentActivityItemClass}>
              <div className={recentActivityIconWrapClass(activity.type)}>
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <span className={activityStatusBadgeClass(activity.type)} title={activity.title}>
                  {activity.title}
                </span>
                <p className={recentActivityDescriptionClass}>{activity.description}</p>
                <span className={recentActivityTimeClass}>{activity.time}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

RecentActivity.displayName = 'RecentActivity';
