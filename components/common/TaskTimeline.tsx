import React, { useMemo } from 'react';
import { Project, JiraTask } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';

interface TaskTimelineProps {
  project: Project;
  taskId?: string;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ project, taskId }) => {
  const timeline = useMemo(() => {
    const logs = require('../../utils/auditLog').getAuditLogs();
    const relevantLogs = logs
      .filter((log: any) => {
        if (taskId) {
          return log.entityId === taskId;
        }
        return project.tasks.some(t => t.id === log.entityId);
      })
      .sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 50);

    return relevantLogs.map((log: any, index: number) => {
      const task = project.tasks.find(t => t.id === log.entityId);
      return {
        ...log,
        task,
        index
      };
    });
  }, [project, taskId]);

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getEventColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500';
      case 'UPDATE': return 'bg-blue-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">
        {taskId ? 'Linha do Tempo da Tarefa' : 'Linha do Tempo do Projeto'}
      </h3>
      
      {timeline.length > 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-border"></div>
          
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event.id || index} className="relative flex items-start gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full ${getEventColor(event.action)} flex items-center justify-center text-white text-sm`}>
                  {getEventIcon(event.action)}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="p-3 bg-surface border border-surface-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={event.action === 'CREATE' ? 'success' : event.action === 'UPDATE' ? 'info' : 'error'}>
                        {event.action}
                      </Badge>
                      <span className="text-sm font-semibold text-text-primary">
                        {event.entityName}
                      </span>
                    </div>
                    
                    {event.task && (
                      <div className="text-sm text-text-secondary mb-2">
                        {event.task.title}
                      </div>
                    )}
                    
                    {event.changes && Object.keys(event.changes).length > 0 && (
                      <div className="text-xs text-text-secondary space-y-1">
                        {event.changes && Object.entries(event.changes).slice(0, 3).map(([field, change]: [string, any]) => (
                          <div key={field}>
                            <span className="font-semibold">{field}:</span>
                            <span className="text-red-400 line-through ml-1">{change.old}</span>
                            <span className="text-green-400 ml-1">→ {change.new}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-text-secondary mt-2">
                      {formatRelativeTime(event.timestamp)} • {formatDate(event.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          Nenhum evento registrado
        </div>
      )}
    </div>
  );
};

