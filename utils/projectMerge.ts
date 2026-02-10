import { Project } from '../types';
import { logger } from './logger';

/**
 * Compara dois timestamps e retorna qual é mais recente
 * @returns 1 se timestamp1 é mais recente, -1 se timestamp2 é mais recente, 0 se iguais
 */
const compareTimestamps = (timestamp1?: string, timestamp2?: string): number => {
  if (!timestamp1 && !timestamp2) return 0;
  if (!timestamp1) return -1; // timestamp2 é mais recente
  if (!timestamp2) return 1; // timestamp1 é mais recente
  
  const date1 = new Date(timestamp1).getTime();
  const date2 = new Date(timestamp2).getTime();
  
  if (date1 > date2) return 1;
  if (date1 < date2) return -1;
  return 0;
};

/**
 * Faz merge inteligente de dois projetos, preservando dados mais recentes
 * Compara timestamps e faz merge campo a campo quando necessário
 */
export const mergeProjects = (localProject: Project, remoteProject: Project): Project => {
  // Comparar timestamps para determinar qual projeto é mais recente
  const localUpdated = localProject.updatedAt || localProject.createdAt;
  const remoteUpdated = remoteProject.updatedAt || remoteProject.createdAt;
  
  const timestampComparison = compareTimestamps(localUpdated, remoteUpdated);
  
  // Se ambos têm o mesmo timestamp ou muito próximos, fazer merge campo a campo
  if (Math.abs(timestampComparison) <= 1) {
    logger.debug(
      `Fazendo merge campo a campo dos projetos ${localProject.id} (timestamps similares)`,
      'projectMerge'
    );
    
    // Merge inteligente: preservar campos mais recentes ou mais completos
    const merged: Project = {
      ...remoteProject, // Base no projeto remoto
      
      // Preservar nome e descrição do mais recente
      name: timestampComparison >= 0 ? localProject.name : remoteProject.name,
      description: timestampComparison >= 0 ? localProject.description : remoteProject.description,
      
      // Preservar documentos mais completos
      documents: localProject.documents.length >= remoteProject.documents.length
        ? localProject.documents
        : remoteProject.documents,
      
      // Merge de tarefas: preservar tarefas mais recentes
      tasks: mergeTasks(localProject.tasks, remoteProject.tasks),
      
      // Preservar fases mais atualizadas
      phases: timestampComparison >= 0 ? localProject.phases : remoteProject.phases,
      
      // Preservar análises mais recentes
      shiftLeftAnalysis: timestampComparison >= 0
        ? localProject.shiftLeftAnalysis || remoteProject.shiftLeftAnalysis
        : remoteProject.shiftLeftAnalysis || localProject.shiftLeftAnalysis,
      
      testPyramidAnalysis: timestampComparison >= 0
        ? localProject.testPyramidAnalysis || remoteProject.testPyramidAnalysis
        : remoteProject.testPyramidAnalysis || localProject.testPyramidAnalysis,
      
      generalIAAnalysis: timestampComparison >= 0
        ? localProject.generalIAAnalysis || remoteProject.generalIAAnalysis
        : remoteProject.generalIAAnalysis || localProject.generalIAAnalysis,
      
      dashboardOverviewAnalysis: timestampComparison >= 0
        ? localProject.dashboardOverviewAnalysis || remoteProject.dashboardOverviewAnalysis
        : remoteProject.dashboardOverviewAnalysis || localProject.dashboardOverviewAnalysis,
      
      dashboardInsightsAnalysis: timestampComparison >= 0
        ? localProject.dashboardInsightsAnalysis || remoteProject.dashboardInsightsAnalysis
        : remoteProject.dashboardInsightsAnalysis || localProject.dashboardInsightsAnalysis,
      
      sdlcPhaseAnalysis: timestampComparison >= 0
        ? localProject.sdlcPhaseAnalysis || remoteProject.sdlcPhaseAnalysis
        : remoteProject.sdlcPhaseAnalysis || localProject.sdlcPhaseAnalysis,
      
      // Preservar specificationDocument do mais completo
      specificationDocument: localProject.specificationDocument && remoteProject.specificationDocument
        ? (localProject.specificationDocument.length >= remoteProject.specificationDocument.length
            ? localProject.specificationDocument
            : remoteProject.specificationDocument)
        : localProject.specificationDocument || remoteProject.specificationDocument,
      
      // Preservar histórico de métricas mais completo
      metricsHistory: localProject.metricsHistory && remoteProject.metricsHistory
        ? (localProject.metricsHistory.length >= remoteProject.metricsHistory.length
            ? localProject.metricsHistory
            : remoteProject.metricsHistory)
        : localProject.metricsHistory || remoteProject.metricsHistory,
      
      // Preservar tags e settings do mais recente
      tags: timestampComparison >= 0 ? localProject.tags : remoteProject.tags,
      settings: timestampComparison >= 0 ? localProject.settings : remoteProject.settings,
      
      // Atualizar timestamp para o mais recente
      updatedAt: timestampComparison >= 0 ? localUpdated : remoteUpdated,
      createdAt: localProject.createdAt || remoteProject.createdAt,
    };
    
    return merged;
  }
  
  // Se um projeto é claramente mais recente, usar ele completamente
  if (timestampComparison > 0) {
    logger.debug(
      `Projeto local é mais recente para ${localProject.id}, preservando versão local`,
      'projectMerge'
    );
    return localProject;
  } else {
    logger.debug(
      `Projeto remoto é mais recente para ${remoteProject.id}, usando versão remota`,
      'projectMerge'
    );
    return remoteProject;
  }
};

