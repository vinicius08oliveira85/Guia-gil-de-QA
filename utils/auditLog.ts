import { logger } from './logger';

const STORAGE_KEY = 'qa_audit_logs';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'project' | 'task' | 'testcase' | 'document';
  entityId: string;
  entityName: string;
  changes?: Record<string, { old: any; new: any }>;
  backupId?: string; // ID do backup criado antes da operação (se aplicável)
  origin?: 'user' | 'sync' | 'migration' | 'auto-save' | 'system'; // Origem da mudança
  userId?: string; // ID do usuário que fez a mudança (se disponível)
}

export const addAuditLog = (
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & {
    backupId?: string;
    origin?: 'user' | 'sync' | 'migration' | 'auto-save' | 'system';
    userId?: string;
  }
) => {
  const logEntry: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    origin: entry.origin || 'user', // Padrão: 'user' se não especificado
  };

  try {
    const logs = getAuditLogs();
    logs.unshift(logEntry);
    
    // Manter apenas os últimos 1000 logs
    if (logs.length > 1000) {
      logs.pop();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    logger.error('Error saving audit log', 'auditLog', error);
  }
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    logger.error('Error reading audit logs', 'auditLog', error);
    return [];
  }
};

export const getAuditLogsByEntity = (entityId: string): AuditLogEntry[] => {
  return getAuditLogs().filter(log => log.entityId === entityId);
};

/**
 * Obtém logs de auditoria filtrados por origem
 */
export const getAuditLogsByOrigin = (origin: AuditLogEntry['origin']): AuditLogEntry[] => {
  return getAuditLogs().filter(log => log.origin === origin);
};

/**
 * Obtém logs de auditoria que têm backup associado
 */
export const getAuditLogsWithBackup = (): AuditLogEntry[] => {
  return getAuditLogs().filter(log => log.backupId);
};

/**
 * Obtém histórico completo de alterações de uma entidade
 */
export const getEntityHistory = (entityId: string): AuditLogEntry[] => {
  const logs = getAuditLogsByEntity(entityId);
  // Ordenar por timestamp (mais recente primeiro)
  return logs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const clearAuditLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
