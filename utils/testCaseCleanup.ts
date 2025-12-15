import { Project, JiraTask } from '../types';

/**
 * Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa"
 * Apenas tarefas do tipo "Tarefa" podem ter casos de teste e cenários BDD
 * Bug, Epic e História não devem ter casos de teste nem cenários BDD
 */
export function cleanupTestCasesForNonTaskTypes(project: Project): Project {
  const cleanedTasks = project.tasks.map((task: JiraTask) => {
    // Se não for do tipo "Tarefa", remover casos de teste e cenários BDD
    if (task.type !== 'Tarefa') {
      const needsCleanup = (task.testCases && task.testCases.length > 0) || 
                          (task.bddScenarios && task.bddScenarios.length > 0);
      
      if (needsCleanup) {
        return {
          ...task,
          testCases: [],
          bddScenarios: []
        };
      }
    }
    return task;
  });

  return {
    ...project,
    tasks: cleanedTasks
  };
}

/**
 * Limpa casos de teste de múltiplos projetos
 */
export function cleanupTestCasesForProjects(projects: Project[]): Project[] {
  return projects.map(project => cleanupTestCasesForNonTaskTypes(project));
}

