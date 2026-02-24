import React from 'react';
import { MoreVertical } from 'lucide-react';
import type { Phase } from '../../types';
import { ProjectPhasesList } from './ProjectPhasesList';
import { DashboardQualityKPIs, type DashboardKpiMetrics } from './DashboardQualityKPIs';
import { cn } from '../../utils/cn';

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
        className={cn(
          'bg-base-100 rounded-2xl shadow-sm border border-base-300 flex flex-col max-h-[760px]',
          className
        )}
      >
        <div className="p-6 border-b border-base-300 flex justify-between items-center bg-base-200/30 rounded-t-2xl shrink-0">
          <div>
            <h3 className="font-bold text-lg text-base-content">Detalhes do Projeto</h3>
            <p className="text-xs text-base-content/70">Fases e KPIs operacionais</p>
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-base-300 text-base-content/50"
            aria-label="Mais opções"
          >
            <MoreVertical className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
          <ProjectPhasesList phases={phases} currentPhaseProgress={currentPhaseProgress} />
        </div>
        <div className="shrink-0 border-t border-base-300 p-6">
          <DashboardQualityKPIs metrics={kpiMetrics} />
        </div>
      </div>
    );
  }
);

ProjectDetailsPanel.displayName = 'ProjectDetailsPanel';
