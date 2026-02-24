import React from 'react';
import { Project } from '../../types';
import { QualityTrafficLight } from './QualityTrafficLight';
import { QualityTrendSection } from './QualityTrendSection';
import { EfficiencySection } from './EfficiencySection';
import { EmptyState } from '../common/EmptyState';

interface QualityDashboardProps {
  project: Project;
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({ project }) => {
  // Verificar se há dados suficientes
  const hasTasks = project.tasks && project.tasks.length > 0;

  if (!hasTasks) {
    return (
      <EmptyState
        icon="📊"
        title="Nenhuma métrica disponível"
        description="Adicione tarefas e bugs ao projeto para ver métricas de qualidade e análises."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Seção 1: O Semáforo (Topo) */}
      <QualityTrafficLight project={project} />

      {/* Seção 2: Tendência de Qualidade */}
      <QualityTrendSection project={project} />

      {/* Seção 3: Eficiência & Processo */}
      <EfficiencySection project={project} />
    </div>
  );
};
