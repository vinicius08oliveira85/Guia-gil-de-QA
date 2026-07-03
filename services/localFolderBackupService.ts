import {
  BACKUP_EXPORT_FORMAT_VERSION,
  buildLocalBackupData,
  clearLocalFolderDirectoryHandle,
  getLocalFolderDirectoryHandle,
  saveLocalFolderDirectoryHandle,
} from './dbService';
import { writeJsonStringToFileHandle } from './fileSystemBackupService';
import { DB_VERSION } from '../utils/constants';
import { logger } from '../utils/logger';

/** Nome fixo do arquivo de backup na pasta configurada. */
export const LOCAL_FOLDER_BACKUP_FILENAME = 'qa-agile-guide-backup.json';

const STORAGE_KEYS = {
  autoSyncEnabled: 'qa_local_folder_auto_sync_enabled',
  folderLabel: 'qa_local_folder_label',
  lastSyncAt: 'qa_local_folder_last_sync_at',
  lastSyncError: 'qa_local_folder_last_sync_error',
} as const;

export const LOCAL_FOLDER_CONFIG_UPDATED_EVENT = 'qa-local-folder-config-updated';

export type WriteBackupToFolderResult =
  | 'saved'
  | 'no_folder'
  | 'unsupported'
  | 'permission_denied'
  | 'cancelled';

export type PickBackupFolderResult =
  | { status: 'picked'; folderLabel: string; existingBackup: boolean }
  | { status: 'cancelled' }
  | { status: 'unsupported' };

export interface LocalFolderBackupPrefs {
  autoSyncEnabled: boolean;
  folderLabel: string | null;
  lastSyncAt: string | null;
  lastRestoreAt: string | null;
  lastSyncError: string | null;
  hasConfiguredFolder: boolean;
}

function dispatchConfigUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOCAL_FOLDER_CONFIG_UPDATED_EVENT));
}

function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Indica se o ambiente suporta escolha de pasta fixa (Chromium, Edge). */
export function isLocalFolderBackupSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export function isLocalFolderAutoSyncEnabled(): boolean {
  const raw = readStorageItem(STORAGE_KEYS.autoSyncEnabled);
  if (raw === null) return true;
  return raw !== 'false';
}

export function setLocalFolderAutoSyncEnabled(enabled: boolean): void {
  writeStorageItem(STORAGE_KEYS.autoSyncEnabled, enabled ? 'true' : 'false');
  dispatchConfigUpdated();
}

export function getConfiguredFolderLabel(): string | null {
  return readStorageItem(STORAGE_KEYS.folderLabel);
}

function setConfiguredFolderLabel(label: string | null): void {
  writeStorageItem(STORAGE_KEYS.folderLabel, label);
  dispatchConfigUpdated();
}

export function getLocalFolderLastSyncAt(): string | null {
  return readStorageItem(STORAGE_KEYS.lastSyncAt);
}

export function getLocalFolderLastSyncError(): string | null {
  return readStorageItem(STORAGE_KEYS.lastSyncError);
}

function setLocalFolderLastSyncAt(iso: string | null): void {
  writeStorageItem(STORAGE_KEYS.lastSyncAt, iso);
  dispatchConfigUpdated();
}

function setLocalFolderLastSyncError(message: string | null): void {
  writeStorageItem(STORAGE_KEYS.lastSyncError, message);
  dispatchConfigUpdated();
}

export async function hasConfiguredBackupFolder(): Promise<boolean> {
  const handle = await getLocalFolderDirectoryHandle();
  return handle !== null;
}

export function getLocalFolderBackupPrefsSync(): Omit<
  LocalFolderBackupPrefs,
  'hasConfiguredFolder'
> {
  return {
    autoSyncEnabled: isLocalFolderAutoSyncEnabled(),
    folderLabel: getConfiguredFolderLabel(),
    lastSyncAt: getLocalFolderLastSyncAt(),
    lastRestoreAt: readStorageItem('qa_local_folder_last_restore_at'),
    lastSyncError: getLocalFolderLastSyncError(),
  };
}

