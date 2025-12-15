import { Project, JiraTask, TestCase } from '../types';
import { getNotificationPreferences } from './preferencesService';

export interface Notification {
  id: string;
  type: 'bug_created' | 'test_failed' | 'deadline' | 'task_assigned' | 'comment_added' | 'task_completed' | 'dependency_resolved';
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  entityId?: string;
  entityType?: 'task' | 'testcase' | 'bug';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const STORAGE_KEY = 'qa_notifications';

const shouldCreateNotification = (type: Notification['type']): boolean => {
  const prefs = getNotificationPreferences();
  switch (type) {
    case 'bug_created':
      return prefs.bugCreated;
    case 'test_failed':
      return prefs.testFailed;
    case 'deadline':
      return prefs.deadlineApproaching;
    case 'task_assigned':
      return prefs.taskAssigned;
    case 'comment_added':
      return prefs.commentAdded;
    case 'task_completed':
      return prefs.taskCompleted;
    default:
      return true;
  }
};

export const createNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification | null => {
  // Check preferences before creating notification
  if (!shouldCreateNotification(notification.type)) {
    return null;
  }

  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    read: false,
    createdAt: new Date().toISOString()
  };

  const notifications = getNotifications();
  notifications.unshift(newNotification);

  // Manter apenas os últimos 100 notificações
  if (notifications.length > 100) {
    notifications.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  
  // Disparar evento customizado para notificar componentes
  window.dispatchEvent(new CustomEvent('notification-created', { detail: newNotification }));
  
  return newNotification;
};

export const getNotifications = (): Notification[] => {
  try {
    const notifications = localStorage.getItem(STORAGE_KEY);
    return notifications ? JSON.parse(notifications) : [];
  } catch {
    return [];
  }
};

export const getUnreadCount = (): number => {
  return getNotifications().filter(n => !n.read).length;
};

export const markAsRead = (notificationId: string) => {
  const notifications = getNotifications();
  const updated = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const markAllAsRead = () => {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deleteNotification = (notificationId: string) => {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Helpers para criar notificações específicas
export const notifyBugCreated = (bug: JiraTask, project: Project) => {
  return createNotification({
    type: 'bug_created',
    title: 'Novo Bug Criado',
    message: `Bug "${bug.id}" foi criado no projeto ${project.name}`,
    projectId: project.id,
    projectName: project.name,
    entityId: bug.id,
    entityType: 'bug'
  });
};

export const notifyTestFailed = (testCase: TestCase, task: JiraTask, project: Project) => {
  return createNotification({
    type: 'test_failed',
    title: 'Teste Falhou',
    message: `Caso de teste falhou na tarefa ${task.id}: ${testCase.description.substring(0, 50)}`,
    projectId: project.id,
    projectName: project.name,
    entityId: task.id,
    entityType: 'testcase'
  });
};

export const notifyTaskAssigned = (task: JiraTask, project: Project, _assignee: string) => {
  return createNotification({
    type: 'task_assigned',
    title: 'Tarefa Atribuída',
    message: `Tarefa ${task.id} foi atribuída a você`,
    projectId: project.id,
    projectName: project.name,
    entityId: task.id,
    entityType: 'task'
  });
};

export const notifyCommentAdded = (task: JiraTask, project: Project, author: string) => {
  return createNotification({
    type: 'comment_added',
    title: 'Novo Comentário',
    message: `${author} comentou na tarefa ${task.id}`,
    projectId: project.id,
    projectName: project.name,
    entityId: task.id,
    entityType: 'task'
  });
};

export const notifyDependencyResolved = (task: JiraTask, project: Project, dependentTask: JiraTask) => {
  return createNotification({
    type: 'dependency_resolved',
    title: 'Dependência Resolvida',
    message: `A tarefa ${dependentTask.id} está pronta para ser iniciada. A dependência ${task.id} foi concluída.`,
    projectId: project.id,
    projectName: project.name,
    entityId: dependentTask.id,
    entityType: 'task'
  });
};