/**
 * Faz merge de arrays de tarefas, preservando tarefas mais recentes
 */
const mergeTasks = (
  localTasks: Project['tasks'],
  remoteTasks: Project['tasks']
): Project['tasks'] => {
  const tasksMap = new Map<string, Project['tasks'][0]>();
  
  // Primeiro adicionar tarefas locais
  localTasks.forEach(task => {
    tasksMap.set(task.id, task);
  });
  
  // Depois adicionar/atualizar com tarefas remotas
  remoteTasks.forEach(remoteTask => {
    const localTask = tasksMap.get(remoteTask.id);
    
    if (!localTask) {
      // Tarefa nova no remoto, adicionar
      tasksMap.set(remoteTask.id, remoteTask);
    } else {
      // Tarefa existe em ambos, fazer merge
      const localUpdated = localTask.completedAt || localTask.createdAt;
      const remoteUpdated = remoteTask.completedAt || remoteTask.createdAt;
      
      const taskComparison = compareTimestamps(localUpdated, remoteUpdated);
      
      if (taskComparison > 0) {
        // Tarefa local é mais recente
        tasksMap.set(remoteTask.id, localTask);
      } else if (taskComparison < 0) {
        // Tarefa remota é mais recente
        tasksMap.set(remoteTask.id, remoteTask);
      } else {
        // Timestamps similares, fazer merge campo a campo
        tasksMap.set(remoteTask.id, {
          ...remoteTask,
          // Preservar casos de teste mais completos
          testCases: localTask.testCases.length >= remoteTask.testCases.length
            ? localTask.testCases
            : remoteTask.testCases,
          // Preservar estratégias mais completas
          testStrategy: localTask.testStrategy && remoteTask.testStrategy
            ? (localTask.testStrategy.length >= remoteTask.testStrategy.length
                ? localTask.testStrategy
                : remoteTask.testStrategy)
            : localTask.testStrategy || remoteTask.testStrategy,
          // Preservar análises mais recentes
          iaAnalysis: taskComparison >= 0
            ? localTask.iaAnalysis || remoteTask.iaAnalysis
            : remoteTask.iaAnalysis || localTask.iaAnalysis,
        });
      }
    }
  });
  
  return Array.from(tasksMap.values());
};

/**
 * Faz merge de múltiplos projetos, preservando dados mais recentes
 */
export const mergeProjectsList = (
  localProjects: Project[],
  remoteProjects: Project[]
): Project[] => {
  const projectsMap = new Map<string, Project>();
  
  // Primeiro adicionar projetos locais
  localProjects.forEach(project => {
    projectsMap.set(project.id, project);
  });
  
  // Depois fazer merge com projetos remotos
  remoteProjects.forEach(remoteProject => {
    const localProject = projectsMap.get(remoteProject.id);
    
    if (!localProject) {
      // Projeto novo no remoto, adicionar
      projectsMap.set(remoteProject.id, remoteProject);
    } else {
      // Projeto existe em ambos, fazer merge inteligente
      const merged = mergeProjects(localProject, remoteProject);
      projectsMap.set(remoteProject.id, merged);
    }
  });
  
  return Array.from(projectsMap.values());
};

