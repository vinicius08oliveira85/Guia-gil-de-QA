'use client';

import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'healthy' | 'warning' | 'critical' | 'info' | 'neutral';
  trends?: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  footerContent?: React.ReactNode;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  status = 'info',
  trends = [],
  footerContent,
  className,
}) => {
  const statusConfig = {
    healthy: {
      border: 'border-[var(--success-200)]',
      bg: 'bg-[var(--success-50)]',
      text: 'text-[var(--success-700)]',
      icon: <div className="h-2 w-2 rounded-full bg-[var(--success-500)]" />
    },
    warning: {
      border: 'border-[var(--warning-200)]',
      bg: 'bg-[var(--warning-50)]',
      text: 'text-[var(--warning-700)]',
      icon: <div className="h-2 w-2 rounded-full bg-[var(--warning-500)]" />
    },
    critical: {
      border: 'border-[var(--error-200)]',
      bg: 'bg-[var(--error-50)]',
      text: 'text-[var(--error-700)]',
      icon: <AlertCircle className="h-4 w-4 text-[var(--error-600)]" />
    },
    info: {
      border: 'border-[var(--info-200)]',
      bg: 'bg-[var(--info-50)]',
      text: 'text-[var(--info-700)]',
      icon: <Info className="h-4 w-4 text-[var(--info-600)]" />
    },
    neutral: {
      border: 'border-[var(--gray-200)]',
      bg: 'bg-[var(--gray-50)]',
      text: 'text-[var(--gray-700)]',
      icon: <div className="h-2 w-2 rounded-full bg-[var(--gray-500)]" />
    }
  };

  return (
    <div className={cn(
      'kpi-card relative rounded-xl border transition-all duration-300',
      'p-6 space-y-4',
      statusConfig[status].border,
      statusConfig[status].bg,
      'hover:shadow-lg hover:scale-[1.01]',
      className
    )}>\n      <div className=\"flex items-start justify-between\">\n        <div className=\"flex-1 min-w-0\">\n          <h3 className={cn(\n            'text-base font-semibold truncate',\n            statusConfig[status].text\n          )}>\n            {title}\n          </h3>\n          {unit && (\n            <div className=\"text-xs text-[var(--text-muted)] mt-1\">\n              {unit}\n            </div>\n          )}\n        </div>\n        \n        <div className=\"flex items-center gap-2\">\n          {statusConfig[status].icon}\n        </div>\n      </div>\n      \n      <div className=\"flex items-baseline gap-2\">\n        <div className={cn(\n          'text-3xl font-bold tabular-nums',\n          statusConfig[status].text\n        )}>\n          {value}\n        </div>\n        {unit && (\n          <div className=\"text-sm text-[var(--text-muted)] font-normal\">\n            {unit}\n          </div>\n        )}\n      </div>\n      \n      {trends.length > 0 && (\n        <div className=\"space-y-2 pt-2 border-t border-[var(--border)]\">\n          <div className=\"text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider\">\n            Componentes Principais\n          </div>\n          <div className=\"space-y-1.5\">\n            {trends.map((trend, index) => (\n              <div key={index} className=\"flex items-center justify-between\">\n                <div className=\"flex items-center gap-2\">\n                  <div \n                    className=\"h-1.5 w-1.5 rounded-sm\"\n                    style={{ backgroundColor: trend.color || 'var(--primary-500)' }}\n                  />\n                  <span className=\"text-xs text-[var(--text-secondary)]\">\n                    {trend.label}\n                  </span>\n                </div>\n                <span \n                  className=\"text-xs font-medium\"\n                  style={{ color: trend.color || 'var(--text-primary)' }}\n                >\n                  {trend.value}\n                </span>\n              </div>\n            ))}\n          </div>\n        </div>\n      )}\n      \n      {footerContent && (\n        <div className=\"pt-4 border-t border-[var(--border)]\">\n          {footerContent}\n        </div>\n      )}\n    </div>\n  );\n};\n