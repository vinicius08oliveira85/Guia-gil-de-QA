import type { Project } from '../../types';
import { useProjectsStore } from '../../store/projectsStore';
import { logger } from '../../utils/logger';
import { getJiraConfig, syncJiraProject } from '../jiraService';
import { syncFilasQueuesFromJira } from './filasQueueSync';

let syncInProgress = false;

/** Resolve a chave Jira de um projeto (settings ou prefixo da primeira issue). */
export function resolveJiraProjectKey(project: Project): string | null {
  const fromSettings = project.settings?.jiraProjectKey?.trim();
  if (fromSettings) return fromSettings;

  for (const task of project.tasks) {
    const match = task.id.match(/^([A-Z][A-Z0-9]+)-\d+$/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Sincroniza todos os projetos locais vinculados ao Jira.
 * @returns Quantidade de projetos sincronizados com sucesso.
 */
export async function syncAllJiraProjects(options?: { silent?: boolean }): Promise<number> {
  const config = getJiraConfig();
  if (!config) return 0;

  const { projects, updateProject } = useProjectsStore.getState();
  let syncedCount = 0;

  for (const project of projects) {
    const jiraProjectKey = resolveJiraProjectKey(project);
    if (!jiraProjectKey) continue;

    try {
      const latestProject =
        useProjectsStore.getState().projects.find(item => item.id === project.id) ?? project;
      const updatedProject = await syncJiraProject(config, latestProject, jiraProjectKey);
      await updateProject(updatedProject, { silent: options?.silent ?? true });
      syncedCount += 1;
    } catch (error) {
      logger.warn('Falha ao sincronizar projeto com Jira', 'jiraAutoSync', {
        projectId: project.id,
        jiraProjectKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return syncedCount;
}

export interface JiraAutoSyncSummary {
  projectsSynced: number;
  filasSynced: boolean;
  filasTaskCount: number;
}

/**
 * Executa sincronização automática de projetos e Filas (Jira).
 * Ignora chamadas concorrentes e quando a aba está oculta.
 */
export async function runJiraAutoSync(): Promise<JiraAutoSyncSummary | null> {
  if (syncInProgress) return null;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return null;
  if (!getJiraConfig()) return null;

  syncInProgress = true;
  try {
    logger.info('Iniciando sincronização automática com Jira', 'jiraAutoSync');

    const projectsSynced = await syncAllJiraProjects({ silent: true });
    const filasResult = await syncFilasQueuesFromJira();

    const summary: JiraAutoSyncSummary = {
      projectsSynced,
      filasSynced: filasResult !== null,
      filasTaskCount: filasResult?.tasks.length ?? 0,
    };

    logger.info('Sincronização automática com Jira concluída', 'jiraAutoSync', summary);
    return summary;
  } catch (error) {
    logger.error(
      'Erro na sincronização automática com Jira',
      'jiraAutoSync',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  } finally {
    syncInProgress = false;
  }
}

/** Indica se há sincronização automática em andamento. */
export function isJiraAutoSyncRunning(): boolean {
  return syncInProgress;
}
