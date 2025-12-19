import React from 'react';
import { StatsSummary } from './StatsSummary';

interface FailedTestsReportHeaderProps {
  totalTests: number;
  selectedTests: number;
  filteredTests: number;
  criticalTests: number;
  environments: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  hasSelectedTests: boolean;
  canSelectAll: boolean;
}

/**
 * Header sticky com estatísticas e ações rápidas
 */
export const FailedTestsReportHeader: React.FC<FailedTestsReportHeaderProps> = ({
  totalTests,
  selectedTests,
  filteredTests,
  criticalTests,
  environments,
  onSelectAll,
  onDeselectAll,
  hasSelectedTests,
  canSelectAll
}) => {
  return (
    <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 px-md py-sm backdrop-blur-sm bg-base-100/95">
      <div className="flex items-center justify-between gap-md flex-wrap">
        <StatsSummary
          totalTests={totalTests}
          selectedTests={selectedTests}
          filteredTests={filteredTests}
          criticalTests={criticalTests}
          environments={environments}
        />
        
        <div className="flex items-center gap-xs">
          {hasSelectedTests && (
            <button
              type="button"
              onClick={onDeselectAll}
              className="btn btn-xs btn-ghost"
              aria-label="Desselecionar todos os testes"
            >
              Desselecionar Todos
            </button>
          )}
          {canSelectAll && (
            <button
              type="button"
              onClick={onSelectAll}
              className="btn btn-xs btn-primary"
              aria-label="Selecionar todos os testes"
            >
              Selecionar Todos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

