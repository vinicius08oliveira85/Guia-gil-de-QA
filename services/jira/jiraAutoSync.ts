import type { Project } from '../../types';
import { useProjectsStore } from '../../store/projectsStore';
import { logger } from '../../utils/logger';
import { getJiraConfig, syncJiraProject } from '../jiraService';
import { jiraSyncQueue } from '../jiraSyncQueue';
import { syncFilasQueuesFromJira } from './filasQueueSync';

const LAST_AUTO_SYNC_KEY = 'jira-last-auto-sync';
let pendingSync: Promise<JiraAutoSyncSummary | null> | null = null;

/** Retorna o timestamp ISO da última sync automática (global). */
export function getLastAutoSyncTimestamp(): string | null {
  return localStorage.getItem(LAST_AUTO_SYNC_KEY);
}

/** Atualiza o timestamp da última sync automática. */
function setLastAutoSyncTimestamp(): void {
  localStorage.setItem(LAST_AUTO_SYNC_KEY, new Date().toISOString());
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
  const config = getJiraConfig();
  if (!config) return 0;

  const { projects, updateProject } = useProjectsStore.getState();
  let syncedCount = 0;

  for (const project of projects) {
    const jiraProjectKey = resolveJiraProjectKey(project);
    if (!jiraProjectKey) continue;

    try {
      await jiraSyncQueue.enqueue(
        `sync-${project.id}`,
        async () => {
          const latestProject =
            useProjectsStore.getState().projects.find(item => item.id === project.id) ?? project;
          const syncResult = await syncJiraProject(
            config,
            latestProject,
            jiraProjectKey,
            { updatedAfter: options?.updatedAfter }
          );
          if (syncResult.totalErrors > 0) {
            logger.warn(
              `Auto-sync de ${jiraProjectKey} concluída com ${syncResult.totalErrors} erro(s)`,
              'jiraAutoSync'
            );
          }
          await updateProject(syncResult.data, { silent: options?.silent ?? true });
          syncedCount += 1;
        },
        { group: project.id, priority: 'low' }
      );
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
  if (pendingSync) return pendingSync;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return null;
  if (!getJiraConfig()) return null;

  pendingSync = (async (): Promise<JiraAutoSyncSummary | null> => {
    try {
      const lastSync = getLastAutoSyncTimestamp();
      logger.info('Iniciando sincronização automática com Jira', 'jiraAutoSync', {
        incremental: !!lastSync,
        lastSync,
      });

      const projectsSynced = await syncAllJiraProjects({
        silent: true,
        updatedAfter: lastSync ?? undefined,
      });

      const filasResult = await jiraSyncQueue.enqueue('sync-filas', () => syncFilasQueuesFromJira());

      setLastAutoSyncTimestamp();

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
      pendingSync = null;
    }
  })();

  return pendingSync;
}

/** Indica se há sincronização automática em andamento. */
export function isJiraAutoSyncRunning(): boolean {
  return pendingSync !== null;
}
