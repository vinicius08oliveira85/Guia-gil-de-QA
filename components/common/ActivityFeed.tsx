import React, { useMemo } from 'react';
import { Project } from '../../types'; // Assumindo que AuditLog está definido em '../../types'
import { getAuditLogs } from '../../utils/auditLog';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Badge } from './Badge';
import ActivityItem, { EnrichedAuditLog } from './ActivityItem'; // Importa o novo componente e tipo

interface ActivityFeedProps {
  project: Project;
  limit?: number;
}

// Funções puras movidas para fora do componente para evitar re-criação em cada render
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

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ project, limit = 20 }) => {
  const activities = useMemo(() => {
    // Cria um Map para lookup eficiente de tarefas (O(1))
    const taskMap = new Map(project.tasks.map(task => [task.id, task]));

    const logs = getAuditLogs(); // Assumindo que getAuditLogs é performático ou memoizado externamente
    const projectLogs: EnrichedAuditLog[] = logs
      .filter(log => log.entityId === project.id || taskMap.has(log.entityId)) // Usa taskMap para lookup rápido
      .slice(0, limit)
      .map(log => {
        const task = taskMap.get(log.entityId); // Usa taskMap para lookup rápido
        return {
          ...log,
          taskTitle: task?.title,
          taskId: task?.id
        };
      });

    return projectLogs;
  }, [project.id, project.tasks, limit]); // Depende de project.id e project.tasks (via taskMap)

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Feed de Atividades</h3>
      {activities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => ( // activity.id deve ser sempre único
            <ActivityItem
              key={activity.id}
              activity={activity}
              getActivityIcon={getActivityIcon}
              getActivityColor={getActivityColor}
            />
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
