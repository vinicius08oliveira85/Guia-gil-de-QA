import { Project, JiraTask, JiraTaskType } from '../types';

/**
 * Remove casos de teste de tarefas que não são do tipo "Tarefa"
 * Apenas tarefas do tipo "Tarefa" podem ter casos de teste
 * Bug, Epic e História não devem ter casos de teste
 */
export function cleanupTestCasesForNonTaskTypes(project: Project): Project {
  const cleanedTasks = project.tasks.map((task: JiraTask) => {
    // Se não for do tipo "Tarefa", remover casos de teste
    if (task.type !== 'Tarefa' && task.testCases && task.testCases.length > 0) {
      return {
        ...task,
        testCases: []
      };
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

