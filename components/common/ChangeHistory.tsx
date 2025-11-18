import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { getAuditLogs } from '../../utils/auditLog';
import { formatDateTime, formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';

interface ChangeHistoryProps {
  project: Project;
}

export const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  project
}) => {
  const [filter, setFilter] = useState<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all');
  
  const logs = useMemo(() => {
    const allLogs = getAuditLogs();
    const projectLogs = allLogs.filter(log => log.entityId === project.id);
    
    if (filter === 'all') return projectLogs;
    return projectLogs.filter(log => log.action === filter);
  }, [project.id, filter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getActionColor = (action: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Histórico de Mudanças</h3>
        <div className="flex gap-2">
          {(['all', 'CREATE', 'UPDATE', 'DELETE'] as const).map(action => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === action
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {action === 'all' ? 'Todos' : action}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div
              key={index}
              className="p-4 bg-surface border border-surface-border rounded-lg hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getActionIcon(log.action)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-text-primary font-semibold">{log.entityName}</span>
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {formatRelativeTime(log.timestamp)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-text-secondary">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
              
              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-border">
                  <div className="text-sm text-text-secondary mb-2">Mudanças:</div>
                  <div className="space-y-1">
                    {log.changes && Object.entries(log.changes).map(([field, change]: [string, any]) => (
                      <div key={field} className="text-sm">
                        <span className="text-text-primary font-semibold">{field}:</span>
                        <span className="text-red-400 line-through ml-2">{change.old}</span>
                        <span className="text-green-400 ml-2">→ {change.new}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-secondary">
            Nenhum histórico disponível
          </div>
        )}
      </div>
    </div>
  );
};

