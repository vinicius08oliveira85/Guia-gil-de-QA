import { ExportSchedule } from '../types';
import { getAllProjects } from '../services/dbService';
import {
  exportProjectToJSON,
  exportProjectToCSV,
  generateProjectReport,
  downloadFile,
} from './exportService';
import { saveProjectToSupabase } from '../services/supabaseService';
import { createNotification } from './notificationService';
import { getNotificationPreferences } from './preferencesService';
import { logger } from './logger';

let schedulerInterval: NodeJS.Timeout | null = null;
let lastRunDate: string | null = null;

const shouldRunNow = (schedule: ExportSchedule): boolean => {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  const today = now.toDateString();

  // Check if we already ran today
  if (lastRunDate === today) {
    return false;
  }

  // Check if current time matches scheduled time (within 1 minute tolerance)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledMinutes = hours * 60 + minutes;
  const diff = Math.abs(currentMinutes - scheduledMinutes);

  if (diff > 1) {
    return false;
  }

  // Check frequency
  switch (schedule.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return now.getDay() === 1; // Monday
    case 'monthly':
      return now.getDate() === 1; // First day of month
    default:
      return false;
  }
};

const executeScheduledExport = async (schedule: ExportSchedule): Promise<void> => {
  try {
    const projects = await getAllProjects();
    if (projects.length === 0) {
      return;
    }

    // Export all projects
    for (const project of projects) {
      let exportContent: string;
      let filename: string;
      let mimeType: string;

      const dateStr = new Date().toISOString().split('T')[0];

      switch (schedule.format) {
        case 'json':
          exportContent = exportProjectToJSON(project);
          filename = `${project.name}_${dateStr}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          exportContent = exportProjectToCSV(project);
          filename = `${project.name}_${dateStr}.csv`;
          mimeType = 'text/csv';
          break;
        case 'markdown':
          exportContent = generateProjectReport(project);
          filename = `${project.name}_${dateStr}.md`;
          mimeType = 'text/markdown';
          break;
      }

      if (schedule.destination === 'download') {
        downloadFile(exportContent, filename, mimeType);
      } else if (schedule.destination === 'supabase') {
        // For Supabase, we could save the export as a document or in a separate table
        // For now, we'll just save the project itself
        await saveProjectToSupabase(project);
      }
    }

    // Mark as run today
    lastRunDate = new Date().toDateString();

    // Send notification if enabled
    if (schedule.notifyOnComplete) {
      const notificationPrefs = getNotificationPreferences();
      if (notificationPrefs.taskCompleted) {
        createNotification({
          type: 'task_completed',
          title: 'Exportação Automática Concluída',
          message: `Exportação automática de ${projects.length} projeto(s) foi concluída com sucesso`,
          projectId: projects[0]?.id || '',
          projectName: projects[0]?.name || 'Todos os Projetos',
        });
      }
    }
  } catch (error) {
    logger.error('Error executing scheduled export', 'exportScheduler', error);
    const notificationPrefs = getNotificationPreferences();
    if (notificationPrefs.testFailed) {
      createNotification({
        type: 'test_failed',
        title: 'Erro na Exportação Automática',
        message: `Falha ao executar exportação automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        projectId: '',
        projectName: 'Sistema',
      });
    }
  }
};

export const startExportScheduler = (schedule: ExportSchedule): void => {
  stopExportScheduler(); // Clear any existing scheduler

  if (!schedule.enabled) {
    return;
  }

  // Check every minute if it's time to run
  schedulerInterval = setInterval(() => {
    if (shouldRunNow(schedule)) {
      executeScheduledExport(schedule);
    }
  }, 60000); // Check every minute

  // Also check immediately in case we're already at the scheduled time
  if (shouldRunNow(schedule)) {
    executeScheduledExport(schedule);
  }
};

export const stopExportScheduler = (): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};
