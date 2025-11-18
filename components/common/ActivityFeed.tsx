import React, { useMemo } from 'react';
import { Project } from '../../types';
import { getAuditLogs } from '../../utils/auditLog';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';

interface ActivityFeedProps {
  project: Project;
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ project, limit = 20 }) => {
  const activities = useMemo(() => {
    const logs = getAuditLogs();
    const projectLogs = logs
      .filter(log => log.entityId === project.id || project.tasks.some(t => t.id === log.entityId))
      .slice(0, limit)
      .map(log => {
        const task = project.tasks.find(t => t.id === log.entityId);
        return {
          ...log,
          taskTitle: task?.title,
          taskId: task?.id
        };
      });
    
    return projectLogs;
  }, [project, limit]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getActivityColor = (action: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Feed de Atividades</h3>
      {activities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={activity.id || index}
              className="p-3 bg-surface border border-surface-border rounded-lg hover:bg-surface-hover transition-colors"
            >
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
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          Nenhuma atividade recente
        </div>
      )}
    </div>
  );
};

