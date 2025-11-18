import React, { useMemo } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Badge } from './Badge';

interface ProjectHealthScoreProps {
  project: Project;
  showDetails?: boolean;
}

export const ProjectHealthScore: React.FC<ProjectHealthScoreProps> = ({ project, showDetails = true }) => {
  const metrics = useProjectMetrics(project);

  const healthScore = useMemo(() => {
    let score = 100;
    
    // Penalizar bugs críticos
    score -= metrics.bugsBySeverity['Crítico'] * 10;
    
    // Penalizar baixa cobertura
    score -= (100 - metrics.testCoverage) * 0.3;
    
    // Penalizar baixa taxa de aprovação
    if (metrics.testPassRate < 80) {
      score -= (80 - metrics.testPassRate) * 0.5;
    }
    
    // Penalizar bugs abertos
    if (metrics.openVsClosedBugs.open > 5) {
      score -= (metrics.openVsClosedBugs.open - 5) * 2;
    }
    
    // Bonificar automação
    score += metrics.automationRatio * 0.2;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [metrics]);

  const getHealthColor = (score: number): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthLabel = (score: number): string => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Atenção';
    return 'Crítico';
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="p-4 bg-surface border border-surface-border rounded-lg">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Score de Saúde do Projeto</h3>
      
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg className="transform -rotate-90" width="120" height="120">
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-surface-hover"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`transition-all duration-500 ${
                healthScore >= 80 ? 'text-green-500' :
                healthScore >= 60 ? 'text-orange-500' : 'text-red-500'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                healthScore >= 80 ? 'text-green-500' :
                healthScore >= 60 ? 'text-orange-500' : 'text-red-500'
              }`}>
                {healthScore}
              </div>
              <div className="text-xs text-text-secondary">pontos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <Badge variant={getHealthColor(healthScore)} size="lg">
          {getHealthLabel(healthScore)}
        </Badge>
      </div>

      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Bugs Críticos</span>
            <span className={`font-semibold ${
              metrics.bugsBySeverity['Crítico'] > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {metrics.bugsBySeverity['Crítico']}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Cobertura de Testes</span>
            <span className={`font-semibold ${
              metrics.testCoverage >= 80 ? 'text-green-400' : 
              metrics.testCoverage >= 60 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(metrics.testCoverage)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Taxa de Aprovação</span>
            <span className={`font-semibold ${
              metrics.testPassRate >= 80 ? 'text-green-400' : 
              metrics.testPassRate >= 60 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(metrics.testPassRate)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Automação</span>
            <span className="font-semibold text-text-primary">
              {Math.round(metrics.automationRatio)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

