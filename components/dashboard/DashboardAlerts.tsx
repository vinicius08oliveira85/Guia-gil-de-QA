import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { BugSeverity } from '../../types';

interface DashboardAlertsProps {
  hasCriticalFailures: boolean;
  bugsBySeverity: Record<BugSeverity, number>;
  passRate: number;
  totalBugs: number;
}

/**
 * Componente de alertas visuais do dashboard
 */
export const DashboardAlerts: React.FC<DashboardAlertsProps> = React.memo(({
  hasCriticalFailures,
  bugsBySeverity,
  passRate,
  totalBugs,
}) => {
  const alerts = useMemo(() => {
    const alertList: Array<{ type: 'error' | 'warning' | 'success'; message: string; icon: string }> = [];

    // Verificar testes críticos falhando
    if (hasCriticalFailures) {
      alertList.push({
        type: 'error',
        message: 'Há testes críticos falhando',
        icon: '⚠️',
      });
    }

    // Verificar bugs críticos
    if (bugsBySeverity['Crítico'] > 0) {
      alertList.push({
        type: 'error',
        message: `${bugsBySeverity['Crítico']} bug(s) crítico(s) em aberto`,
        icon: '🔴',
      });
    }

    // Verificar bugs de alta severidade
    if (bugsBySeverity['Alto'] > 5) {
      alertList.push({
        type: 'warning',
        message: `${bugsBySeverity['Alto']} bugs de alta severidade em aberto`,
        icon: '🟠',
      });
    }

    // Verificar taxa de sucesso baixa
    if (passRate < 60) {
      alertList.push({
        type: 'warning',
        message: `Taxa de sucesso baixa: ${passRate}%`,
        icon: '📉',
      });
    }

    // Status estável
    if (alertList.length === 0) {
      alertList.push({
        type: 'success',
        message: 'Tudo estável',
        icon: '🟢',
      });
    }

    return alertList;
  }, [hasCriticalFailures, bugsBySeverity, passRate]);

  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {alerts.map((alert, index) => {
        const bgColor =
          alert.type === 'error'
            ? 'bg-red-50 border-red-200'
            : alert.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-emerald-50 border-emerald-200';

        const textColor =
          alert.type === 'error'
            ? 'text-red-800'
            : alert.type === 'warning'
            ? 'text-yellow-800'
            : 'text-emerald-800';

        return (
          <Card
            key={index}
            className={`${bgColor} border-2 flex items-center gap-3 p-3`}
            aria-label={alert.message}
          >
            <span className="text-2xl" aria-hidden="true">
              {alert.icon}
            </span>
            <p className={`font-medium ${textColor} flex-1`}>{alert.message}</p>
          </Card>
        );
      })}
    </div>
  );
});

DashboardAlerts.displayName = 'DashboardAlerts';

