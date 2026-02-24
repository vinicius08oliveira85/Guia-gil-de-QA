import { Project } from '../types';
import { DB_NAME, DB_VERSION } from '../utils/constants';
import { logger } from '../utils/logger';
import { addAuditLog } from '../utils/auditLog';

const BACKUP_STORE_NAME = 'backups';
const MAX_BACKUPS_PER_PROJECT = 10; // Retenção de últimos 10 backups por projeto

export interface BackupInfo {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  operation: string; // Tipo de operação que gerou o backup (ex: 'DELETE', 'UPDATE', 'MERGE', 'CLEANUP')
  size: number; // Tamanho do backup em bytes
  description?: string; // Descrição opcional do backup
}

interface BackupEntry extends BackupInfo {
  project: Project; // Projeto completo salvo no backup
}

let backupDb: IDBDatabase | null = null;

/**
 * Abre conexão com o banco de dados de backups
 */
const openBackupDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (backupDb) {
      return resolve(backupDb);
    }

    const request = indexedDB.open(`${DB_NAME}_backups`, DB_VERSION);

    request.onerror = () => {
      const error =
        request.error || new Error('Erro desconhecido ao abrir banco de dados de backups');
      logger.error('Erro ao abrir banco de dados de backups', 'backupService', error);
      reject(error);
    };

    request.onsuccess = () => {
      backupDb = request.result;
      resolve(backupDb);
    };

    request.onupgradeneeded = event => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;

      // Criar object store de backups se não existir
      if (!dbInstance.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        const store = dbInstance.createObjectStore(BACKUP_STORE_NAME, { keyPath: 'id' });
        // Índice para buscar backups por projectId
        store.createIndex('projectId', 'projectId', { unique: false });
        // Índice para buscar backups por data (para ordenação)
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

/**
 * Calcula o tamanho aproximado do projeto em bytes
 */
const calculateProjectSize = (project: Project): number => {
  try {
    return new Blob([JSON.stringify(project)]).size;
  } catch {
    return 0;
  }
};

/**
 * Cria um backup do projeto
 * @param project Projeto a ser salvo em backup
 * @param operation Tipo de operação que gerou o backup
 * @param description Descrição opcional do backup
 * @returns ID do backup criado
 */
export const createBackup = async (
  project: Project,
  operation: string = 'MANUAL',
  description?: string
): Promise<string> => {
  try {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const size = calculateProjectSize(project);

    const backup: BackupEntry = {
      id: backupId,
      projectId: project.id,
      projectName: project.name,
      createdAt: now,
      operation,
      size,
      description,
      project: { ...project }, // Deep copy do projeto
    };

    const db = await openBackupDB();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(BACKUP_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const request = store.add(backup);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    // Limpar backups antigos (manter apenas os últimos N)
    await cleanupOldBackups(project.id);

    // Registrar no log de auditoria
    addAuditLog({
      action: 'CREATE',
      entityType: 'project',
      entityId: project.id,
      entityName: project.name,
      changes: {
        backupId: { old: undefined, new: backupId },
        operation: { old: undefined, new: operation },
      },
    });

    logger.info(
      `Backup criado: ${backupId} para projeto "${project.name}" (${(size / 1024).toFixed(2)}KB)`,
      'backupService'
    );

    return backupId;
  } catch (error) {
    logger.error('Erro ao criar backup', 'backupService', error);
    throw error;
  }
};

/**
 * Restaura um backup específico
 * @param projectId ID do projeto
 * @param backupId ID do backup a ser restaurado ou 'latest' para o mais recente
 * @returns Projeto restaurado
 */
export const restoreBackup = async (projectId: string, backupId: string): Promise<Project> => {
  try {
    // Se backupId for 'latest', obter o backup mais recente
    let targetBackupId = backupId;
    if (backupId === 'latest') {
      const latestBackup = await getLatestBackup(projectId);
      if (!latestBackup) {
        throw new Error(`Nenhum backup encontrado para o projeto ${projectId}`);
      }
      targetBackupId = latestBackup.id;
    }

    const db = await openBackupDB();

    const backup = await new Promise<BackupEntry>((resolve, reject) => {
      const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const request = store.get(targetBackupId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          reject(new Error(`Backup ${targetBackupId} não encontrado`));
          return;
        }
        if (result.projectId !== projectId) {
          reject(new Error(`Backup ${targetBackupId} não pertence ao projeto ${projectId}`));
          return;
        }
        resolve(result);
      };
    });

    // Registrar no log de auditoria
    addAuditLog({
      action: 'UPDATE',
      entityType: 'project',
      entityId: projectId,
      entityName: backup.projectName,
      changes: {
        restoredFromBackup: { old: undefined, new: backupId },
        restoredAt: { old: undefined, new: new Date().toISOString() },
      },
    });

    logger.info(
      `Backup restaurado: ${backupId} para projeto "${backup.projectName}"`,
      'backupService'
    );

    return backup.project;
  } catch (error) {
    logger.error('Erro ao restaurar backup', 'backupService', error);
    throw error;
  }
};

/**
 * Lista todos os backups de um projeto
 * @param projectId ID do projeto
 * @returns Lista de informações de backup, ordenada por data (mais recente primeiro)
 */
export const listBackups = async (projectId: string): Promise<BackupInfo[]> => {
  try {
    const db = await openBackupDB();

    const backups = await new Promise<BackupEntry[]>((resolve, reject) => {
      const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });

    // Ordenar por data (mais recente primeiro) e remover dados do projeto
    const backupInfos: BackupInfo[] = backups
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(({ project, ...info }) => info);

    logger.debug(
      `${backupInfos.length} backups encontrados para projeto ${projectId}`,
      'backupService'
    );

    return backupInfos;
  } catch (error) {
    logger.error('Erro ao listar backups', 'backupService', error);
    return [];
  }
};

/**
 * Obtém o backup mais recente de um projeto
 * @param projectId ID do projeto
 * @returns Informação do backup mais recente ou null
 */
export const getLatestBackup = async (projectId: string): Promise<BackupInfo | null> => {
  const backups = await listBackups(projectId);
  return backups.length > 0 ? backups[0] : null;
};

/**
 * Remove backups antigos, mantendo apenas os últimos N backups por projeto
 */
const cleanupOldBackups = async (projectId: string): Promise<void> => {
  try {
    const backups = await listBackups(projectId);

    if (backups.length <= MAX_BACKUPS_PER_PROJECT) {
      return; // Não precisa limpar
    }

    // Manter apenas os últimos N backups
    const backupsToDelete = backups.slice(MAX_BACKUPS_PER_PROJECT);
    const db = await openBackupDB();

    await Promise.all(
      backupsToDelete.map(
        backup =>
          new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(BACKUP_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(BACKUP_STORE_NAME);
            const request = store.delete(backup.id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          })
      )
    );

    logger.debug(
      `${backupsToDelete.length} backups antigos removidos para projeto ${projectId}`,
      'backupService'
    );
  } catch (error) {
    logger.warn('Erro ao limpar backups antigos', 'backupService', error);
    // Não lançar erro - limpeza é opcional
  }
};

/**
 * Cria backup automático antes de uma operação destrutiva
 * @param projectId ID do projeto
 * @param operation Tipo de operação (ex: 'DELETE', 'UPDATE', 'MERGE', 'CLEANUP')
 * @param getProject Função para obter o projeto atual
 * @returns ID do backup criado ou null se não foi possível criar
 */
export const autoBackupBeforeOperation = async (
  projectId: string,
  operation: string,
  getProject: () => Project | undefined
): Promise<string | null> => {
  try {
    const project = getProject();
    if (!project) {
      logger.warn(
        `Não foi possível criar backup: projeto ${projectId} não encontrado`,
        'backupService'
      );
      return null;
    }

    const backupId = await createBackup(
      project,
      operation,
      `Backup automático antes de ${operation}`
    );

    logger.debug(`Backup automático criado antes de ${operation}: ${backupId}`, 'backupService');

    return backupId;
  } catch (error) {
    logger.warn(`Erro ao criar backup automático antes de ${operation}`, 'backupService', error);
    // Não lançar erro - backup automático não deve bloquear operações
    return null;
  }
};

/**
 * Deleta um backup específico
 * @param backupId ID do backup a ser deletado
 */
export const deleteBackup = async (backupId: string): Promise<void> => {
  try {
    const db = await openBackupDB();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(BACKUP_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const request = store.delete(backupId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    logger.info(`Backup deletado: ${backupId}`, 'backupService');
  } catch (error) {
    logger.error('Erro ao deletar backup', 'backupService', error);
    throw error;
  }
};

/**
 * Obtém estatísticas de backups
 */
export const getBackupStats = async (
  projectId: string
): Promise<{
  total: number;
  totalSize: number; // Tamanho total em bytes
  oldestBackup: BackupInfo | null;
  newestBackup: BackupInfo | null;
}> => {
  const backups = await listBackups(projectId);

  if (backups.length === 0) {
    return {
      total: 0,
      totalSize: 0,
      oldestBackup: null,
      newestBackup: null,
    };
  }

  const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
  const oldestBackup = backups[backups.length - 1];
  const newestBackup = backups[0];

  return {
    total: backups.length,
    totalSize,
    oldestBackup,
    newestBackup,
  };
};
