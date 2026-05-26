import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { taskNeuTrackClass, taskPanelBorderClass } from './taskActionLayout';

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
    <div
      className={cn(
        taskPanelBorderClass,
        'flex flex-col justify-center rounded-2xl p-4 transition-all duration-300 hover:shadow-[var(--leve-neu-hover)]'
      )}
    >
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
        <div className={cn(taskNeuTrackClass, 'relative h-1.5 w-full overflow-hidden')}>
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
