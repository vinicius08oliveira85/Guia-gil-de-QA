import React from 'react';
import { Card } from '../common/Card';
import { BugSeverity } from '../../types';
import { useJiraBugs } from '../../hooks/useJiraBugs';
import { Project } from '../../types';
import { cn } from '../../utils/cn';
import {
  dashboardInsetTileClass,
  dashboardPanelClass,
  dashboardSectionDividerClass,
} from './dashboardNeuUi';

interface BugsIncidentsCardProps {
  project: Project;
  bugsBySeverity: Record<BugSeverity, number>;
  totalBugs: number;
  recentlyResolved: number;
}

/**
 * Card de bugs e incidentes com integração Jira
 */
export const BugsIncidentsCard: React.FC<BugsIncidentsCardProps> = React.memo(
  ({ project, bugsBySeverity, totalBugs, recentlyResolved }) => {
    const { syncBugs, isLoading, error, hasJiraConfig } = useJiraBugs(project);

    const severityConfigDaisy: Array<{ severity: BugSeverity; label: string; badgeClass: string }> =
      [
        { severity: 'Crítico', label: 'Crítico', badgeClass: 'badge-error' },
        { severity: 'Alto', label: 'Alto', badgeClass: 'badge-warning' },
        { severity: 'Médio', label: 'Médio', badgeClass: 'badge-info' },
        { severity: 'Baixo', label: 'Baixo', badgeClass: 'badge-info' },
      ];

    return (
      <Card className={dashboardPanelClass} aria-label="Bugs e incidentes">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="flex-shrink-0 text-lg font-semibold text-base-content">
            Bugs e Incidentes
          </h3>
          {hasJiraConfig && (
            <button
              onClick={syncBugs}
              disabled={isLoading}
              className="btn btn-outline btn-sm flex items-center gap-1.5 rounded-full disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Sincronizar bugs do Jira"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Sincronizar Jira</span>
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error px-3 py-2 text-sm" role="alert">
            Não foi possível carregar os dados do Jira. {error.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {severityConfigDaisy.map(({ severity, label, badgeClass }) => (
            <div
              key={severity}
              className={dashboardInsetTileClass}
              aria-label={`${label}: ${bugsBySeverity[severity]} bugs`}
            >
              <div className={`badge ${badgeClass} badge-sm mb-2`}>{label}</div>
              <p className="text-2xl font-bold text-base-content">{bugsBySeverity[severity]}</p>
            </div>
          ))}
        </div>

        <div className={cn('flex items-center justify-between', dashboardSectionDividerClass)}>
          <div>
            <p className="text-sm text-base-content/70">Total de bugs abertos</p>
            <p className="text-2xl font-bold text-base-content">{totalBugs}</p>
          </div>
          {recentlyResolved > 0 && (
            <div className="text-right">
              <p className="text-xs text-base-content/70">Resolvidos (7 dias)</p>
              <p className="text-lg font-semibold text-success">{recentlyResolved}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

BugsIncidentsCard.displayName = 'BugsIncidentsCard';
