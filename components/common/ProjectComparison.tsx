import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { Badge } from './Badge';
import { ProgressIndicator } from './ProgressIndicator';

interface ProjectComparisonProps {
  projects: Project[];
  onProjectSelect?: (projectId: string) => void;
}

export const ProjectComparison: React.FC<ProjectComparisonProps> = ({
  projects,
  onProjectSelect
}) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const projectsToCompare = useMemo(() => 
    projects.filter(p => selectedProjects.includes(p.id)),
  [projects, selectedProjects]);

  const projectsWithMetrics = useMemo(() => {
    return projectsToCompare.map(project => ({
      project,
      metrics: calculateProjectMetrics(project)
    }));
  }, [projectsToCompare]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Comparar Projetos</h3>
        <button
          onClick={() => setSelectedProjects([])}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Limpar seleção
        </button>
      </div>

      {/* Seleção de projetos */}
      <div className="flex flex-wrap gap-2">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => toggleProject(project.id)}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              selectedProjects.includes(project.id)
                ? 'bg-accent text-white'
                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>

      {/* Tabela de comparação */}
      {projectsWithMetrics.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-3 text-text-primary font-semibold">Métrica</th>
                {projectsWithMetrics.map(({ project }) => (
                  <th
                    key={project.id}
                    className="text-left p-3 text-text-primary font-semibold cursor-pointer hover:text-accent"
                    onClick={() => onProjectSelect?.(project.id)}
                  >
                    {project.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Fase Atual</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3">
                    <Badge variant="info">{metrics.currentPhase}</Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Total de Tarefas</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3 text-text-primary font-semibold">
                    {metrics.totalTasks}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Casos de Teste</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3 text-text-primary font-semibold">
                    {metrics.totalTestCases}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Cobertura de Testes</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3">
                    <ProgressIndicator
                      value={metrics.tasksWithTestCases}
                      max={metrics.totalTasks}
                      showPercentage={true}
                      color="blue"
                      size="sm"
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Taxa de Aprovação</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3">
                    <Badge
                      variant={metrics.testPassRate >= 80 ? 'success' : metrics.testPassRate >= 60 ? 'warning' : 'error'}
                    >
                      {Math.round(metrics.testPassRate)}%
                    </Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Bugs Críticos</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3">
                    <Badge variant={metrics.bugsBySeverity['Crítico'] > 0 ? 'error' : 'success'}>
                      {metrics.bugsBySeverity['Crítico']}
                    </Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-surface-border">
                <td className="p-3 text-text-secondary">Automação</td>
                {projectsWithMetrics.map(({ project, metrics }) => (
                  <td key={project.id} className="p-3">
                    <ProgressIndicator
                      value={metrics.automatedTestCases}
                      max={metrics.totalTestCases}
                      showPercentage={true}
                      color="purple"
                      size="sm"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {projectsToCompare.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          Selecione pelo menos 2 projetos para comparar
        </div>
      )}
    </div>
  );
};
