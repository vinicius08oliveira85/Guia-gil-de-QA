import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import { JiraStatusCategory } from '../../utils/jiraStatusCategorizer';
import {
  dashboardPanelClass,
  dashboardProgressFillClass,
  dashboardProgressTrackClass,
  dashboardProgressTrackSmClass,
  dashboardSectionDividerClass,
} from './dashboardNeuUi';

interface TaskStatusCardProps {
  taskStatus?: {
    toDo: number;
    inProgress: number;
    done: number;
    blocked: number;
    distribution: Array<{ status: string; count: number; percentage: number }>;
  };
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
    bgColor: 'bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]',
  },
  Bloqueado: { label: 'Bloqueado', icon: '🚫', color: 'text-error', bgColor: 'bg-error/10' },
  Outros: {
    label: 'Outros',
    icon: '❓',
    color: 'text-base-content/50',
    bgColor: 'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  },
};

const statusConfig: Record<
  string,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  'To Do': {
    label: 'A Fazer',
    icon: '📝',
    color: 'text-base-content/70',
    bgColor: 'bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]',
  },
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
  const useJira = useJiraStatus && jiraStatusMetrics;

  const progressPercentage = useJira
    ? totalTasks > 0
      ? Math.round((jiraStatusMetrics!.byCategory['Concluído'] / totalTasks) * 100)
      : 0
    : totalTasks > 0 && taskStatus
      ? Math.round((taskStatus.done / totalTasks) * 100)
      : 0;

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
    <Card className={dashboardPanelClass}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">Status das Tarefas</h3>
        <Badge variant="info" size="sm">
          {totalTasks} total
        </Badge>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-base-content/70">Progresso Geral</span>
          <span className="text-sm font-semibold text-base-content">{progressPercentage}%</span>
        </div>
        <div className={cn(dashboardProgressTrackClass, 'h-3')}>
          <div
            className={cn(dashboardProgressFillClass, 'bg-primary transition-all duration-300')}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

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
              <div className={dashboardProgressTrackSmClass}>
                <div
                  className={cn(dashboardProgressFillClass, config.bgColor, 'transition-all duration-300')}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {useJira && jiraStatusMetrics && jiraStatusMetrics.distribution.length > 0 && (
        <div className={dashboardSectionDividerClass}>
          <h4 className="mb-3 text-sm font-semibold text-base-content/70">
            Status Detalhados do Jira
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {jiraStatusMetrics.distribution.slice(0, 10).map(item => {
              const categoryConfigItem = categoryConfig[item.category] || categoryConfig['Outros'];
              return (
                <div key={item.status} className="flex items-center justify-between py-1 text-xs">
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
              <p className="pt-2 text-center text-xs text-base-content/50">
                +{jiraStatusMetrics.distribution.length - 10} outros status
              </p>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid gap-3',
          dashboardSectionDividerClass,
          useJira ? 'grid-cols-3' : 'grid-cols-2'
        )}
      >
        <div className="rounded-xl bg-success/10 p-3 text-center">
          <p className="mb-1 text-xs text-base-content/60">Concluídas</p>
          <p className="text-xl font-bold text-success">
            {useJira ? jiraStatusMetrics!.byCategory['Concluído'] : taskStatus?.done || 0}
          </p>
        </div>
        {useJira && (
          <div className="rounded-xl bg-info/10 p-3 text-center">
            <p className="mb-1 text-xs text-base-content/60">Validadas</p>
            <p className="text-xl font-bold text-info">{jiraStatusMetrics!.byCategory['Validado']}</p>
          </div>
        )}
        <div className="rounded-xl bg-warning/10 p-3 text-center">
          <p className="mb-1 text-xs text-base-content/60">Em Progresso</p>
          <p className="text-xl font-bold text-warning">
            {useJira ? jiraStatusMetrics!.byCategory['Em Andamento'] : taskStatus?.inProgress || 0}
          </p>
        </div>
      </div>
    </Card>
  );
};
