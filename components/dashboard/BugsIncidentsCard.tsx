import React from 'react';
import { Card } from '../common/Card';
import { BugSeverity } from '../../types';
import { useJiraBugs } from '../../hooks/useJiraBugs';
import { Project } from '../../types';

interface BugsIncidentsCardProps {
  project: Project;
  bugsBySeverity: Record<BugSeverity, number>;
  totalBugs: number;
  recentlyResolved: number;
}

/**
 * Card de bugs e incidentes com integração Jira
 */
export const BugsIncidentsCard: React.FC<BugsIncidentsCardProps> = React.memo(({
  project,
  bugsBySeverity,
  totalBugs,
  recentlyResolved,
}) => {
  const { syncBugs, isLoading, hasJiraConfig } = useJiraBugs(project);

  const severityConfigDaisy: Array<{ severity: BugSeverity; label: string; badgeClass: string }> = [
    { severity: 'Crítico', label: 'Crítico', badgeClass: 'badge-error' },
    { severity: 'Alto', label: 'Alto', badgeClass: 'badge-warning' },
    { severity: 'Médio', label: 'Médio', badgeClass: 'badge-info' },
    { severity: 'Baixo', label: 'Baixo', badgeClass: 'badge-info' },
  ];

  return (
    <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200" aria-label="Bugs e incidentes">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold text-base-content flex-shrink-0">Bugs e Incidentes</h3>
        {hasJiraConfig && (
          <button
            onClick={syncBugs}
            disabled={isLoading}
            className="btn btn-outline btn-sm rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            aria-label="Sincronizar bugs do Jira"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sincronizar Jira</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {severityConfigDaisy.map(({ severity, label, badgeClass }) => (
          <div
            key={severity}
            className="p-4 bg-base-200 rounded-xl border border-base-300 hover:border-primary/30 transition-all"
            aria-label={`${label}: ${bugsBySeverity[severity]} bugs`}
          >
            <div className={`badge ${badgeClass} badge-sm mb-2`}>{label}</div>
            <p className="text-2xl font-bold text-base-content">
              {bugsBySeverity[severity]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-base-300">
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
});

BugsIncidentsCard.displayName = 'BugsIncidentsCard';

