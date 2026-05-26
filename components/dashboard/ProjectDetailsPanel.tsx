import React from 'react';
import { MoreVertical } from 'lucide-react';
import type { Phase } from '../../types';
import { ProjectPhasesList } from './ProjectPhasesList';
import { DashboardQualityKPIs, type DashboardKpiMetrics } from './DashboardQualityKPIs';
import { cn } from '../../utils/cn';
import { neuDividerClass } from '../common/neuUi';
import { dashboardPanelClass } from './dashboardNeuUi';

interface ProjectDetailsPanelProps {
  phases: Phase[];
  currentPhaseProgress?: number;
  kpiMetrics: DashboardKpiMetrics;
  className?: string;
}

/**
 * Painel "Detalhes do Projeto": header + área scrollável (Fases) + bloco fixo (KPIs).
 */
export const ProjectDetailsPanel = React.memo<ProjectDetailsPanelProps>(
  ({ phases, currentPhaseProgress, kpiMetrics, className }) => {
    return (
      <div
        className={cn(dashboardPanelClass, 'flex max-h-[760px] flex-col overflow-hidden p-0', className)}
      >
        <div
          className={cn(
            'leve-neu-surface-inset flex shrink-0 items-center justify-between rounded-t-2xl p-6',
            neuDividerClass,
            'border-b'
          )}
        >
          <div>
            <h3 className="font-bold text-lg text-base-content">Detalhes do Projeto</h3>
            <p className="text-xs text-base-content/70">Fases e KPIs operacionais</p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-base-content/50 hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]"
            aria-label="Mais opções"
          >
            <MoreVertical className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
          <ProjectPhasesList phases={phases} currentPhaseProgress={currentPhaseProgress} />
        </div>
        <div className={cn('shrink-0 border-t p-6', neuDividerClass)}>
          <DashboardQualityKPIs metrics={kpiMetrics} />
        </div>
      </div>
    );
  }
);

ProjectDetailsPanel.displayName = 'ProjectDetailsPanel';
