import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { BugSeverity } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DashboardAlertsProps {
  hasCriticalFailures: boolean;
  bugsBySeverity: Record<BugSeverity, number>;
  passRate: number;
}

/**
 * Componente de alertas visuais do dashboard melhorado
 */
export const DashboardAlerts: React.FC<DashboardAlertsProps> = React.memo(
  ({ hasCriticalFailures, bugsBySeverity, passRate }) => {
    const alerts = useMemo(() => {
      const alertList: Array<{
        type: 'error' | 'warning' | 'success';
        message: string;
        icon: React.ReactNode;
        bgColor: string;
        borderColor: string;
        textColor: string;
      }> = [];

      // Verificar testes críticos falhando
      if (hasCriticalFailures) {
        alertList.push({
          type: 'error',
          message: 'Há testes críticos falhando',
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-error/10',
          borderColor: 'border-error/30',
          textColor: 'text-error',
        });
      }

      // Verificar bugs críticos
      if (bugsBySeverity['Crítico'] > 0) {
        alertList.push({
          type: 'error',
          message: `${bugsBySeverity['Crítico']} bug(s) crítico(s) em aberto`,
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-error/10',
          borderColor: 'border-error/30',
          textColor: 'text-error',
        });
      }

      // Verificar bugs de alta severidade
      if (bugsBySeverity['Alto'] > 5) {
        alertList.push({
          type: 'warning',
          message: `${bugsBySeverity['Alto']} bugs de alta severidade em aberto`,
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          textColor: 'text-warning',
        });
      }

      // Verificar taxa de sucesso baixa
      if (passRate < 60) {
        alertList.push({
          type: 'warning',
          message: `Taxa de sucesso baixa: ${passRate}%`,
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          textColor: 'text-warning',
        });
      }

      // Status estável
      if (alertList.length === 0) {
        alertList.push({
          type: 'success',
          message: 'Tudo estável',
          icon: <CheckCircle2 className="w-5 h-5" />,
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          textColor: 'text-success',
        });
      }

      return alertList;
    }, [hasCriticalFailures, bugsBySeverity, passRate]);

    return (
      <div className="space-y-2" role="alert" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, index) => (
            <motion.div
              key={`${alert.type}-${index}`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
              }}
            >
              <Card
                className={cn(
                  'leve-neu-surface flex items-center gap-3 border-0 p-4 transition-all duration-200 hover:scale-[1.01]',
                  alert.bgColor,
                  alert.borderColor
                )}
                aria-label={alert.message}
              >
                <motion.div
                  className={cn('flex shrink-0 h-8 w-8 items-center justify-center rounded-md', alert.textColor, {
                    'bg-error/15 ring-1 ring-error/30': alert.type === 'error',
                    'bg-warning/15 ring-1 ring-warning/30': alert.type === 'warning',
                    'bg-success/15 ring-1 ring-success/30': alert.type === 'success',
                  })}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 100 }}
                >
                  {alert.icon}
                </motion.div>
                <p className={cn('font-medium flex-1', alert.textColor)}>{alert.message}</p>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

DashboardAlerts.displayName = 'DashboardAlerts';
