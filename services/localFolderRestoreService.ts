import type { FullAppStateBackup } from './fullLocalBackupService';
import { summarizeAppStateBackup, formatAppStateRestoreMessage } from './appStateRestoreService';
import {
  importProjectsFromBackup,
  loadProjectsFromIndexedDB,
  type ImportBackupResult,
} from './dbService';
import { getJiraConfig } from './jira/config';
import { hasGeminiConfig } from './geminiConfigService';
import {
  getConfiguredFolderLabel,
  LOCAL_FOLDER_CONFIG_UPDATED_EVENT,
  readBackupFromFolder,
} from './localFolderBackupService';
import { logger } from '../utils/logger';

export const FOLDER_RESTORE_PROMPT_DISMISSED_KEY = 'qa_folder_restore_prompt_dismissed';
export const FOLDER_LAST_RESTORE_AT_KEY = 'qa_local_folder_last_restore_at';

/** Disparado quando uma pasta recém-escolhida contém backup e o local está vazio. */
export const FOLDER_BACKUP_AVAILABLE_EVENT = 'qa-folder-backup-available';

export interface BackupFileSummary {
  projectCount: number;
  taskTrackingTaskCount: number;
  hasAppState: boolean;
  appStateSummary?: ReturnType<typeof summarizeAppStateBackup>;
  exportedAt: string | null;
  backupFormatVersion: number | null;
}

export type ShouldOfferFolderRestoreResult =
  | { offer: false; reason: 'dismissed' | 'not_empty' | 'no_folder' | 'no_file' | 'no_permission' | 'empty_backup' }
  | { offer: true; folderLabel: string; summary: BackupFileSummary };

function readSessionFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function setFolderRestorePromptDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(FOLDER_RESTORE_PROMPT_DISMISSED_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function getLocalFolderLastRestoreAt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(FOLDER_LAST_RESTORE_AT_KEY);
  } catch {
    return null;
  }
}

