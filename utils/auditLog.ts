import { Project } from '../types';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'project' | 'task' | 'document' | 'testcase' | 'phase';
  entityId: string;
  entityName: string;
  changes?: Record<string, { old: any; new: any }>;
  userId?: string;
}

const STORAGE_KEY = 'qa_audit_logs';

export const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const logs = getAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  logs.push(newEntry);
  
  // Manter apenas os últimos 1000 logs
  if (logs.length > 1000) {
    logs.shift();
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

export const getAuditLogsForProject = (projectId: string): AuditLogEntry[] => {
  const logs = getAuditLogs();
  return logs.filter(log => 
    log.entityId === projectId || 
    (log.changes && Object.keys(log.changes).some(key => key.includes(projectId)))
  );
};

export const clearAuditLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};

