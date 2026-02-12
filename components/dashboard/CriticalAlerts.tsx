import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  time: string;
}

interface CriticalAlertsProps {
  alerts: DashboardAlert[];
  /** Se true, mostra apenas alertas critical e warning; se false, mostra todos (incl. success) */
  onlyCriticalAndWarning?: boolean;
  className?: string;
}

const alertStyles: Record<DashboardAlert['type'], { border: string; title: string; desc: string }> = {
  critical: { border: 'border-l-4 border-l-error bg-error/10', title: 'text-error', desc: 'text-base-content/80' },
  warning: { border: 'border-l-4 border-l-warning bg-warning/10', title: 'text-warning', desc: 'text-base-content/80' },
  info: { border: 'border-l-4 border-l-info bg-info/10', title: 'text-info', desc: 'text-base-content/80' },
  success: { border: 'border-l-4 border-l-success bg-success/10', title: 'text-success', desc: 'text-base-content/80' },
};

/**
 * Card "Alertas Críticos": título com ícone e grid de alertas com borda esquerda colorida.
 */
export const CriticalAlerts = React.memo<CriticalAlertsProps>(({
  alerts,
  onlyCriticalAndWarning = true,
  className,
}) => {
  const items = onlyCriticalAndWarning
    ? alerts.filter(a => a.type === 'critical' || a.type === 'warning')
    : alerts;

  const hasCritical = items.some(a => a.type === 'critical');
  const titleColor = hasCritical ? 'text-error' : 'text-warning';

  return (
    <div
      className={cn(
        'bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className={cn('w-5 h-5', titleColor)} aria-hidden="true" />
        <h3 className={cn('font-bold text-lg text-base-content', titleColor)}>
          Alertas Críticos
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-base-content/70">Nenhum alerta crítico no momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((alert) => {
            const style = alertStyles[alert.type];
            return (
              <div
                key={alert.id}
                className={cn('p-4 rounded-r-xl', style.border)}
              >
                <p className={cn('text-sm font-bold', style.title)}>
                  {alert.title}
                </p>
                <p className={cn('text-xs mt-1', style.desc)}>
                  {alert.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

CriticalAlerts.displayName = 'CriticalAlerts';