function setLocalFolderLastRestoreAt(iso: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FOLDER_LAST_RESTORE_AT_KEY, iso);
    window.dispatchEvent(new CustomEvent(LOCAL_FOLDER_CONFIG_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Verifica se não há projetos nem credenciais Jira/Gemini no navegador.
 */
export async function isLocalDataEffectivelyEmpty(): Promise<boolean> {
  const projects = await loadProjectsFromIndexedDB();
  if (projects.length > 0) return false;
  if (getJiraConfig()) return false;
  if (hasGeminiConfig()) return false;
  return true;
}

function countTaskTrackingTasks(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0;
  const tasks = (raw as { tasks?: unknown }).tasks;
  return Array.isArray(tasks) ? tasks.length : 0;
}

/**
 * Analisa um arquivo JSON de backup e retorna resumo estruturado.
 */
export async function parseBackupFile(file: File): Promise<BackupFileSummary | null> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (Array.isArray(parsed)) {
    return {
      projectCount: parsed.length,
      taskTrackingTaskCount: 0,
      hasAppState: false,
      exportedAt: null,
      backupFormatVersion: null,
    };
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const envelope = parsed as {
    projects?: unknown;
    taskTracking?: unknown;
    appState?: FullAppStateBackup;
    exportedAt?: unknown;
    backupFormatVersion?: unknown;
  };

  const projects = Array.isArray(envelope.projects) ? envelope.projects : [];
  const appState = envelope.appState;
  const hasAppState = Boolean(appState && typeof appState === 'object');
  const appStateSummary = hasAppState ? summarizeAppStateBackup(appState!) : undefined;

  return {
    projectCount: projects.length,
    taskTrackingTaskCount: countTaskTrackingTasks(envelope.taskTracking),
    hasAppState,
    appStateSummary,
    exportedAt: typeof envelope.exportedAt === 'string' ? envelope.exportedAt : null,
    backupFormatVersion:
      typeof envelope.backupFormatVersion === 'number' ? envelope.backupFormatVersion : null,
  };
}

export function isBackupMeaningful(summary: BackupFileSummary): boolean {
  if (summary.projectCount > 0) return true;
  if (summary.taskTrackingTaskCount > 0) return true;
  if (!summary.hasAppState || !summary.appStateSummary) return false;

  const s = summary.appStateSummary;
  return (
    s.jiraConfig ||
    s.geminiKeysCount > 0 ||
    s.preferences ||
    s.localStorageKeys > 0 ||
    s.cacheEntries > 0
  );
}

export function formatBackupSummaryForPrompt(summary: BackupFileSummary): string {
  const parts: string[] = [];
  if (summary.projectCount > 0) {
    parts.push(`${summary.projectCount} projeto(s)`);
  }
  if (summary.taskTrackingTaskCount > 0) {
    parts.push(`${summary.taskTrackingTaskCount} tarefa(s) de acompanhamento`);
  }
  if (summary.appStateSummary?.jiraConfig) parts.push('credenciais Jira');
  if (summary.appStateSummary && summary.appStateSummary.geminiKeysCount > 0) {
    parts.push(`${summary.appStateSummary.geminiKeysCount} chave(s) Gemini`);
  }
  if (summary.appStateSummary?.preferences) parts.push('preferências');
  if (parts.length === 0) parts.push('configurações salvas');
  return parts.join(', ');
}

/** Mensagem de toast após restore bem-sucedido da pasta. */
export function formatRestoreResultMessage(result: ImportBackupResult): string {
  const parts: string[] = [];
  if (result.imported > 0) {
    parts.push(`${result.imported} projeto(s) restaurado(s) da pasta`);
  }
  if (result.taskTrackingTasksRestored > 0) {
    parts.push(
      `acompanhamento de tarefas restaurado (${result.taskTrackingTasksRestored} tarefa(s))`
    );
  }
  if (result.appStateRestored && result.appStateSummary) {
    const configMsg = formatAppStateRestoreMessage(result.appStateSummary);
    if (configMsg) parts.push(configMsg.replace(/\.$/, ''));
  }
  if (parts.length === 0) return 'Backup restaurado da pasta.';
  return `${parts.join('; ')}.`;
}

/**
 * Indica se devemos oferecer restore da pasta na inicialização.
 */
export async function shouldOfferFolderRestoreOnStartup(): Promise<ShouldOfferFolderRestoreResult> {
  if (readSessionFlag(FOLDER_RESTORE_PROMPT_DISMISSED_KEY)) {
    return { offer: false, reason: 'dismissed' };
  }

  if (!(await isLocalDataEffectivelyEmpty())) {
    return { offer: false, reason: 'not_empty' };
  }

  const file = await readBackupFromFolder();
  if (!file) {
    const hasFolder = getConfiguredFolderLabel();
    if (!hasFolder) return { offer: false, reason: 'no_folder' };
    return { offer: false, reason: 'no_permission' };
  }

  const summary = await parseBackupFile(file);
  if (!summary || !isBackupMeaningful(summary)) {
    return { offer: false, reason: 'empty_backup' };
  }

  const folderLabel = getConfiguredFolderLabel() ?? 'pasta configurada';
  return { offer: true, folderLabel, summary };
}

export type RestoreFromFolderResult =
  | { status: 'success'; result: ImportBackupResult; summary: BackupFileSummary }
  | { status: 'no_folder' }
  | { status: 'no_file' }
  | { status: 'no_permission' }
  | { status: 'empty_backup' }
  | { status: 'error'; error: unknown };

/**
 * Lê o backup da pasta configurada e importa para IndexedDB/localStorage.
 */
export async function restoreFromConfiguredFolder(): Promise<RestoreFromFolderResult> {
  const file = await readBackupFromFolder();
  if (!file) {
    const hasFolder = getConfiguredFolderLabel();
    if (!hasFolder) return { status: 'no_folder' };
    return { status: 'no_permission' };
  }

  const summary = await parseBackupFile(file);
  if (!summary || !isBackupMeaningful(summary)) {
    return { status: 'empty_backup' };
  }

  try {
    const result = await importProjectsFromBackup(file);
    setLocalFolderLastRestoreAt(new Date().toISOString());
    logger.info(
      `Backup restaurado da pasta: ${result.imported} projeto(s), appState=${result.appStateRestored}`,
      'localFolderRestoreService'
    );
    return { status: 'success', result, summary };
  } catch (error) {
    logger.error('Falha ao restaurar backup da pasta', 'localFolderRestoreService', error);
    return { status: 'error', error };
  }
}

export interface FolderBackupAvailableDetail {
  folderLabel: string;
  summary: BackupFileSummary;
}

/** Emite evento para UI oferecer restore após escolher pasta com backup existente. */
export function dispatchFolderBackupAvailable(detail: FolderBackupAvailableDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<FolderBackupAvailableDetail>(FOLDER_BACKUP_AVAILABLE_EVENT, { detail }));
}
