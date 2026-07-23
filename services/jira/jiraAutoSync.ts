import type { Project } from '../../types';
import { useProjectsStore } from '../../store/projectsStore';
import { logger } from '../../utils/logger';
import { waitForJiraConfig, syncJiraProject } from '../jiraService';
import { jiraSyncQueue } from '../jiraSyncQueue';
import { syncFilasQueuesFromJira } from './filasQueueSync';

let syncInProgress = false;

/** Retorna o timestamp ISO da última sync do projeto. */
export function getLastProjectSyncTimestamp(project: Project): string | null {
  return project.settings?.lastJiraSyncAt ?? null;
}

/** Atualiza o timestamp da última sync no projeto. */
async function setLastProjectSyncTimestamp(projectId: string): Promise<void> {
  const { projects, updateProject } = useProjectsStore.getState();
  const project = projects.find(p => p.id === projectId);
  if (project) {
    await updateProject({
      ...project,
      settings: {
        ...project.settings,
        lastJiraSyncAt: new Date().toISOString(),
      },
    }, { silent: true });
  }
}

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
 * Sincroniza todos os projetos locais vinculados ao Jira (via fila singleton).
 * Suporta sync incremental via updatedAfter.
 * @returns Quantidade de projetos sincronizados com sucesso.
 */
export async function syncAllJiraProjects(options?: {
  silent?: boolean;
  updatedAfter?: string;
}): Promise<number> {
  const config = await waitForJiraConfig();
  if (!config) return 0;

  const { projects, updateProject } = useProjectsStore.getState();
  let syncedCount = 0;

  for (const project of projects) {
    const jiraProjectKey = resolveJiraProjectKey(project);
    if (!jiraProjectKey) continue;

    try {
      await jiraSyncQueue.enqueue(`sync-${project.id}`, async () => {
        const latestProject =
          useProjectsStore.getState().projects.find(item => item.id === project.id) ?? project;
        const syncResult = await syncJiraProject(config, latestProject, jiraProjectKey, {
          updatedAfter: options?.updatedAfter,
        });
        await updateProject(syncResult.data, { silent: options?.silent ?? true });
        syncedCount += 1;
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Substituído por nova solicitação')) {
        logger.debug('Sync automática substituída por nova solicitação', 'jiraAutoSync', {
          projectId: project.id,
        });
        continue;
      }
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
 * Usa sync incremental (apenas issues modificadas desde a última sync).
 * Ignora chamadas concorrentes e quando a aba está oculta.
 */
export async function runJiraAutoSync(): Promise<JiraAutoSyncSummary | null> {
  if (syncInProgress) return null;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return null;

  const config = await waitForJiraConfig();
  if (!config) return null;

  syncInProgress = true;
  try {
    logger.info('Iniciando sincronização automática com Jira', 'jiraAutoSync');

    const projectsSynced = await syncAllJiraProjects({ silent: true });

    const filasResult = await jiraSyncQueue.enqueue('sync-filas', () => syncFilasQueuesFromJira());

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