export async function getLocalFolderBackupPrefs(): Promise<LocalFolderBackupPrefs> {
  return {
    ...getLocalFolderBackupPrefsSync(),
    hasConfiguredFolder: await hasConfiguredBackupFolder(),
  };
}

/**
 * Solicita permissão de leitura/escrita na pasta configurada.
 */
export async function requestFolderPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(opts)) === 'granted') {
    return true;
  }
  return (await handle.requestPermission(opts)) === 'granted';
}

/**
 * Abre o seletor de pasta e persiste o handle no IndexedDB.
 */
export async function pickBackupFolder(): Promise<PickBackupFolderResult> {
  if (!isLocalFolderBackupSupported()) {
    return { status: 'unsupported' };
  }

  let handle: FileSystemDirectoryHandle;
  try {
    handle = await window.showDirectoryPicker!();
  } catch (error) {
    if (isAbortError(error)) {
      return { status: 'cancelled' };
    }
    throw error;
  }

  const granted = await requestFolderPermission(handle);
  if (!granted) {
    throw new Error('Permissão negada para gravar na pasta escolhida.');
  }

  await saveLocalFolderDirectoryHandle(handle);
  setConfiguredFolderLabel(handle.name);
  setLocalFolderLastSyncError(null);
  dispatchConfigUpdated();

  let existingBackup = false;
  try {
    await handle.getFileHandle(LOCAL_FOLDER_BACKUP_FILENAME);
    existingBackup = true;
  } catch {
    existingBackup = false;
  }

  logger.info(`Pasta de backup configurada: ${handle.name}`, 'localFolderBackup');
  return { status: 'picked', folderLabel: handle.name, existingBackup };
}

/**
 * Remove a pasta configurada e limpa preferências relacionadas.
 */
export async function clearConfiguredFolder(): Promise<void> {
  await clearLocalFolderDirectoryHandle();
  setConfiguredFolderLabel(null);
  setLocalFolderLastSyncAt(null);
  setLocalFolderLastSyncError(null);
  dispatchConfigUpdated();
  logger.info('Pasta de backup desvinculada', 'localFolderBackup');
}

/**
 * Grava o backup JSON canônico na pasta configurada (overwrite).
 */
export async function writeBackupToFolder(): Promise<WriteBackupToFolderResult> {
  if (!isLocalFolderBackupSupported()) {
    return 'unsupported';
  }

  const dirHandle = await getLocalFolderDirectoryHandle();
  if (!dirHandle) {
    return 'no_folder';
  }

  const granted = await requestFolderPermission(dirHandle);
  if (!granted) {
    setLocalFolderLastSyncError(
      'Permissão para gravar na pasta expirou. Use "Salvar agora" para reautorizar.'
    );
    return 'permission_denied';
  }

  const backupData = await buildLocalBackupData();
  const jsonString = JSON.stringify(backupData, null, 2);

  const fileHandle = await dirHandle.getFileHandle(LOCAL_FOLDER_BACKUP_FILENAME, { create: true });
  await writeJsonStringToFileHandle(fileHandle, jsonString);

  const syncedAt = new Date().toISOString();
  setLocalFolderLastSyncAt(syncedAt);
  setLocalFolderLastSyncError(null);
  setConfiguredFolderLabel(dirHandle.name);

  logger.info(
    `Backup gravado na pasta: ${backupData.projects.length} projeto(s)`,
    'localFolderBackup',
    {
      backupFormatVersion: BACKUP_EXPORT_FORMAT_VERSION,
      dbVersion: DB_VERSION,
      folder: dirHandle.name,
    }
  );

  return 'saved';
}

/**
 * Lê o arquivo de backup canônico da pasta configurada.
 */
export async function readBackupFromFolder(): Promise<File | null> {
  const dirHandle = await getLocalFolderDirectoryHandle();
  if (!dirHandle) return null;

  const granted = await requestFolderPermission(dirHandle);
  if (!granted) return null;

  try {
    const fileHandle = await dirHandle.getFileHandle(LOCAL_FOLDER_BACKUP_FILENAME);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}
