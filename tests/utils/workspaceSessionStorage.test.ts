import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getAdjacentOpenTaskId,
  loadWorkspaceSession,
  readWorkspaceTabFromUrl,
  saveWorkspaceSession,
  workspaceSessionStorageKey,
} from '../../utils/workspaceSessionStorage';

describe('workspaceSessionStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('location', {
      ...window.location,
      search: '',
    });
  });

  it('gera chave estável por escopo e id', () => {
    expect(workspaceSessionStorageKey('project', 'p1')).toBe('qa-workspace-session:project:p1');
    expect(workspaceSessionStorageKey('jira-solus', 'GDPI')).toBe(
      'qa-workspace-session:jira-solus:GDPI'
    );
  });

  it('salva e carrega sessão do projeto', () => {
    saveWorkspaceSession('project', 'p1', {
      activeTab: 'task:T-1',
      openTaskTabIds: ['T-1', 'T-2'],
      tasksListMode: 'backlog',
      taskSections: { 'T-1': 'tests' },
    });

    const loaded = loadWorkspaceSession('project', 'p1', 'dashboard');
    expect(loaded.activeTab).toBe('task:T-1');
    expect(loaded.openTaskTabIds).toEqual(['T-1', 'T-2']);
    expect(loaded.tasksListMode).toBe('backlog');
    expect(loaded.taskSections).toEqual({ 'T-1': 'tests' });
  });

  it('ignora abas inválidas ao carregar', () => {
    localStorage.setItem(
      workspaceSessionStorageKey('project', 'p1'),
      JSON.stringify({
        activeTab: 'invalid-tab',
        openTaskTabIds: ['T-1'],
      })
    );

    const loaded = loadWorkspaceSession('project', 'p1', 'dashboard');
    expect(loaded.activeTab).toBe('dashboard');
  });

  it('lê aba da URL', () => {
    vi.stubGlobal('location', {
      ...window.location,
      search: '?project=p1&tab=task:GDPI-123',
    });
    expect(readWorkspaceTabFromUrl()).toBe('task:GDPI-123');
  });

  it('navega entre tarefas abertas em ordem circular', () => {
    const ids = ['A', 'B', 'C'];
    expect(getAdjacentOpenTaskId(ids, 'A', 'next')).toBe('B');
    expect(getAdjacentOpenTaskId(ids, 'C', 'next')).toBe('A');
    expect(getAdjacentOpenTaskId(ids, 'B', 'prev')).toBe('A');
    expect(getAdjacentOpenTaskId(ids, 'A', 'prev')).toBe('C');
    expect(getAdjacentOpenTaskId(['A'], 'A', 'next')).toBeNull();
  });
});
