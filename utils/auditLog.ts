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
}

export const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const logEntry: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
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

export const clearAuditLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
