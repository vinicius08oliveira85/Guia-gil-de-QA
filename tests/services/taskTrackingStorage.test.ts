import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  FILAS_JIRA_STATUSES_BY_PROJECT_KEY,
  FILAS_JIRA_STATUSES_STORAGE_KEY,
  FILAS_PROJECT_STORAGE_KEY,
  FILAS_QUEUE_STORAGE_KEY,
  FILAS_SLA_RISK_WINDOW_STORAGE_KEY,
  FILAS_TASKS_STORAGE_KEY,
  readTaskTrackingSnapshot,
  restoreTaskTrackingFromBackup,
  writeTaskTrackingSnapshot,
  persistTaskTrackingPartial,
  TASK_TRACKING_RESTORED_EVENT,
  TASK_TRACKING_UPDATED_EVENT,
  dispatchTaskTrackingUpdated,
} from '../../services/taskTrackingStorage';
import { DEFAULT_SLA_RISK_WINDOW_HOURS } from '../../utils/jiraFilasMetrics';

describe('taskTrackingStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('lê snapshot vazio quando não há dados persistidos', () => {
    expect(readTaskTrackingSnapshot()).toEqual({
      selectedProjectKey: '',
      queueSelection: null,
      tasks: [],
      slaRiskWindowHours: DEFAULT_SLA_RISK_WINDOW_HOURS,
      jiraStatuses: [],
      activeProjectFilter: 'all',
      importedProjectKeys: [],
      jiraStatusesByProject: {},
    });
  });

  it('grava e lê snapshot completo com filtro por projeto', () => {
    writeTaskTrackingSnapshot({
      selectedProjectKey: 'SUS',
      queueSelection: { projectKey: 'SUS', queueId: '42' },
      tasks: [
        { id: 'SUS-1', title: 'Tarefa', type: 'Tarefa', status: 'To Do' },
        { id: 'ME-1', title: 'Outra', type: 'Tarefa', status: 'To Do' },
      ],
      slaRiskWindowHours: 72,
      jiraStatuses: [{ name: 'Escalated', color: '#0052cc' }],
      activeProjectFilter: 'SUS',
      importedProjectKeys: ['ME', 'SUS'],
      jiraStatusesByProject: {
        SUS: [{ name: 'Escalated', color: '#0052cc' }],
        ME: [{ name: 'Aberto', color: '#42526e' }],
      },
    });

    const snapshot = readTaskTrackingSnapshot();
    expect(snapshot.activeProjectFilter).toBe('SUS');
    expect(snapshot.importedProjectKeys).toEqual(['ME', 'SUS']);
    expect(snapshot.jiraStatusesByProject.ME).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(FILAS_JIRA_STATUSES_BY_PROJECT_KEY)!)).toHaveProperty('SUS');
  });

  it('grava e lê snapshot completo', () => {
    writeTaskTrackingSnapshot({
      selectedProjectKey: 'SUS',
      queueSelection: { projectKey: 'SUS', queueId: '42' },
      tasks: [{ id: 'SUS-1', title: 'Tarefa', type: 'Tarefa', status: 'To Do' }],
      slaRiskWindowHours: 72,
      jiraStatuses: [{ name: 'Escalated', color: '#0052cc' }],
      activeProjectFilter: 'all',
      importedProjectKeys: ['SUS'],
      jiraStatusesByProject: { SUS: [{ name: 'Escalated', color: '#0052cc' }] },
    });

    expect(readTaskTrackingSnapshot()).toEqual({
      selectedProjectKey: 'SUS',
      queueSelection: {
        projectKey: 'SUS',
        projectKeys: ['SUS'],
        queueCategories: [],
        queueStatuses: [],
        queueId: '42',
        queueIds: ['42'],
      },
      tasks: [{ id: 'SUS-1', title: 'Tarefa', type: 'Tarefa', status: 'To Do' }],
      slaRiskWindowHours: 72,
      jiraStatuses: [{ name: 'Escalated', color: '#0052cc' }],
      activeProjectFilter: 'all',
      importedProjectKeys: ['SUS'],
      jiraStatusesByProject: { SUS: [{ name: 'Escalated', color: '#0052cc' }] },
    });
    expect(sessionStorage.getItem(FILAS_PROJECT_STORAGE_KEY)).toBe('SUS');
    expect(JSON.parse(sessionStorage.getItem(FILAS_QUEUE_STORAGE_KEY)!)).toEqual({
      projectKey: 'SUS',
      projectKeys: ['SUS'],
      queueCategories: [],
      queueStatuses: [],
      queueId: '42',
      queueIds: ['42'],
    });
    expect(localStorage.getItem(FILAS_SLA_RISK_WINDOW_STORAGE_KEY)).toBe('72');
    expect(JSON.parse(localStorage.getItem(FILAS_TASKS_STORAGE_KEY)!)).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(FILAS_JIRA_STATUSES_STORAGE_KEY)!)).toEqual([
      { name: 'Escalated', color: '#0052cc' },
    ]);
  });

  it('persistTaskTrackingPartial mescla campos e dispara evento updated', () => {
    writeTaskTrackingSnapshot({
      selectedProjectKey: 'SUS',
      queueSelection: null,
      tasks: [{ id: 'SUS-1', title: 'A', type: 'Tarefa', status: 'To Do' }],
      slaRiskWindowHours: 48,
      jiraStatuses: [],
      activeProjectFilter: 'all',
      importedProjectKeys: ['SUS'],
      jiraStatusesByProject: {},
    });

    const handler = vi.fn();
    window.addEventListener(TASK_TRACKING_UPDATED_EVENT, handler);

    persistTaskTrackingPartial({
      tasks: [
        { id: 'SUS-1', title: 'A', type: 'Tarefa', status: 'In Progress' },
        { id: 'SUS-2', title: 'B', type: 'Tarefa', status: 'To Do' },
      ],
      jiraStatuses: [{ name: 'In Progress', color: '#0052cc' }],
    });

    expect(handler).toHaveBeenCalledOnce();
    const snapshot = readTaskTrackingSnapshot();
    expect(snapshot.tasks).toHaveLength(2);
    expect(snapshot.selectedProjectKey).toBe('SUS');
    expect(snapshot.slaRiskWindowHours).toBe(48);
    expect(snapshot.jiraStatuses).toEqual([{ name: 'In Progress', color: '#0052cc' }]);

    window.removeEventListener(TASK_TRACKING_UPDATED_EVENT, handler);
  });

  it('restaura backup e dispara evento de restauração', () => {
    const handler = vi.fn();
    window.addEventListener(TASK_TRACKING_RESTORED_EVENT, handler);

    const restored = restoreTaskTrackingFromBackup({
      selectedProjectKey: 'SOL',
      queueSelection: { projectKey: 'SOL', queueId: '7' },
      tasks: [{ id: 'SOL-99', title: 'X', type: 'Tarefa', status: 'Done' }],
      slaRiskWindowHours: 24,
    });

    expect(restored).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expect(readTaskTrackingSnapshot().tasks).toHaveLength(1);

    window.removeEventListener(TASK_TRACKING_RESTORED_EVENT, handler);
  });

  it('ignora tarefas inválidas no backup', () => {
    restoreTaskTrackingFromBackup({
      tasks: [{ foo: 'bar' }, { id: 'OK-1', title: 'Ok', type: 'Tarefa', status: 'To Do' }],
    });

    expect(readTaskTrackingSnapshot().tasks).toEqual([
      { id: 'OK-1', title: 'Ok', type: 'Tarefa', status: 'To Do' },
    ]);
  });

  it('restaura seleção de filas com categorias sem queueIds', () => {
    restoreTaskTrackingFromBackup({
      selectedProjectKey: 'SUS',
      queueSelection: {
        projectKey: 'SUS',
        projectKeys: ['SUS', 'ME'],
        queueCategories: ['Solus'],
        queueStatuses: ['Abertos'],
      },
      tasks: [],
      slaRiskWindowHours: 48,
    });

    const snapshot = readTaskTrackingSnapshot();
    expect(snapshot.queueSelection).toEqual({
      projectKey: 'SUS',
      projectKeys: ['SUS', 'ME'],
      queueCategories: ['Solus'],
      queueStatuses: ['Abertos'],
    });
  });
});
