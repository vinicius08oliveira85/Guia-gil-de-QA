import React, { useState } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
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

  const projectsToCompare = projects.filter(p => selectedProjects.includes(p.id));

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
      {projectsToCompare.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-3 text-text-primary font-semibold">Métrica</th>
                {projectsToCompare.map(project => (
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
              {projectsToCompare.map((project, index) => {
                const metrics = useProjectMetrics(project);
                
                return index === 0 ? (
                  <>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Fase Atual</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3">
                            <Badge variant="info">{m.currentPhase}</Badge>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Total de Tarefas</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3 text-text-primary font-semibold">
                            {m.totalTasks}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Casos de Teste</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3 text-text-primary font-semibold">
                            {m.totalTestCases}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Cobertura de Testes</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3">
                            <ProgressIndicator
                              value={m.tasksWithTestCases}
                              max={m.totalTasks}
                              showPercentage={true}
                              color="blue"
                              size="sm"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Taxa de Aprovação</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3">
                            <Badge
                              variant={m.testPassRate >= 80 ? 'success' : m.testPassRate >= 60 ? 'warning' : 'error'}
                            >
                              {Math.round(m.testPassRate)}%
                            </Badge>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Bugs Críticos</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3">
                            <Badge variant={m.bugsBySeverity['Crítico'] > 0 ? 'error' : 'success'}>
                              {m.bugsBySeverity['Crítico']}
                            </Badge>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-surface-border">
                      <td className="p-3 text-text-secondary">Automação</td>
                      {projectsToCompare.map(p => {
                        const m = useProjectMetrics(p);
                        return (
                          <td key={p.id} className="p-3">
                            <ProgressIndicator
                              value={m.automatedTestCases}
                              max={m.totalTestCases}
                              showPercentage={true}
                              color="purple"
                              size="sm"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </>
                ) : null;
              })}
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

