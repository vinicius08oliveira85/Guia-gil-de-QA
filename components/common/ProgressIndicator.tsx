import React from 'react';

interface ProgressIndicatorProps {
  value: number;
  max: number;
  label?: string;
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max,
  label,
  color = 'blue',
  showPercentage = true,
  size = 'md'
}) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
  const colorClasses = {
    green: 'bg-success',
    blue: 'bg-primary',
    orange: 'bg-primary',
    red: 'bg-error',
    purple: 'bg-secondary',
  } as const;

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  } as const;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-base-content/70">{label}</span>
          {showPercentage && (
            <span className="text-xs font-semibold text-base-content">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-base-300/60 rounded-full overflow-hidden ${sizeClasses[size]} relative`}>
        <div
          className={`${colorClasses[color]} bg-gradient-to-r ${color === 'blue' ? 'from-primary via-primary/90 to-primary/80' : color === 'green' ? 'from-success via-success/90 to-success/80' : ''} transition-all duration-500 ease-out relative`}
          style={{ width: `${percentage}%`, height: '100%' }}
        >
          {/* Shimmer effect sutil */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-50" />
        </div>
      </div>
      {!label && showPercentage && (
        <div className="text-xs text-base-content/60 mt-1 text-right">{Math.round(percentage)}%</div>
      )}
    </div>
  );
};

