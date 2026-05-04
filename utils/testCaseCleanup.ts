import { Project, JiraTask } from '../types';
import { createBackup } from '../services/backupService';
import { logger } from './logger';

interface CleanupResult {
  project: Project;
  removedItems: {
    taskId: string;
    taskTitle: string;
    taskType: string;
    testCasesCount: number;
    bddScenariosCount: number;
  }[];
  backupId?: string;
}

/**
 * Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa" ou "Bug"
 * Apenas tarefas do tipo "Tarefa" e "Bug" podem ter casos de teste e cenários BDD
 * Epic e História não devem ter casos de teste nem cenários BDD
 *
 * @param project Projeto a ser limpo
 * @param createBackupBeforeCleanup Se true, cria backup antes de limpar (padrão: true)
 * @returns Resultado da limpeza com informações sobre o que foi removido
 */
export async function cleanupTestCasesForNonTaskTypes(
  project: Project,
  createBackupBeforeCleanup: boolean = true
): Promise<CleanupResult> {
  const removedItems: CleanupResult['removedItems'] = [];
  let backupId: string | undefined;

  // Criar backup antes de limpar se solicitado
  if (createBackupBeforeCleanup) {
    try {
      backupId = await createBackup(
        project,
        'CLEANUP',
        'Backup automático antes de limpeza de casos de teste'
      );
      logger.debug(`Backup criado antes de limpeza: ${backupId}`, 'testCaseCleanup');
    } catch (error) {
      logger.warn('Erro ao criar backup antes de limpeza (continuando)', 'testCaseCleanup', error);
      // Continuar com limpeza mesmo se backup falhar
    }
  }

  // Validar projeto antes de limpar
  if (!project || !project.tasks) {
    logger.warn('Projeto inválido para limpeza', 'testCaseCleanup');
    return {
      project,
      removedItems: [],
      backupId,
    };
  }

  const cleanedTasks = project.tasks.map((task: JiraTask) => {
    // Se não for do tipo "Tarefa" ou "Bug", remover casos de teste e cenários BDD
    if (task.type !== 'Tarefa' && task.type !== 'Bug') {
      const testCasesCount = task.testCases?.length || 0;
      const bddScenariosCount = task.bddScenarios?.length || 0;
      const needsCleanup = testCasesCount > 0 || bddScenariosCount > 0;

      if (needsCleanup) {
        // Registrar o que será removido
        removedItems.push({
          taskId: task.id,
          taskTitle: task.title,
          taskType: task.type,
          testCasesCount,
          bddScenariosCount,
        });

        logger.info(
          `Removendo ${testCasesCount} casos de teste e ${bddScenariosCount} cenários BDD da tarefa "${task.title}" (tipo: ${task.type})`,
          'testCaseCleanup'
        );

        return {
          ...task,
          testCases: [],
          bddScenarios: [],
        };
      }
    }
    return task;
  });

  const cleanedProject: Project = {
    ...project,
    tasks: cleanedTasks,
  };

  // Log resumo da limpeza
  if (removedItems.length > 0) {
    const totalTestCases = removedItems.reduce((sum, item) => sum + item.testCasesCount, 0);
    const totalBddScenarios = removedItems.reduce((sum, item) => sum + item.bddScenariosCount, 0);

    logger.info(
      `Limpeza concluída: ${removedItems.length} tarefas limpas, ${totalTestCases} casos de teste e ${totalBddScenarios} cenários BDD removidos${backupId ? ` (backup: ${backupId})` : ''}`,
      'testCaseCleanup'
    );
  } else {
    logger.debug('Nenhum item removido na limpeza', 'testCaseCleanup');
  }

  return {
    project: cleanedProject,
    removedItems,
    backupId,
  };
}

/**
 * Versão síncrona para compatibilidade (sem backup)
 * Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa" ou "Bug"
 * Apenas tarefas do tipo "Tarefa" e "Bug" podem ter casos de teste e cenários BDD
 * Epic e História não devem ter casos de teste nem cenários BDD
 *
 * @deprecated Use a versão assíncrona com backup
 */
export function cleanupTestCasesForNonTaskTypesSync(project: Project): Project {
  const cleanedTasks = project.tasks.map((task: JiraTask) => {
    if (task.type !== 'Tarefa' && task.type !== 'Bug') {
      const needsCleanup =
        (task.testCases && task.testCases.length > 0) ||
        (task.bddScenarios && task.bddScenarios.length > 0);

      if (needsCleanup) {
        return {
          ...task,
          testCases: [],
          bddScenarios: [],
        };
      }
    }
    return task;
  });

  return {
    ...project,
    tasks: cleanedTasks,
  };
}

/**
 * Limpa casos de teste de múltiplos projetos
 * Versão assíncrona com backup automático
 */
export async function cleanupTestCasesForProjectsAsync(
  projects: Project[],
  createBackupBeforeCleanup: boolean = true
): Promise<Project[]> {
  const results = await Promise.all(
    projects.map(project => cleanupTestCasesForNonTaskTypes(project, createBackupBeforeCleanup))
  );

  return results.map(result => result.project);
}

/**
 * Limpa casos de teste de múltiplos projetos
 * Versão síncrona para compatibilidade (sem backup)
 * @deprecated Use a versão assíncrona com backup
 */
export function cleanupTestCasesForProjects(projects: Project[]): Project[] {
  return projects.map(project => cleanupTestCasesForNonTaskTypesSync(project));
}
