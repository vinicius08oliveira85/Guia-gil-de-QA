import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

    // Atividades de testes executados recentemente
    const recentTestCases = tasks
      .flatMap(t => t.testCases || [])
      .filter(tc => tc.status !== 'Not Run')
      .sort((a, b) => {
        // Ordenar por data de execução (se disponível) ou usar ordem inversa
        return 0;
      })
      .slice(0, 5);

    recentTestCases.forEach((tc, index) => {
      const task = tasks.find(t => t.testCases?.some(tc2 => tc2.id === tc.id));
      if (task) {
        activitiesList.push({
          id: `test-${tc.id}`,
          type: tc.status === 'Passed' ? 'pass' : tc.status === 'Failed' ? 'fail' : 'pending',
          title: tc.status === 'Passed' 
            ? 'Caso de Teste Aprovado' 
            : tc.status === 'Failed' 
            ? 'Caso de Teste Falhou' 
            : 'Caso de Teste Executado',
          description: `${task.title}: ${tc.description?.substring(0, 50)}${tc.description && tc.description.length > 50 ? '...' : ''}`,
          time: formatDistanceToNow(new Date(), { addSuffix: true }),
          icon: tc.status === 'Passed' ? CheckCircle2 : tc.status === 'Failed' ? XCircle : Clock,
          iconColor: tc.status === 'Passed' 
            ? 'text-success' 
            : tc.status === 'Failed' 
            ? 'text-error' 
            : 'text-warning',
        });
      }
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
    <div
      className={className}
      role="region"
      aria-label="Atividades recentes"
    >
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6">
        <h3 className="font-bold text-lg text-base-content mb-4">Atividades Recentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const iconBg =
              activity.type === 'pass'
                ? 'bg-success/20 text-success'
                : activity.type === 'fail' || activity.type === 'warning'
                  ? 'bg-error/20 text-error'
                  : 'bg-base-200 text-base-content/60';
            return (
              <div key={activity.id} className="flex gap-3 items-start">
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-base-content">{activity.title}</p>
                  <p className="text-xs text-base-content/70 line-clamp-1 mt-0.5">
                    {activity.description}
                  </p>
                  <span className="text-[10px] text-base-content/60 mt-1 block">
                    {activity.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';

