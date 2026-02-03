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

// Helper para agrupar atividades por data relativa
const getRelativeDateGroup = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reseta a hora para uma comparação de data precisa
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const activityDate = new Date(date);
  activityDate.setHours(0, 0, 0, 0);

  if (activityDate.getTime() === today.getTime()) return 'Hoje';
  if (activityDate.getTime() === yesterday.getTime()) return 'Ontem';
  
  // Para outras datas, formata de forma legível
  return activityDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ project, limit = 20 }) => {
  const groupedActivities = useMemo(() => {
    // Cria um Map para lookup eficiente de tarefas (O(1))
    const taskMap = new Map(project.tasks.map(task => [task.id, task]));

    const logs = getAuditLogs(); // Assumindo que getAuditLogs é performático ou memoizado externamente
    const enrichedLogs: EnrichedAuditLog[] = logs
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

    // Agrupa os logs por data
    const grouped = enrichedLogs.reduce((acc, activity) => {
      const groupKey = getRelativeDateGroup(new Date(activity.timestamp));
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(activity);
      return acc;
    }, {} as Record<string, EnrichedAuditLog[]>);

    return grouped;
  }, [project.id, project.tasks, limit]); // Depende de project.id e project.tasks (via taskMap)

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Feed de Atividades</h3>
      {Object.keys(groupedActivities).length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Object.entries(groupedActivities).map(([dateGroup, activitiesInGroup]) => (
            <div key={dateGroup} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60 pt-2">
                {dateGroup}
              </p>
              {activitiesInGroup.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  getActivityIcon={getActivityIcon}
                  getActivityColor={getActivityColor}
                />
              ))}
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
