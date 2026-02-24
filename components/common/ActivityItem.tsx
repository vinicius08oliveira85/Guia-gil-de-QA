import React from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';
import type { AuditLogEntry } from '../../utils/auditLog';

export interface EnrichedAuditLog extends AuditLogEntry {
  taskTitle?: string;
  taskId?: string;
}

interface ActivityItemProps {
  activity: EnrichedAuditLog;
  // Funções passadas como props para evitar re-criação no componente pai
  getActivityIcon: (action: string) => React.ReactNode;
  getActivityColor: (action: string) => 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  style?: React.CSSProperties;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, getActivityIcon, getActivityColor, className, style }) => {
  const actionColor = getActivityColor(activity.action);

  // Helper para cor de fundo do ícone baseado na ação
  const getIconStyles = (variant: string) => {
    switch (variant) {
      case 'success': return 'bg-success/15 text-success border-success/20';
      case 'info': return 'bg-info/15 text-info border-info/20';
      case 'error': return 'bg-error/15 text-error border-error/20';
      case 'warning': return 'bg-warning/15 text-warning border-warning/20';
      default: return 'bg-base-200 text-base-content/70 border-base-300';
    }
  };

  // Helper para borda lateral baseada na ação
  const getBorderColor = (variant: string) => {
    switch (variant) {
      case 'success': return 'border-l-success';
      case 'info': return 'border-l-info';
      case 'error': return 'border-l-error';
      case 'warning': return 'border-l-warning';
      default: return 'border-l-base-300';
    }
  };

  return (
    <div 
      className={`group relative p-4 bg-surface border border-surface-border border-l-4 ${getBorderColor(actionColor)} rounded-xl hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden ${className || ''}`}
      style={style}
    >
      <div className="flex items-start gap-4">
        {/* Ícone com container estilizado */}
        <div className={`
          flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border
          ${getIconStyles(actionColor)}
          transition-transform duration-200 group-hover:scale-105
        `}>
          {getActivityIcon(activity.action)}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Cabeçalho: Entidade e Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-text-primary truncate" title={activity.entityName}>
                {activity.entityName}
              </span>
              <Badge variant={actionColor} size="sm" className="flex-shrink-0 shadow-sm">
                {activity.action}
              </Badge>
            </div>
            <span className="text-xs text-text-tertiary whitespace-nowrap font-medium">
              {formatRelativeTime(activity.timestamp)}
            </span>
          </div>

          {/* Contexto da Tarefa */}
          {activity.taskTitle && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium truncate opacity-90">
                <span className="font-mono bg-base-200 px-1.5 py-0.5 rounded text-[10px] tracking-wide mr-1.5">{activity.taskId}</span>{activity.taskTitle}
              </span>
            </div>
          )}

          {/* Detalhes das Alterações */}
          {activity.changes && Object.keys(activity.changes).length > 0 && (
            <div className="mt-2 text-xs bg-base-200/50 border border-base-200 rounded-md p-2 text-text-secondary group-hover:bg-base-200/80 transition-colors">
              <span className="font-semibold opacity-80">Alterações: </span>
              <span className="opacity-90">
                {Object.keys(activity.changes).slice(0, 3).join(', ')}
              </span>
              {Object.keys(activity.changes).length > 3 && (
                <span className="opacity-60 ml-1">
                  +{Object.keys(activity.changes).length - 3} outros
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoiza o componente para evitar re-renderizações desnecessárias se as props não mudarem
export default React.memo(ActivityItem);