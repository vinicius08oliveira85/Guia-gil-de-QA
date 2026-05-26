import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  dashboardInsetTileClass,
  dashboardListRowClass,
  dashboardPanelClass,
  dashboardSectionDividerClass,
} from './dashboardNeuUi';

interface DocumentMetricsCardProps {
  documentMetrics: {
    total: number;
    byCategory: Record<string, number>;
    withAnalysis: number;
    recent: number;
    linkedToTasks: number;
  };
}

const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  requisitos: { label: 'Requisitos', icon: '📋', color: 'blue' },
  testes: { label: 'Testes', icon: '🧪', color: 'green' },
  arquitetura: { label: 'Arquitetura', icon: '🏗️', color: 'purple' },
  outros: { label: 'Outros', icon: '📄', color: 'gray' },
};

export const DocumentMetricsCard: React.FC<DocumentMetricsCardProps> = ({ documentMetrics }) => {
  return (
    <Card className={dashboardPanelClass}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">Métricas de Documentos</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={dashboardInsetTileClass}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-semibold text-base-content/70">Total</span>
          </div>
          <p className="text-2xl font-bold text-base-content">{documentMetrics.total}</p>
        </div>

        <div className={dashboardInsetTileClass}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-sm font-semibold text-base-content/70">Com Análise IA</span>
          </div>
          <p className="text-2xl font-bold text-base-content">{documentMetrics.withAnalysis}</p>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-base-content/70">Por Categoria</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(documentMetrics.byCategory).map(([category, count]) => {
            const categoryInfo = categoryLabels[category] || categoryLabels.outros;
            return (
              <div key={category} className={dashboardListRowClass}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryInfo.icon}</span>
                  <span className="text-sm text-base-content">{categoryInfo.label}</span>
                </div>
                <Badge variant="default" size="sm">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cn('grid grid-cols-2 gap-3', dashboardSectionDividerClass)}>
        <div>
          <p className="mb-1 text-xs text-base-content/60">Vinculados a Tarefas</p>
          <p className="text-lg font-semibold text-base-content">{documentMetrics.linkedToTasks}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-base-content/60">Recentes (7 dias)</p>
          <p className="text-lg font-semibold text-base-content">{documentMetrics.recent}</p>
        </div>
      </div>
    </Card>
  );
};
