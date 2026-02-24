import React from 'react';
import { TestCase } from '../../types';

interface StatsSummaryProps {
  totalTests: number;
  selectedTests: number;
  filteredTests: number;
  criticalTests: number;
  environments: number;
}

/**
 * Componente que exibe resumo de estatísticas do relatório
 */
export const StatsSummary: React.FC<StatsSummaryProps> = ({
  totalTests,
  selectedTests,
  filteredTests,
  criticalTests,
  environments,
}) => {
  return (
    <div className="flex items-center gap-md flex-wrap text-sm">
      <div className="flex items-center gap-xs">
        <span className="text-base-content/70">Testes:</span>
        <span className="font-semibold text-base-content">
          {selectedTests > 0 ? `${selectedTests} de ${filteredTests}` : filteredTests}
        </span>
        {totalTests !== filteredTests && (
          <span className="text-base-content/50">({totalTests} total)</span>
        )}
      </div>

      {criticalTests > 0 && (
        <div className="flex items-center gap-xs">
          <span className="w-2 h-2 rounded-full bg-error"></span>
          <span className="text-base-content/70">Críticos:</span>
          <span className="font-semibold text-error">{criticalTests}</span>
        </div>
      )}

      {environments > 0 && (
        <div className="flex items-center gap-xs">
          <span className="text-base-content/70">Ambientes:</span>
          <span className="font-semibold text-base-content">{environments}</span>
        </div>
      )}
    </div>
  );
};
