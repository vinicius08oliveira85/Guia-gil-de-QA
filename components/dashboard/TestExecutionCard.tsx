import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  dashboardInsetTileClass,
  dashboardPanelClass,
  dashboardProgressFillClass,
  dashboardProgressTrackClass,
  dashboardProgressTrackSmClass,
  dashboardSectionDividerClass,
} from './dashboardNeuUi';

interface TestExecutionCardProps {
  testExecution: {
    passed: number;
    failed: number;
    notRun: number;
    blocked: number;
    passRate: number;
    distribution: Array<{ status: string; count: number; percentage: number }>;
  };
  totalTestCases: number;
}

const testStatusConfig: Record<
  string,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  Passed: { label: 'Aprovados', icon: '✅', color: 'text-success', bgColor: 'bg-success/10' },
  Failed: { label: 'Falharam', icon: '❌', color: 'text-error', bgColor: 'bg-error/10' },
  'Not Run': {
    label: 'Não Executados',
    icon: '⏸️',
    color: 'text-base-content/70',
    bgColor: 'bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]',
  },
  Blocked: { label: 'Bloqueados', icon: '🚫', color: 'text-warning', bgColor: 'bg-warning/10' },
};

export const TestExecutionCard: React.FC<TestExecutionCardProps> = ({
  testExecution,
  totalTestCases,
}) => {
  const getPassRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-error';
  };

  const getPassRateBgColor = (rate: number): string => {
    if (rate >= 80) return 'bg-success/10';
    if (rate >= 60) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <Card className={dashboardPanelClass}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">Execução de Testes</h3>
        <Badge variant="info" size="sm">
          {totalTestCases} total
        </Badge>
      </div>

      {/* Taxa de Sucesso */}
      <div
        className={cn(dashboardInsetTileClass, getPassRateBgColor(testExecution.passRate))}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-base-content/70">Taxa de Sucesso</span>
          <span className={`text-2xl font-bold ${getPassRateColor(testExecution.passRate)}`}>
            {testExecution.passRate}%
          </span>
        </div>
        <div className={dashboardProgressTrackClass}>
          <div
            className={cn(dashboardProgressFillClass, 'transition-all duration-300', {
              'bg-success': testExecution.passRate >= 80,
              'bg-warning': testExecution.passRate >= 60 && testExecution.passRate < 80,
              'bg-error': testExecution.passRate < 60,
            })}
            style={{ width: `${testExecution.passRate}%` }}
          />
        </div>
      </div>

      {/* Distribuição por Status */}
      <div className="space-y-3">
        {testExecution.distribution.map(item => {
          const config = testStatusConfig[item.status] || testStatusConfig['Not Run'];
          return (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-base-content">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-base-content">{item.count}</span>
                  <span className="text-xs text-base-content/50">({item.percentage}%)</span>
                </div>
              </div>
              <div className={dashboardProgressTrackSmClass}>
                <div
                  className={cn(dashboardProgressFillClass, config.bgColor, 'transition-all duration-300')}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo Rápido */}
      <div className={cn('grid grid-cols-2 gap-3', dashboardSectionDividerClass)}>
        <div className="text-center p-3 rounded-xl bg-success/10">
          <p className="text-xs text-base-content/60 mb-1">Aprovados</p>
          <p className="text-xl font-bold text-success">{testExecution.passed}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-error/10">
          <p className="text-xs text-base-content/60 mb-1">Falharam</p>
          <p className="text-xl font-bold text-error">{testExecution.failed}</p>
        </div>
      </div>
    </Card>
  );
};
