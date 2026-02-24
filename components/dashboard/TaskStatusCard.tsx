import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { JiraStatusCategory } from '../../utils/jiraStatusCategorizer';

interface TaskStatusCardProps {
  // Métricas antigas (mapeadas) - manter para compatibilidade
  taskStatus?: {
    toDo: number;
    inProgress: number;
    done: number;
    blocked: number;
    distribution: Array<{ status: string; count: number; percentage: number }>;
  };
  // Métricas do Jira (novas)
  jiraStatusMetrics?: {
    byCategory: Record<JiraStatusCategory, number>;
    byStatus: Record<string, number>;
    distribution: Array<{
      status: string;
      count: number;
      percentage: number;
      category: JiraStatusCategory;
    }>;
    categoryDistribution: Array<{
      category: JiraStatusCategory;
      count: number;
      percentage: number;
    }>;
  };
  totalTasks: number;
  // Se true, mostra status do Jira; se false, mostra status mapeados (compatibilidade)
  useJiraStatus?: boolean;
}

const categoryConfig: Record<
  JiraStatusCategory,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  Concluído: { label: 'Concluído', icon: '✅', color: 'text-success', bgColor: 'bg-success/10' },
  Validado: { label: 'Validado', icon: '🔍', color: 'text-info', bgColor: 'bg-info/10' },
  'Em Andamento': {
    label: 'Em Andamento',
    icon: '🔄',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  Pendente: {
    label: 'Pendente',
    icon: '📝',
    color: 'text-base-content/70',
    bgColor: 'bg-base-200',
  },
  Bloqueado: { label: 'Bloqueado', icon: '🚫', color: 'text-error', bgColor: 'bg-error/10' },
  Outros: { label: 'Outros', icon: '❓', color: 'text-base-content/50', bgColor: 'bg-base-200/50' },
};

// Configuração para status mapeados (compatibilidade)
const statusConfig: Record<
  string,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  'To Do': { label: 'A Fazer', icon: '📝', color: 'text-base-content/70', bgColor: 'bg-base-200' },
  'In Progress': {
    label: 'Em Progresso',
    icon: '🔄',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  Done: { label: 'Concluído', icon: '✅', color: 'text-success', bgColor: 'bg-success/10' },
  Blocked: { label: 'Bloqueado', icon: '🚫', color: 'text-error', bgColor: 'bg-error/10' },
};

export const TaskStatusCard: React.FC<TaskStatusCardProps> = ({
  taskStatus,
  jiraStatusMetrics,
  totalTasks,
  useJiraStatus = true,
}) => {
  // Usar métricas do Jira se disponíveis e useJiraStatus for true
  const useJira = useJiraStatus && jiraStatusMetrics;

  // Calcular progresso baseado em status concluído
  const progressPercentage = useJira
    ? totalTasks > 0
      ? Math.round((jiraStatusMetrics!.byCategory['Concluído'] / totalTasks) * 100)
      : 0
    : totalTasks > 0 && taskStatus
      ? Math.round((taskStatus.done / totalTasks) * 100)
      : 0;

  // Distribuição a ser exibida
  const distribution = useJira
    ? jiraStatusMetrics!.categoryDistribution
    : taskStatus?.distribution || [];

  const isCategoryDistributionItem = (
    item:
      | { status: string; count: number; percentage: number }
      | { category: JiraStatusCategory; count: number; percentage: number }
  ): item is { category: JiraStatusCategory; count: number; percentage: number } => {
    return 'category' in item;
  };

  return (
    <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">Status das Tarefas</h3>
        <Badge variant="info" size="sm">
          {totalTasks} total
        </Badge>
      </div>

      {/* Progresso Geral */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-base-content/70">Progresso Geral</span>
          <span className="text-sm font-semibold text-base-content">{progressPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-base-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Distribuição por Status */}
      <div className="space-y-3">
        {distribution.map(item => {
          const isCategory = isCategoryDistributionItem(item);
          const config = isCategory
            ? categoryConfig[item.category] || categoryConfig['Outros']
            : statusConfig[item.status] || statusConfig['To Do'];

          const label = isCategory ? item.category : config.label;

          return (
            <div key={isCategory ? item.category : item.status} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-base-content">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-base-content">{item.count}</span>
                  <span className="text-xs text-base-content/50">({item.percentage}%)</span>
                </div>
              </div>
              <div className="w-full h-2 bg-base-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.bgColor} transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status individuais do Jira (se usar Jira e houver distribuição detalhada) */}
      {useJira && jiraStatusMetrics && jiraStatusMetrics.distribution.length > 0 && (
        <div className="pt-4 border-t border-base-300">
          <h4 className="text-sm font-semibold text-base-content/70 mb-3">
            Status Detalhados do Jira
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {jiraStatusMetrics.distribution.slice(0, 10).map(item => {
              const categoryConfigItem = categoryConfig[item.category] || categoryConfig['Outros'];
              return (
                <div key={item.status} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span>{categoryConfigItem.icon}</span>
                    <span className="text-base-content/80">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base-content">{item.count}</span>
                    <span className="text-base-content/50">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
            {jiraStatusMetrics.distribution.length > 10 && (
              <p className="text-xs text-base-content/50 text-center pt-2">
                +{jiraStatusMetrics.distribution.length - 10} outros status
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumo Rápido */}
      <div
        className={`grid ${useJira ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-4 border-t border-base-300`}
      >
        <div className="text-center p-3 rounded-xl bg-success/10">
          <p className="text-xs text-base-content/60 mb-1">Concluídas</p>
          <p className="text-xl font-bold text-success">
            {useJira ? jiraStatusMetrics!.byCategory['Concluído'] : taskStatus?.done || 0}
          </p>
        </div>
        {useJira && (
          <div className="text-center p-3 rounded-xl bg-info/10">
            <p className="text-xs text-base-content/60 mb-1">Validadas</p>
            <p className="text-xl font-bold text-info">
              {jiraStatusMetrics!.byCategory['Validado']}
            </p>
          </div>
        )}
        <div className="text-center p-3 rounded-xl bg-warning/10">
          <p className="text-xs text-base-content/60 mb-1">Em Progresso</p>
          <p className="text-xl font-bold text-warning">
            {useJira ? jiraStatusMetrics!.byCategory['Em Andamento'] : taskStatus?.inProgress || 0}
          </p>
        </div>
      </div>
    </Card>
  );
};
