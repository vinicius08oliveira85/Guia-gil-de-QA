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
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-text-secondary">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-text-primary">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-surface-hover rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%`, height: '100%' }}
        />
      </div>
      {!label && showPercentage && (
        <div className="text-xs text-text-secondary mt-1 text-right">{Math.round(percentage)}%</div>
      )}
    </div>
  );
};

