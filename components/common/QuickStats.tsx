import React from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Badge } from './Badge';
import { ProgressIndicator } from './ProgressIndicator';
import {
  neuBrandTextMutedClass,
  neuBrandTextStrongClass,
  neuLegacySurfacePanelClass,
} from './neuUi';
import { cn } from '../../utils/cn';

interface QuickStatsProps {
  project: Project;
  compact?: boolean;
}

const statTileClass = cn(neuLegacySurfacePanelClass, 'text-center');

export const QuickStats: React.FC<QuickStatsProps> = ({ project, compact = false }) => {
  const metrics = useProjectMetrics(project);

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className={statTileClass}>
          <div className={cn('text-2xl font-bold', neuBrandTextStrongClass)}>{metrics.totalTasks}</div>
          <div className={cn('text-xs', neuBrandTextMutedClass)}>Tarefas</div>
        </div>
        <div className={statTileClass}>
          <div className={cn('text-2xl font-bold', neuBrandTextStrongClass)}>
            {metrics.totalTestCases}
          </div>
          <div className={cn('text-xs', neuBrandTextMutedClass)}>Testes</div>
        </div>
        <div className={statTileClass}>
          <div className={cn('text-2xl font-bold', neuBrandTextStrongClass)}>
            {metrics.bugsBySeverity['Crítico']}
          </div>
          <div className={cn('text-xs', neuBrandTextMutedClass)}>Bugs Críticos</div>
        </div>
        <div className={statTileClass}>
          <div className={cn('text-2xl font-bold', neuBrandTextStrongClass)}>
            {Math.round(metrics.testCoverage)}%
          </div>
          <div className={cn('text-xs', neuBrandTextMutedClass)}>Cobertura</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={cn('text-lg font-semibold', neuBrandTextStrongClass)}>Estatísticas Rápidas</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={neuLegacySurfacePanelClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className={neuBrandTextMutedClass}>Progresso Geral</span>
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

        <div className={neuLegacySurfacePanelClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className={neuBrandTextMutedClass}>Taxa de Aprovação</span>
            <Badge
              variant={
                metrics.testPassRate >= 80
                  ? 'success'
                  : metrics.testPassRate >= 60
                    ? 'warning'
                    : 'error'
              }
            >
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

        <div className={neuLegacySurfacePanelClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className={neuBrandTextMutedClass}>Automação</span>
            <Badge variant="info">{Math.round(metrics.automationRatio)}%</Badge>
          </div>
          <ProgressIndicator
            value={metrics.automatedTestCases}
            max={metrics.totalTestCases}
            label="Testes Automatizados"
            color="purple"
            size="sm"
          />
        </div>

        <div className={neuLegacySurfacePanelClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className={neuBrandTextMutedClass}>Bugs</span>
            <Badge variant={metrics.openVsClosedBugs.open > 0 ? 'warning' : 'success'}>
              {metrics.openVsClosedBugs.open} abertos
            </Badge>
          </div>
          <div className={cn('text-sm', neuBrandTextMutedClass)}>
            {metrics.openVsClosedBugs.closed} fechados
          </div>
        </div>
      </div>
    </div>
  );
};
