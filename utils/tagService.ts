import { JiraTask, Project } from '../types';

export const DEFAULT_TAGS = [
  'crítico',
  'regressão',
  'smoke',
  'e2e',
  'automação',
  'manual',
  'performance',
  'segurança',
  'usabilidade',
  'api',
  'frontend',
  'backend',
  'mobile',
  'web'
] as const;

export const TAG_COLORS: Record<string, string> = {
  'crítico': '#ef4444',
  'regressão': '#f59e0b',
  'smoke': '#10b981',
  'e2e': '#3b82f6',
  'automação': '#8b5cf6',
  'manual': '#ec4899',
  'performance': '#f97316',
  'segurança': '#dc2626',
  'usabilidade': '#06b6d4',
  'api': '#6366f1',
  'frontend': '#14b8a6',
  'backend': '#64748b',
  'mobile': '#a855f7',
  'web': '#0ea5e9'
};

export const getTagColor = (tag: string): string => {
  return TAG_COLORS[tag.toLowerCase()] || '#64748b';
};

export const getAllTagsFromProject = (project: Project): string[] => {
  const tags = new Set<string>();
  
  project.tasks.forEach(task => {
    task.tags?.forEach(tag => tags.add(tag));
  });
  
  if (project.tags) {
    project.tags.forEach(tag => tags.add(tag));
  }
  
  return Array.from(tags).sort();
};

export const getTasksByTag = (tasks: JiraTask[], tag: string): JiraTask[] => {
  return tasks.filter(task => task.tags?.includes(tag));
};

export const addTagToTask = (task: JiraTask, tag: string): JiraTask => {
  const tags = task.tags || [];
  if (!tags.includes(tag)) {
    return { ...task, tags: [...tags, tag] };
  }
  return task;
};

export const removeTagFromTask = (task: JiraTask, tag: string): JiraTask => {
  return {
    ...task,
    tags: task.tags?.filter(t => t !== tag) || []
  };
};

