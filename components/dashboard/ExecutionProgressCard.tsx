import React from 'react';
import { Card } from '../common/Card';
import { ProgressIndicator } from '../common/ProgressIndicator';

interface ExecutionProgressCardProps {
  total: number;
  executed: number;
  passed: number;
  failed: number;
  blocked: number;
}

/**
 * Card de progresso das execuções de testes
 */
export const ExecutionProgressCard: React.FC<ExecutionProgressCardProps> = React.memo(
  ({ total, executed, passed, failed, blocked }) => {
    const executionPercentage = total > 0 ? Math.round((executed / total) * 100) : 0;
    const remaining = total - executed;

    return (
      <Card
        className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200"
        aria-label="Progresso das execuções"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content">Status das Execuções</h3>
          <span className="text-sm text-base-content/70">
            {executed} de {total} executados
          </span>
        </div>

        <div className="space-y-2">
          <ProgressIndicator
            value={executionPercentage}
            max={100}
            label={`${executionPercentage}% executados`}
            showPercentage={true}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-base-300">
          <div>
            <p className="text-xs text-base-content/70 mb-1">Aprovados</p>
            <p className="text-lg font-bold text-success">{passed}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/70 mb-1">Com Falha</p>
            <p className="text-lg font-bold text-error">{failed}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/70 mb-1">Bloqueados</p>
            <p className="text-lg font-bold text-warning">{blocked}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/70 mb-1">Pendentes</p>
            <p className="text-lg font-bold text-base-content/60">{remaining}</p>
          </div>
        </div>
      </Card>
    );
  }
);

ExecutionProgressCard.displayName = 'ExecutionProgressCard';
