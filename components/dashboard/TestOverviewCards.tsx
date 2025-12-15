import React from 'react';
import { Card } from '../common/Card';

interface TestOverviewCardsProps {
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  total: number;
}

/**
 * Cards de visão geral dos testes (Pass, Fail, Blocked, Not Run)
 */
export const TestOverviewCards: React.FC<TestOverviewCardsProps> = React.memo(({
  passed,
  failed,
  blocked,
  notRun,
  total,
}) => {
  const cards = [
    {
      label: 'Aprovados',
      value: passed,
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: '✓',
    },
    {
      label: 'Com Falha',
      value: failed,
      percentage: total > 0 ? Math.round((failed / total) * 100) : 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '✗',
    },
    {
      label: 'Bloqueados',
      value: blocked,
      percentage: total > 0 ? Math.round((blocked / total) * 100) : 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: '⚠',
    },
    {
      label: 'Não Executados',
      value: notRun,
      percentage: total > 0 ? Math.round((notRun / total) * 100) : 0,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: '○',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="Visão geral dos testes">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`${card.bgColor} ${card.borderColor} border-2`}
          aria-label={`${card.label}: ${card.value} testes (${card.percentage}%)`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${card.color} mb-1`}>
                {card.label}
              </p>
              <p className="text-2xl font-bold text-base-content">
                {card.value}
              </p>
              <p className="text-xs text-base-content/70 mt-1">
                {card.percentage}% do total
              </p>
            </div>
            <div className={`text-3xl ${card.color} opacity-50`} aria-hidden="true">
              {card.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

TestOverviewCards.displayName = 'TestOverviewCards';

