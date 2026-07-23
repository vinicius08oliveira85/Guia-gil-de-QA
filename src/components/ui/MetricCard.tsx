'use client';

import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  status = 'info',
  onClick,
  className,
}) => {
  const statusColors = {
    success: {
      background: 'bg-[var(--success-50)]',
      border: 'border-[var(--success-200)]',
      text: 'text-[var(--success-700)]',
      accent: 'text-[var(--success-600)]',
      trend: 'text-[var(--success-600)]',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    warning: {
      background: 'bg-[var(--warning-50)]',
      border: 'border-[var(--warning-200)]',
      text: 'text-[var(--warning-700)]',
      accent: 'text-[var(--warning-600)]',
      trend: 'text-[var(--warning-600)]',
      icon: <AlertCircle className="h-4 w-4" />,
    },
    error: {
      background: 'bg-[var(--error-50)]',
      border: 'border-[var(--error-200)]',
      text: 'text-[var(--error-700)]',
      accent: 'text-[var(--error-600)]',
      trend: 'text-[var(--error-600)]',
      icon: <TrendingDown className="h-4 w-4" />,
    },
    info: {
      background: 'bg-[var(--info-50)]',
      border: 'border-[var(--info-200)]',
      text: 'text-[var(--info-700)]',
      accent: 'text-[var(--info-600)]',
      trend: 'text-[var(--info-600)]',
      icon: <Info className="h-4 w-4" />,
    },
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3" />,
    down: <TrendingDown className="h-3 w-3" />,
    neutral: <Minus className="h-3 w-3" />,
  };

  return (
    <article
      className={cn(
        'metric-card group relative',
        'rounded-xl border transition-all duration-300',
        'p-5 space-y-4',
        statusColors[status].background,
        statusColors[status].border,
        'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'text-sm font-semibold truncate',
            statusColors[status].text,
          )}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className={cn(
          'flex-shrink-0 p-2 rounded-lg',
          statusColors[status].background,
          statusColors[status].border,
        )}>\n          <div className={statusColors[status].accent}>\n            {statusColors[status].icon}\n          </div>\n        </div>\n      </div>\n      \n      <div className="space-y-2">\n        <div className={cn(\n          'text-2xl font-bold tabular-nums',\n          statusColors[status].text\n        )}>>\n          {value}\n        </div>\n        \n        {trend && (\n          <div className=\"flex items-center gap-2\">\n            <div className={cn(\n              'flex items-center gap-1 text-xs font-medium',\n              trend.colors || statusColors[status].trend\n            )}>\n              {trendIcons[trend.direction]}\n              <span>{trend.direction === 'up' ? '+' : ''}{Math.abs(trend.value)}%</span>\n            </div>\n            <span className=\"text-xs text-[var(--text-muted)]\">\n              {trend.period}\n            </span>\n          </div>\n        )}\n      </div>\n      \n      <div className=\"metric-card-indicator\">\n        <div\n          className={cn(\n            'h-1 rounded-full transition-all duration-700',\n            statusColors[status].accent,\n            trend ? 'opacity-100' : 'opacity-0'\n          )}\n          style={{ \n            width: trend ? `${Math.min(trend.value, 100)}%` : '0%' \n          }}\n        />\n      </div>\n      \n      <div className=\"metric-card-overlay absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700\" />\n    </article>\n  );\n};\n