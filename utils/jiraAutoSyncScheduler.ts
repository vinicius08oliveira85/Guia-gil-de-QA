import { runJiraAutoSync } from '../services/jira/jiraAutoSync';
import { JIRA_AUTO_SYNC_INTERVAL_MINUTES } from './jiraAutoSyncConstants';
import { getCurrentSlotKey, getNextAlignedRunDate } from './jiraAutoSyncTiming';
import { JIRA_AUTO_SYNC_COMPLETE_EVENT } from '../services/businessRuleDossierSyncService';
import { logger } from './logger';

let alignedTimeout: ReturnType<typeof setTimeout> | null = null;
let lastAlignedSlotKey = '';
let visibilityHandler: (() => void) | null = null;
let schedulerStarted = false;

async function tick(): Promise<void> {
  const summary = await runJiraAutoSync();
  if (summary) {
    lastAlignedSlotKey = getCurrentSlotKey();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(JIRA_AUTO_SYNC_COMPLETE_EVENT));
    }
  }
}

function scheduleNextAlignedTick(): void {
  if (alignedTimeout) {
    clearTimeout(alignedTimeout);
    alignedTimeout = null;
  }

  const delay = Math.max(0, getNextAlignedRunDate().getTime() - Date.now());

  alignedTimeout = setTimeout(() => {
    void (async () => {
      await tick();
      scheduleNextAlignedTick();
    })();
  }, delay);
}

function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return;

  const currentSlotKey = getCurrentSlotKey();
  if (currentSlotKey === lastAlignedSlotKey) return;

  void tick();
}

/**
 * Inicia o agendador de sincronização automática com o Jira.
 * Dispara imediatamente ao abrir o app e depois nos horários alinhados (:00, :20, :40…).
 * Também dispara ao retornar à aba se o slot atual ainda não foi sincronizado.
 */
export function startJiraAutoSyncScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  void tick();
  scheduleNextAlignedTick();

  visibilityHandler = handleVisibilityChange;
  document.addEventListener('visibilitychange', visibilityHandler);

  logger.info(
    `Agendador Jira iniciado (sync na abertura + a cada ${JIRA_AUTO_SYNC_INTERVAL_MINUTES} min alinhado ao relógio)`,
    'jiraAutoSyncScheduler'
  );
}

/** Interrompe o agendador de sincronização automática com o Jira. */
export function stopJiraAutoSyncScheduler(): void {
  if (alignedTimeout) {
    clearTimeout(alignedTimeout);
    alignedTimeout = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  schedulerStarted = false;
  lastAlignedSlotKey = '';
}
