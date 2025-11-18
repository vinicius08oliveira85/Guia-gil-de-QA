import React from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Badge } from './Badge';
import { ProgressIndicator } from './ProgressIndicator';

interface QuickStatsProps {
  project: Project;
  compact?: boolean;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ project, compact = false }) => {
  const metrics = useProjectMetrics(project);

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-surface border border-surface-border rounded-lg text-center">
          <div className="text-2xl font-bold text-text-primary">{metrics.totalTasks}</div>
          <div className="text-xs text-text-secondary">Tarefas</div>
        </div>
        <div className="p-3 bg-surface border border-surface-border rounded-lg text-center">
          <div className="text-2xl font-bold text-text-primary">{metrics.totalTestCases}</div>
          <div className="text-xs text-text-secondary">Testes</div>
        </div>
        <div className="p-3 bg-surface border border-surface-border rounded-lg text-center">
          <div className="text-2xl font-bold text-text-primary">{metrics.bugsBySeverity['Crítico']}</div>
          <div className="text-xs text-text-secondary">Bugs Críticos</div>
        </div>
        <div className="p-3 bg-surface border border-surface-border rounded-lg text-center">
          <div className="text-2xl font-bold text-text-primary">{Math.round(metrics.testCoverage)}%</div>
          <div className="text-xs text-text-secondary">Cobertura</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Estatísticas Rápidas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-surface border border-surface-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">Progresso Geral</span>
            <Badge variant="info">{metrics.currentPhase}</Badge>
          </div>
          <ProgressIndicator
            value={metrics.tasksWithTestCases}
            max={metrics.totalTasks}
            label="Tarefas com Testes"
            color="blue"
            size="sm"
          />
        </div>

        <div className="p-4 bg-surface border border-surface-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">Taxa de Aprovação</span>
            <Badge variant={metrics.testPassRate >= 80 ? 'success' : metrics.testPassRate >= 60 ? 'warning' : 'error'}>
              {Math.round(metrics.testPassRate)}%
            </Badge>
          </div>
          <ProgressIndicator
            value={metrics.passedTestCases}
            max={metrics.executedTestCases || 1}
            label="Testes Aprovados"
            color="green"
            size="sm"
          />
        </div>

        <div className="p-4 bg-surface border border-surface-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">Automação</span>
            <Badge variant="info">
              {Math.round(metrics.automationRatio)}%
            </Badge>
          </div>
          <ProgressIndicator
            value={metrics.automatedTestCases}
            max={metrics.totalTestCases}
            label="Testes Automatizados"
            color="purple"
            size="sm"
          />
        </div>

        <div className="p-4 bg-surface border border-surface-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">Bugs</span>
            <Badge variant={metrics.openVsClosedBugs.open > 0 ? 'warning' : 'success'}>
              {metrics.openVsClosedBugs.open} abertos
            </Badge>
          </div>
          <div className="text-sm text-text-secondary">
            {metrics.openVsClosedBugs.closed} fechados
          </div>
        </div>
      </div>
    </div>
  );
};

