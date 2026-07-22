import { describe, it, expect } from 'vitest';
import { hasTaskChanges, buildStatusSnapshot } from '../../services/jira/syncValidator';
import type { JiraTask } from '../../types';

describe('syncValidator', () => {
  describe('hasTaskChanges', () => {
    const baseTask: JiraTask = {
      id: 'PROJ-1',
      title: 'Tarefa original',
      description: 'Descrição',
      status: 'To Do',
      jiraStatus: 'To Do',
      type: 'Tarefa',
      priority: 'Média',
      createdAt: '2025-01-01T00:00:00.000Z',
      tags: [],
      testCases: [],
      bddScenarios: [],
    };

    it('retorna false quando não há mudanças', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask })).toBe(false);
    });

    it('detecta mudança no título', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask, title: 'Novo título' })).toBe(true);
    });

    it('detecta mudança no jiraStatus', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask, jiraStatus: 'In Progress' })).toBe(true);
    });

    it('detecta mudança no assignee', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask, assignee: 'QA' })).toBe(true);
    });

    it('detecta mudança nos tags', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask, tags: ['novo'] })).toBe(true);
    });

    it('detecta mudança no epicKey', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask, epicKey: 'EPIC-1' })).toBe(true);
    });

    it('detecta mudança no parentId', () => {
      expect(hasTaskChanges(baseTask, { ...baseTask, parentId: 'PROJ-2' })).toBe(true);
    });
  });

  describe('buildStatusSnapshot', () => {
    it('constrói snapshot correto', () => {
      const tasks: JiraTask[] = [
        {
          id: 'PROJ-1',
          title: 'T1',
          status: 'To Do',
          jiraStatus: 'To Do',
          type: 'Tarefa',
          priority: 'Média',
          createdAt: '2025-01-01T00:00:00.000Z',
          tags: [],
          testCases: [
            { id: 'tc-1', title: 'TC1', status: 'Pass', action: '', expectedResult: 'R' },
            { id: 'tc-2', title: 'TC2', status: 'Fail', action: '', expectedResult: 'R' },
          ],
          bddScenarios: [],
        },
      ];

      const snapshot = buildStatusSnapshot(tasks);
      expect(snapshot.size).toBe(2);
      expect(snapshot.get('PROJ-1||tc-1')?.status).toBe('Pass');
      expect(snapshot.get('PROJ-1||tc-2')?.status).toBe('Fail');
    });

    it('ignora testCases com status Not Run', () => {
      const tasks: JiraTask[] = [
        {
          id: 'PROJ-1',
          title: 'T1',
          status: 'To Do',
          jiraStatus: 'To Do',
          type: 'Tarefa',
          priority: 'Média',
          createdAt: '2025-01-01T00:00:00.000Z',
          tags: [],
          testCases: [
            { id: 'tc-1', title: 'TC1', status: 'Not Run', action: '', expectedResult: 'R' },
          ],
          bddScenarios: [],
        },
      ];

      const snapshot = buildStatusSnapshot(tasks);
      expect(snapshot.size).toBe(0);
    });
  });
});
