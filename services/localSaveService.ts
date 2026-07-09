import { Project } from '../types';
import { writeProjectToIndexedDBOnly } from './dbService';
import { flushLocalFolderSync } from '../utils/localFolderSyncScheduler';
import { writeBackupToFolder, type WriteBackupToFolderResult } from './localFolderBackupService';
import { logger } from '../utils/logger';

export interface SaveAllWorkspaceResult {
  projectsSaved: number;
  folderResult: WriteBackupToFolderResult | 'skipped';
}

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

/**
 * Persiste todos os projetos no IndexedDB e grava backup completo (projetos, acompanhamento,
 * filtros, bloco de notas, preferências) na pasta configurada, quando houver.
 */
export async function saveAllWorkspaceData(projects: Project[]): Promise<SaveAllWorkspaceResult> {
  let projectsSaved = 0;

  for (const project of projects) {
    await writeProjectToIndexedDBOnly(project);
    projectsSaved += 1;
  }

  const folderResult = await flushLocalFolderSync({ force: true });

  logger.info('Workspace salvo integralmente', 'localSaveService', {
    projectsSaved,
    folderResult,
  });

  return { projectsSaved, folderResult };
}
