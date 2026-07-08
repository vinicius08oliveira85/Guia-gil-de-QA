import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { getAuditLogs } from '../../utils/auditLog';
import { formatDateTime, formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';
import {
  appNeuListRowClass,
  neuBrandTextMutedClass,
  neuBrandTextStrongClass,
  neuDividerClass,
} from './neuUi';
import { cn } from '../../utils/cn';

interface ChangeHistoryProps {
  project: Project;
}

export const ChangeHistory: React.FC<ChangeHistoryProps> = ({ project }) => {
  const [filter, setFilter] = useState<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all');

  const logs = useMemo(() => {
    const allLogs = getAuditLogs();
    const projectLogs = allLogs.filter(log => log.entityId === project.id);

    if (filter === 'all') return projectLogs;
    return projectLogs.filter(log => log.action === filter);
  }, [project.id, filter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '➕';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className={cn('text-lg font-semibold', neuBrandTextStrongClass)}>
          Histórico de Mudanças
        </h3>
        <div className="flex flex-wrap gap-2">
          {(['all', 'CREATE', 'UPDATE', 'DELETE'] as const).map(action => (
            <button
              key={action}
              type="button"
              onClick={() => setFilter(action)}
              className={cn(
                'leve-neu-pill px-3 py-1 text-sm font-semibold transition-[box-shadow,color] duration-200',
                filter === action
                  ? 'leve-neu-pill-active text-base-content'
                  : 'text-base-content/72 hover:text-primary'
              )}
              aria-pressed={filter === action}
            >
              {action === 'all' ? 'Todos' : action}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto custom-scrollbar">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className={cn(appNeuListRowClass, 'flex-col items-stretch')}>
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {getActionIcon(log.action)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                      <span className={cn('font-semibold', neuBrandTextStrongClass)}>
                        {log.entityName}
                      </span>
                    </div>
                    <div className={cn('mt-1 text-sm', neuBrandTextMutedClass)}>
                      {formatRelativeTime(log.timestamp)}
                    </div>
                  </div>
                </div>
                <span className={cn('text-xs', neuBrandTextMutedClass)}>
                  {formatDateTime(log.timestamp)}
                </span>
              </div>

              {log.changes && Object.keys(log.changes).length > 0 ? (
                <div className={cn('mt-3 w-full border-t pt-3', neuDividerClass)}>
                  <div className={cn('mb-2 text-sm', neuBrandTextMutedClass)}>Mudanças:</div>
                  <div className="space-y-1">
                    {Object.entries(log.changes).map(([field, change]: [string, { old?: string; new?: string }]) => (
                      <div key={field} className="text-sm">
                        <span className={cn('font-semibold', neuBrandTextStrongClass)}>{field}:</span>
                        <span className="ml-2 text-red-400 line-through">{change.old}</span>
                        <span className="ml-2 text-green-400">→ {change.new}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className={cn('py-8 text-center', neuBrandTextMutedClass)}>
            Nenhum histórico disponível
          </div>
        )}
      </div>
    </div>
  );
};
