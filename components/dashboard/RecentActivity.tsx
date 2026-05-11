import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '../common/Card';

/**
 * Props do componente RecentActivity
 */
interface RecentActivityProps {
  /** Projeto para calcular atividades recentes */
  project: Project;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente que exibe atividades recentes do projeto
 *
 * @example
 * ```tsx
 * <RecentActivity project={project} />
 * ```
 */
export const RecentActivity = React.memo<RecentActivityProps>(({ project, className }) => {
  const metrics = useProjectMetrics(project);
  const tasks = project.tasks || [];

  // Gerar atividades recentes baseadas nos dados do projeto
  const activities = useMemo(() => {
    const activitiesList: Array<{
      id: string;
      type: 'pass' | 'fail' | 'pending' | 'report' | 'warning';
      title: string;
      description: string;
      time: string;
      icon: typeof CheckCircle2;
      iconColor: string;
    }> = [];

    // Atividades de testes executados recentemente (ordenar por data da tarefa: completedAt ou createdAt)
    const testCasesWithTask = tasks.flatMap(t =>
      (t.testCases || []).filter(tc => tc.status !== 'Not Run').map(tc => ({ tc, task: t }))
    );
    const taskDate = (t: { completedAt?: string; createdAt?: string }) => {
      const d = t.completedAt || t.createdAt;
      return d ? new Date(d).getTime() : 0;
    };
    const recentTestCases = testCasesWithTask
      .sort((a, b) => taskDate(b.task) - taskDate(a.task))
      .slice(0, 5);

    recentTestCases.forEach(({ tc, task }) => {
      const dateForTime = task.completedAt || task.createdAt;
      const timeStr = dateForTime
        ? formatDistanceToNow(new Date(dateForTime), { addSuffix: true, locale: ptBR })
        : 'Recentemente';
      activitiesList.push({
        id: `test-${tc.id}`,
        type: tc.status === 'Passed' ? 'pass' : tc.status === 'Failed' ? 'fail' : 'pending',
        title:
          tc.status === 'Passed'
            ? 'Caso de Teste Aprovado'
            : tc.status === 'Failed'
              ? 'Caso de Teste Falhou'
              : 'Caso de Teste Executado',
        description: `${task.title}: ${tc.action?.substring(0, 50)}${tc.action && tc.action.length > 50 ? '...' : ''}`,
        time: timeStr,
        icon: tc.status === 'Passed' ? CheckCircle2 : tc.status === 'Failed' ? XCircle : Clock,
        iconColor:
          tc.status === 'Passed'
            ? 'text-success'
            : tc.status === 'Failed'
              ? 'text-error'
              : 'text-warning',
      });
    });

    // Adicionar alertas se houver bugs críticos
    if (metrics.bugsBySeverity['Crítico'] > 0) {
      activitiesList.unshift({
        id: 'critical-bug',
        type: 'warning',
        title: 'Bug Crítico Detectado',
        description: `${metrics.bugsBySeverity['Crítico']} bug(s) crítico(s) aberto(s)`,
        time: formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }),
        icon: AlertTriangle,
        iconColor: 'text-error',
      });
    }

    // Adicionar conclusão de sprint se todas as tarefas estiverem concluídas
    if (metrics.totalTasks > 0 && metrics.taskStatus.done === metrics.totalTasks) {
      activitiesList.unshift({
        id: 'sprint-complete',
        type: 'pass',
        title: 'Sprint Concluída',
        description: `Todas as ${metrics.totalTasks} tarefas foram concluídas`,
        time: formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }),
        icon: CheckCircle2,
        iconColor: 'text-success',
      });
    }

    // Se não houver atividades, adicionar uma mensagem padrão
    if (activitiesList.length === 0) {
      activitiesList.push({
        id: 'no-activity',
        type: 'report',
        title: 'Nenhuma atividade recente',
        description: 'Execute testes ou atualize tarefas para ver atividades aqui',
        time: 'Agora',
        icon: FileText,
        iconColor: 'text-base-content/60',
      });
    }

    return activitiesList.slice(0, 6); // Até 6 para preencher grid 3 colunas
  }, [tasks, metrics]);

  return (
    <div className={className} role="region" aria-label="Atividades recentes">
      <Card hoverable={false} variant="default" className="overflow-hidden p-4 sm:p-6">
        <div className="mb-5 border-b border-base-300/80 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/55">
            Linha do tempo
          </p>
          <h2 className="font-heading mt-1 text-lg font-bold tracking-tight text-base-content sm:text-xl">
            Atividades recentes
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {activities.map(activity => {
            const Icon = activity.icon;
            const iconBg =
              activity.type === 'pass'
                ? 'bg-success/20 text-success'
                : activity.type === 'fail' || activity.type === 'warning'
                  ? 'bg-error/20 text-error'
                  : 'bg-base-200 text-base-content/60';
            return (
              <li key={activity.id} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-base-content">{activity.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-base-content/75">
                    {activity.description}
                  </p>
                  <span className="mt-1 block text-[10px] text-base-content/55">{activity.time}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';
