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

  const severityConfig: Array<{ severity: BugSeverity; label: string; color: string; bgColor: string }> = [
    { severity: 'Crítico', label: 'Crítico', color: 'text-red-700', bgColor: 'bg-red-100' },
    { severity: 'Alto', label: 'Alto', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    { severity: 'Médio', label: 'Médio', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    { severity: 'Baixo', label: 'Baixo', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ];

  return (
    <Card className="space-y-4" aria-label="Bugs e incidentes">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold text-text-primary flex-shrink-0">Bugs e Incidentes</h3>
        {hasJiraConfig && (
          <button
            onClick={syncBugs}
            disabled={isLoading}
            className="text-sm text-accent hover:text-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-shrink-0 min-w-[140px]"
            aria-label="Sincronizar bugs do Jira"
          >
            {isLoading ? 'Sincronizando...' : '🔄 Sincronizar Jira'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {severityConfig.map(({ severity, label, color, bgColor }) => (
          <div
            key={severity}
            className={`${bgColor} rounded-lg p-3 border-2 border-transparent`}
            aria-label={`${label}: ${bugsBySeverity[severity]} bugs`}
          >
            <p className={`text-xs font-medium ${color} mb-1`}>{label}</p>
            <p className={`text-xl font-bold ${color}`}>
              {bugsBySeverity[severity]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-surface-border">
        <div>
          <p className="text-sm text-text-secondary">Total de bugs abertos</p>
          <p className="text-2xl font-bold text-text-primary">{totalBugs}</p>
        </div>
        {recentlyResolved > 0 && (
          <div className="text-right">
            <p className="text-xs text-text-secondary">Resolvidos (7 dias)</p>
            <p className="text-lg font-semibold text-emerald-600">{recentlyResolved}</p>
          </div>
        )}
      </div>
    </Card>
  );
});

BugsIncidentsCard.displayName = 'BugsIncidentsCard';

