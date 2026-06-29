import { runJiraAutoSync } from '../services/jira/jiraAutoSync';
import { JIRA_AUTO_SYNC_INTERVAL_MS } from './jiraAutoSyncConstants';
import { logger } from './logger';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastRunAt = 0;
let visibilityHandler: (() => void) | null = null;

async function tick(): Promise<void> {
  const summary = await runJiraAutoSync();
  if (summary) {
    lastRunAt = Date.now();
  }
}

/**
 * Inicia o agendador de sincronização automática com o Jira (a cada 10 minutos).
 * Também dispara ao retornar à aba se o intervalo já tiver expirado.
 */
export function startJiraAutoSyncScheduler(): void {
  if (schedulerInterval) return;

  lastRunAt = Date.now();

  schedulerInterval = setInterval(() => {
    void tick();
  }, JIRA_AUTO_SYNC_INTERVAL_MS);

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastRunAt < JIRA_AUTO_SYNC_INTERVAL_MS) return;
    void tick();
  };

  document.addEventListener('visibilitychange', visibilityHandler);
  logger.info(
    `Agendador Jira iniciado (intervalo: ${JIRA_AUTO_SYNC_INTERVAL_MS / 60_000} min)`,
    'jiraAutoSyncScheduler'
  );
}

/** Interrompe o agendador de sincronização automática com o Jira. */
export function stopJiraAutoSyncScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
}
