import React, { useMemo } from 'react';
import { Project, JiraTask } from '../../types';
import { buildDependencyGraph, getTaskDependencies, getTaskDependents } from '../../utils/dependencyService';

interface DependencyGraphProps {
  project: Project;
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  project,
  selectedTaskId,
  onTaskSelect
}) => {
  const graph = useMemo(() => buildDependencyGraph(project), [project]);

  const getTaskPosition = (taskId: string, level: number, index: number, total: number) => {
    const spacing = 200;
    const y = level * 150 + 50;
    const x = (index + 1) * (1000 / (total + 1));
    return { x, y };
  };

  const renderTaskNode = (task: JiraTask, x: number, y: number, isSelected: boolean) => {
    const dependencies = getTaskDependencies(task.id, project);
    const dependents = getTaskDependents(task.id, project);
    const isBlocked = dependencies.some(dep => dep.status !== 'Done');
    
    return (
      <g key={task.id}>
        {/* Linha de conexão */}
        {dependencies.map(dep => {
          const depTask = project.tasks.find(t => t.id === dep.id);
          if (!depTask) return null;
          
          // Calcular posição da dependência (simplificado)
          const depIndex = project.tasks.findIndex(t => t.id === dep.id);
          const depX = (depIndex % 4) * 200 + 100;
          const depY = Math.floor(depIndex / 4) * 150 + 50;
          
          return (
            <line
              key={`${dep.id}-${task.id}`}
              x1={depX}
              y1={depY + 30}
              x2={x}
              y2={y}
              stroke={depTask.status === 'Done' ? '#10b981' : '#f59e0b'}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        
        {/* Nó da tarefa */}
        <g
          onClick={() => onTaskSelect?.(task.id)}
          className="cursor-pointer"
          transform={`translate(${x}, ${y})`}
        >
          <rect
            width="180"
            height="60"
            rx="8"
            fill={isSelected ? '#00A859' : isBlocked ? '#f59e0b20' : '#1e293b'} // Verde saúde
            stroke={isSelected ? '#00A859' : isBlocked ? '#f59e0b' : '#334155'} // Verde saúde
            strokeWidth={isSelected ? '3' : '2'}
            className="transition-all"
          />
          <text
            x="10"
            y="20"
            fill={isSelected ? '#fff' : '#e2e8f0'}
            fontSize="12"
            fontWeight="bold"
          >
            {task.id}
          </text>
          <text
            x="10"
            y="40"
            fill={isSelected ? '#fff' : '#94a3b8'}
            fontSize="10"
            width="160"
          >
            {task.title.substring(0, 25)}
            {task.title.length > 25 ? '...' : ''}
          </text>
          <circle
            cx="160"
            cy="15"
            r="8"
            fill={task.status === 'Done' ? '#10b981' : task.status === 'In Progress' ? '#3b82f6' : '#64748b'}
          />
          {isBlocked && (
            <text x="10" y="55" fill="#f59e0b" fontSize="9">
              ⏳ Bloqueada
            </text>
          )}
        </g>
      </g>
    );
  };

  // Organizar tarefas em níveis baseado em dependências
  const taskLevels = useMemo(() => {
    const levels: JiraTask[][] = [];
    const processed = new Set<string>();
    
    const getLevel = (taskId: string): number => {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        return 0;
      }
      
      const depLevels = task.dependencies.map(depId => {
        if (processed.has(depId)) {
          const depTask = project.tasks.find(t => t.id === depId);
          return depTask ? getLevel(depId) + 1 : 0;
        }
        return getLevel(depId) + 1;
      });
      
      return Math.max(...depLevels, 0);
    };
    
    project.tasks.forEach(task => {
      const level = getLevel(task.id);
      if (!levels[level]) levels[level] = [];
      levels[level].push(task);
      processed.add(task.id);
    });
    
    return levels;
  }, [project.tasks]);

  return (
    <div className="w-full overflow-auto p-4 bg-surface border border-surface-border rounded-lg">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Gráfico de Dependências</h3>
      <svg width="100%" height={Math.max(400, taskLevels.length * 150 + 100)} className="min-h-[400px]">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
          </marker>
        </defs>
        
        {taskLevels.map((levelTasks, levelIndex) =>
          levelTasks.map((task, taskIndex) => {
            const x = (taskIndex + 1) * (1000 / (levelTasks.length + 1));
            const y = levelIndex * 150 + 50;
            return renderTaskNode(task, x, y, task.id === selectedTaskId);
          })
        )}
      </svg>
      
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-text-secondary">Dependência concluída</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-text-secondary">Dependência pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-text-secondary">Tarefa concluída</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-text-secondary">Em andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
          <span className="text-text-secondary">A fazer</span>
        </div>
      </div>
    </div>
  );
};

