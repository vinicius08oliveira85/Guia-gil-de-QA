import React from 'react';
import { RefreshCcw } from 'lucide-react';

interface ReopeningRateCardProps {
  rate: number;
}

export const ReopeningRateCard: React.FC<ReopeningRateCardProps> = ({ rate }) => {
  // Determina a cor baseada na taxa (Crítico se > 10%)
  const isCritical = rate > 10;
  const colorClass = isCritical ? 'text-error' : 'text-warning';
  const bgClass = isCritical ? 'bg-error' : 'bg-warning';
  const bgIconClass = isCritical ? 'bg-error/10' : 'bg-warning/10';

  return (
    <div className="flex flex-col justify-center p-4 bg-base-100 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${bgIconClass}`}>
            <RefreshCcw className={`h-4 w-4 ${colorClass}`} />
          </div>
          <span className="text-sm font-medium text-base-content">Taxa de Reabertura</span>
        </div>
        <span
          className={`text-sm font-semibold ${isCritical ? 'text-error' : 'text-base-content'}`}
        >
          {rate}%
        </span>
      </div>
      <div className="w-full">
        <div className="w-full bg-base-300/60 rounded-full overflow-hidden h-1.5 relative">
          <div
            className={`${bgClass} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(rate, 100)}%`, height: '100%' }}
          ></div>
        </div>
      </div>
      {isCritical && (
        <p className="text-xs text-error mt-2 font-medium animate-pulse flex items-center gap-1">
          ⚠️ Alta instabilidade
        </p>
      )}
    </div>
  );
};
