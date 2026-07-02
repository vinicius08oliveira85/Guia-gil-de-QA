import { Project } from '../types';
import { writeProjectToIndexedDBOnly } from './dbService';
import { flushLocalFolderSync } from '../utils/localFolderSyncScheduler';
import { writeBackupToFolder, type WriteBackupToFolderResult } from './localFolderBackupService';
import { logger } from '../utils/logger';

/**
 * Persiste o projeto no IndexedDB e tenta gravar o backup na pasta configurada.
 */
export async function saveProjectLocally(project: Project): Promise<void> {
  await writeProjectToIndexedDBOnly(project);
  const folderResult = await flushLocalFolderSync({ force: true });
  if (folderResult === 'permission_denied') {
    throw new Error(
      'Projeto salvo localmente, mas a permissão da pasta de backup expirou. Reautorize em Configurações → Dados locais.'
    );
  }
  if (folderResult === 'no_folder') {
    logger.debug(
      'Projeto salvo no IndexedDB; nenhuma pasta de backup configurada',
      'localSaveService',
      { projectId: project.id }
    );
  }
}

/**
 * Grava o backup completo (todos os projetos + acompanhamento) na pasta configurada.
 */
export async function syncLocalBackup(): Promise<WriteBackupToFolderResult> {
  return writeBackupToFolder();
}
