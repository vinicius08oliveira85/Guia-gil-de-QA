import type { Project } from '../types';
import { mergeJiraSyncedTaskFields } from './jiraTaskSyncMirror';

/**
 * Propaga atualizações Jira para outros projetos locais que compartilham as mesmas issue keys
 * (ex.: mesmo backlog em Projeto QA e Projeto Dev).
 */
export function propagateJiraTaskUpdatesToLinkedProjects(
  sourceProject: Project,
  allProjects: Project[]
): Project[] {
  const syncedById = new Map(sourceProject.tasks.map(task => [task.id, task]));
  if (syncedById.size === 0) return allProjects;

  return allProjects.map(project => {
    if (project.id === sourceProject.id) return sourceProject;

    let changed = false;
    const tasks = project.tasks.map(task => {
      const synced = syncedById.get(task.id);
      if (!synced) return task;

      const merged = mergeJiraSyncedTaskFields(task, synced);
      const same =
        merged.status === task.status &&
        merged.jiraStatus === task.jiraStatus &&
        merged.title === task.title &&
        merged.description === task.description &&
        merged.priority === task.priority &&
        merged.jiraPriority === task.jiraPriority &&
        merged.parentId === task.parentId &&
        merged.completedAt === task.completedAt;

      if (same) return task;
      changed = true;
      return merged;
    });

    return changed ? { ...project, tasks } : project;
  });
}
