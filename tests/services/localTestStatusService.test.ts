import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Project, TestCase } from '../types';

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Projeto',
    description: '',
    documents: [],
    businessRules: [],
    tasks: [
      {
        id: 'GDPI-1',
        title: 'Task',
        description: '',
        type: 'Task',
        status: 'To Do',
        testCases: [
          { id: 'tc1', title: 'C1', steps: [], status: 'Passed' } as TestCase,
        ],
      },
    ],
    phases: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

vi.mock('../../services/dbService', () => ({
  loadProjectsFromIndexedDB: vi.fn(async () => mockProjects),
}));

import { loadTestStatusesByJiraKeys } from '../../services/localTestStatusService';

describe('localTestStatusService', () => {
  it('retorna testCases por chave Jira válida', async () => {
    const map = await loadTestStatusesByJiraKeys(['GDPI-1', 'invalid']);
    expect(map.size).toBe(1);
    expect(map.get('GDPI-1')?.[0]?.status).toBe('Passed');
  });

  it('retorna mapa vazio sem chaves válidas', async () => {
    const map = await loadTestStatusesByJiraKeys(['foo']);
    expect(map.size).toBe(0);
  });
});
