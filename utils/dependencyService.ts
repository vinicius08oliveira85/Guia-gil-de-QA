import { JiraTask, Project } from '../types';

export interface DependencyGraph {
  taskId: string;
  dependencies: string[];
  dependents: string[];
}

export const buildDependencyGraph = (project: Project): Map<string, DependencyGraph> => {
  const graph = new Map<string, DependencyGraph>();

  // Inicializar todos os nós
  project.tasks.forEach(task => {
    graph.set(task.id, {
      taskId: task.id,
      dependencies: task.dependencies || [],
      dependents: []
    });
  });

  // Construir lista de dependentes
  project.tasks.forEach(task => {
    if (task.dependencies) {
      task.dependencies.forEach(depId => {
        const depNode = graph.get(depId);
        if (depNode && !depNode.dependents.includes(task.id)) {
          depNode.dependents.push(task.id);
        }
      });
    }
  });

  return graph;
};

export const getTaskDependencies = (taskId: string, project: Project): JiraTask[] => {
  const task = project.tasks.find(t => t.id === taskId);
  if (!task || !task.dependencies) return [];

  return project.tasks.filter(t => task.dependencies!.includes(t.id));
};

export const getTaskDependents = (taskId: string, project: Project): JiraTask[] => {
  return project.tasks.filter(t => t.dependencies?.includes(taskId));
};

export const canAddDependency = (taskId: string, dependencyId: string, project: Project): { canAdd: boolean; reason?: string } => {
  if (taskId === dependencyId) {
    return { canAdd: false, reason: 'Uma tarefa não pode depender de si mesma' };
  }

  // Verificar dependência circular
  const graph = buildDependencyGraph(project);
  const visited = new Set<string>();
  
  const hasCircularDependency = (currentId: string, targetId: string): boolean => {
    if (currentId === targetId) return true;
    if (visited.has(currentId)) return false;
    
    visited.add(currentId);
    const node = graph.get(currentId);
    if (!node) return false;

    return node.dependencies.some(depId => hasCircularDependency(depId, targetId));
  };

  // Se adicionarmos esta dependência, ela criaria um ciclo?
  const wouldCreateCycle = hasCircularDependency(dependencyId, taskId);
  
  if (wouldCreateCycle) {
    return { canAdd: false, reason: 'Esta dependência criaria um ciclo circular' };
  }

  return { canAdd: true };
};

export const addDependency = (taskId: string, dependencyId: string, project: Project): Project => {
  const validation = canAddDependency(taskId, dependencyId, project);
  if (!validation.canAdd) {
    throw new Error(validation.reason || 'Não é possível adicionar esta dependência');
  }

  const updatedTasks = project.tasks.map(task => {
    if (task.id === taskId) {
      const dependencies = task.dependencies || [];
      if (!dependencies.includes(dependencyId)) {
        return { ...task, dependencies: [...dependencies, dependencyId] };
      }
    }
    return task;
  });

  return { ...project, tasks: updatedTasks };
};

export const removeDependency = (taskId: string, dependencyId: string, project: Project): Project => {
  const updatedTasks = project.tasks.map(task => {
    if (task.id === taskId) {
      const dependencies = (task.dependencies || []).filter(id => id !== dependencyId);
      return { ...task, dependencies };
    }
    return task;
  });

  return { ...project, tasks: updatedTasks };
};

export const getBlockedTasks = (project: Project): JiraTask[] => {
  return project.tasks.filter(task => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    
    const dependencyTasks = getTaskDependencies(task.id, project);
    return dependencyTasks.some(dep => dep.status !== 'Done');
  });
};

export const getReadyTasks = (project: Project): JiraTask[] => {
  return project.tasks.filter(task => {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    
    const dependencyTasks = getTaskDependencies(task.id, project);
    return dependencyTasks.every(dep => dep.status === 'Done');
  });
};

