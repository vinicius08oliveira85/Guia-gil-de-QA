import { JiraTask, Project } from '../types';

export interface TaskEstimation {
  taskId: string;
  estimatedHours: number;
  actualHours: number;
  variance: number; // diferença entre estimado e real
  accuracy: number; // precisão da estimativa (0-100%)
}

export interface SprintMetrics {
  totalEstimated: number;
  totalActual: number;
  velocity: number; // horas por dia
  burndown: Array<{ date: string; remaining: number }>;
  accuracy: number;
}

export const calculateTaskEstimation = (task: JiraTask): TaskEstimation | null => {
  if (!task.estimatedHours) return null;

  const actualHours = task.actualHours || 0;
  const variance = actualHours - task.estimatedHours;
  const accuracy = task.estimatedHours > 0
    ? Math.max(0, Math.min(100, 100 - Math.abs((variance / task.estimatedHours) * 100)))
    : 0;

  return {
    taskId: task.id,
    estimatedHours: task.estimatedHours,
    actualHours,
    variance,
    accuracy
  };
};

export const calculateProjectEstimations = (project: Project): {
  totalEstimated: number;
  totalActual: number;
  averageAccuracy: number;
  tasks: TaskEstimation[];
} => {
  const estimations = project.tasks
    .map(calculateTaskEstimation)
    .filter((e): e is TaskEstimation => e !== null);

  const totalEstimated = estimations.reduce((sum, e) => sum + e.estimatedHours, 0);
  const totalActual = estimations.reduce((sum, e) => sum + e.actualHours, 0);
  const averageAccuracy = estimations.length > 0
    ? estimations.reduce((sum, e) => sum + e.accuracy, 0) / estimations.length
    : 0;

  return {
    totalEstimated,
    totalActual,
    averageAccuracy,
    tasks: estimations
  };
};

export const estimateTaskComplexity = (task: JiraTask): 'Baixa' | 'Média' | 'Alta' | 'Muito Alta' => {
  const testCasesCount = task.testCases?.length || 0;
  const bddScenariosCount = task.bddScenarios?.length || 0;
  const hasDependencies = (task.dependencies?.length || 0) > 0;
  
  let complexity = 0;
  
  // Baseado no tipo
  if (task.type === 'Epic') complexity += 3;
  else if (task.type === 'História') complexity += 2;
  else if (task.type === 'Bug') complexity += 1;
  
  // Baseado em casos de teste
  if (testCasesCount > 10) complexity += 2;
  else if (testCasesCount > 5) complexity += 1;
  
  // Baseado em cenários BDD
  if (bddScenariosCount > 5) complexity += 1;
  
  // Baseado em dependências
  if (hasDependencies) complexity += 1;
  
  if (complexity >= 5) return 'Muito Alta';
  if (complexity >= 3) return 'Alta';
  if (complexity >= 2) return 'Média';
  return 'Baixa';
};

export const suggestEstimation = (task: JiraTask): number => {
  const complexity = estimateTaskComplexity(task);
  const baseHours: Record<typeof complexity, number> = {
    'Baixa': 2,
    'Média': 4,
    'Alta': 8,
    'Muito Alta': 16
  };
  
  let hours = baseHours[complexity];
  
  // Ajustar baseado em histórico (se houver)
  const testCasesCount = task.testCases?.length || 0;
  if (testCasesCount > 0) {
    hours += testCasesCount * 0.5; // 30 min por caso de teste
  }
  
  return Math.round(hours);
};

