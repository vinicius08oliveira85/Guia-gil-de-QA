import React from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';
import { AuditLog } from '../../types'; // Assumindo que AuditLog está definido em '../../types'

interface ActivityItemProps {
  activity: AuditLog & { taskTitle?: string; taskId?: string };
  // Funções passadas como props para evitar re-criação no componente pai
  getActivityIcon: (action: string) => string;
  getActivityColor: (action: string) => 'default' | 'success' | 'warning' | 'error' | 'info';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, getActivityIcon, getActivityColor }) => {
  return (
    <div className="p-3 bg-surface border border-surface-border rounded-lg hover:bg-surface-hover transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getActivityIcon(activity.action)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getActivityColor(activity.action)} size="sm">
              {activity.action}
            </Badge>
            <span className="text-sm font-semibold text-text-primary">
              {activity.entityName}
            </span>
          </div>
          {activity.taskTitle && (
            <p className="text-sm text-text-secondary truncate mb-1">
              {activity.taskTitle}
            </p>
          )}
          {activity.changes && Object.keys(activity.changes).length > 0 && (
            <div className="text-xs text-text-secondary mt-1">
              {/* Exibe as duas primeiras chaves de mudança, com elipses se houver mais */}
              {Object.keys(activity.changes).slice(0, 2).join(', ')}
              {Object.keys(activity.changes).length > 2 && '...'}
            </div>
          )}
          <div className="text-xs text-text-secondary mt-1">
            {formatRelativeTime(activity.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoiza o componente para evitar re-renderizações desnecessárias se as props não mudarem
export default React.memo(ActivityItem);