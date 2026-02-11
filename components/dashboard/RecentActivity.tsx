import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
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

    return activitiesList.slice(0, 5); // Limitar a 5 atividades
  }, [tasks, metrics]);

  return (
    <Card className={className} hoverable>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-base-content">Atividades Recentes</h3>
          <p className="text-sm text-base-content/70">Últimas atualizações e execuções</p>
        </div>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id} 
                className="flex gap-3 pb-4 border-b border-base-300 last:border-0 last:pb-0"
              >
                <div className={`p-2 h-fit rounded-lg bg-base-200 ${activity.iconColor}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none text-base-content">
                    {activity.title}
                  </p>
                  <p className="text-xs text-base-content/70">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" size="sm" className="text-xs font-normal">
                      Sistema
                    </Badge>
                    <span className="text-xs text-base-content/60">{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
});

RecentActivity.displayName = 'RecentActivity';

