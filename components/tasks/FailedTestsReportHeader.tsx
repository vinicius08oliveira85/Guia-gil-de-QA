import React from 'react';
import { cn } from '../../utils/cn';
import { taskNeuDividerClass } from './taskActionLayout';
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
  canSelectAll,
}) => {
  return (
    <div className={cn('mica sticky top-0 z-10 !rounded-none border-b px-md py-sm', taskNeuDividerClass)}>
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
              className="btn btn-sm btn-ghost rounded-[var(--radius)] hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
              aria-label="Desselecionar todos os testes"
            >
              Desselecionar Todos
            </button>
          )}
          {canSelectAll && (
            <button
              type="button"
              onClick={onSelectAll}
              className={cn(
                'btn btn-sm rounded-[var(--radius)] border-0',
                'bg-[oklch(var(--p))] text-[oklch(var(--pc))]',
                'hover:bg-[color-mix(in_oklch,oklch(var(--p))_88%,oklch(var(--bc)))]'
              )}
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
