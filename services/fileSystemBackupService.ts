import { buildLocalBackupData, BACKUP_EXPORT_FORMAT_VERSION } from './dbService';
import { DB_VERSION } from '../utils/constants';
import { logger } from '../utils/logger';

/** Tipagem mínima da File System Access API (evita dependência de versões do lib DOM). */
type JsonFilePickerAcceptType = { description: string; accept: Record<string, string[]> };

const JSON_PICKER_TYPES: JsonFilePickerAcceptType[] = [
  { description: 'Backup JSON (QA Agile Guide)', accept: { 'application/json': ['.json'] } },
];

function defaultBackupFilename(): string {
  const datePart = new Date().toISOString().split('T')[0];
  return `qa-agile-guide-backup-${datePart}.json`;
}

/** Indica se o ambiente suporta escolha explícita de pasta/arquivo para backup (Chromium, Edge). */
export function isFileSystemAccessBackupSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showSaveFilePicker === 'function' &&
    typeof window.showOpenFilePicker === 'function'
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Exporta o backup local para um caminho escolhido pelo usuário (File System Access API).
 * @returns `saved` após gravar, `cancelled` se o usuário fechou o diálogo, `unsupported` se a API não existir.
 */
export async function exportLocalBackupViaFileSystemAccess(): Promise<
  'saved' | 'cancelled' | 'unsupported'
> {
  if (!isFileSystemAccessBackupSupported()) {
    return 'unsupported';
  }

  let handle: FileSystemFileHandle;
  try {
    handle = await window.showSaveFilePicker!({
      suggestedName: defaultBackupFilename(),
      types: JSON_PICKER_TYPES,
    });
  } catch (error) {
    if (isAbortError(error)) {
      return 'cancelled';
    }
    throw error;
  }

  const backupData = await buildLocalBackupData();
  const jsonString = JSON.stringify(backupData, null, 2);

  const writable = await handle.createWritable();
  try {
    await writable.write(jsonString);
    await writable.close();
  } catch (error) {
    try {
      await writable.close();
    } catch {
      /* ignore */
    }
    throw error;
  }

  logger.info(
    `Backup local exportado (File System Access): ${backupData.projects.length} projeto(s)`,
    'fileSystemBackup',
    {
      backupFormatVersion: BACKUP_EXPORT_FORMAT_VERSION,
      dbVersion: DB_VERSION,
    }
  );

  return 'saved';
}

export type PickBackupJsonFileResult =
  | { status: 'file'; file: File }
  | { status: 'cancelled' }
  | { status: 'unsupported' };

/**
 * Abre o seletor de arquivo nativo (FSA) para um JSON de backup.
 */
export async function pickBackupJsonFileViaFileSystemAccess(): Promise<PickBackupJsonFileResult> {
  if (!isFileSystemAccessBackupSupported()) {
    return { status: 'unsupported' };
  }

  let handles: FileSystemFileHandle[];
  try {
    handles = await window.showOpenFilePicker!({
      multiple: false,
      types: JSON_PICKER_TYPES,
    });
  } catch (error) {
    if (isAbortError(error)) {
      return { status: 'cancelled' };
    }
    throw error;
  }

  const handle = handles[0];
  if (!handle) {
    return { status: 'cancelled' };
  }

  const file = await handle.getFile();
  return { status: 'file', file };
}
