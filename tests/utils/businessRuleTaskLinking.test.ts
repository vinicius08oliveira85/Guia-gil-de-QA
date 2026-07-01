import { describe, expect, it } from 'vitest';
import {
  applyBusinessRuleTaskLinks,
  getLinkedBusinessRuleIdsForTask,
  linkTaskToBusinessRule,
  unlinkTaskFromBusinessRule,
} from '../../utils/businessRuleTaskLinking';
import type { Project } from '../../types';

const project = (): Project =>
  ({
    id: 'p1',
    name: 'P',
    description: '',
    documents: [],
    businessRules: [
      {
        id: 'r1',
        title: 'RN-Mapa',
        createdAt: '2024-01-01',
        linkedTaskIds: ['T-1'],
      },
      {
        id: 'r2',
        title: 'RN-Outra',
        createdAt: '2024-01-02',
        linkedTaskIds: [],
      },
    ],
    tasks: [
      { id: 'T-1', title: 'Task 1', status: 'To Do', testCases: [], type: 'Tarefa' },
      { id: 'T-2', title: 'Task 2', status: 'To Do', testCases: [], type: 'Tarefa' },
    ],
    phases: [],
  }) as Project;

describe('businessRuleTaskLinking', () => {
  it('getLinkedBusinessRuleIdsForTask resolve vínculo bidirecional', () => {
    const p = project();
    expect(getLinkedBusinessRuleIdsForTask(p, { id: 'T-1' })).toContain('r1');
    expect(getLinkedBusinessRuleIdsForTask(p, { id: 'T-2' })).toEqual([]);
  });

  it('linkTaskToBusinessRule vincula sem remover a regra', () => {
    const p = project();
    const next = linkTaskToBusinessRule(p, 'T-2', 'r2');
    expect(next.businessRules.find(r => r.id === 'r2')?.linkedTaskIds).toContain('T-2');
    expect(next.tasks.find(t => t.id === 'T-2')?.linkedBusinessRuleIds).toContain('r2');
    expect(next.businessRules).toHaveLength(2);
  });

  it('unlinkTaskFromBusinessRule desvincula mas mantém a regra', () => {
    const p = project();
    const next = unlinkTaskFromBusinessRule(p, 'T-1', 'r1');
    expect(next.businessRules.find(r => r.id === 'r1')?.linkedTaskIds ?? []).not.toContain('T-1');
    expect(getLinkedBusinessRuleIdsForTask(next, { id: 'T-1' })).not.toContain('r1');
    expect(next.businessRules).toHaveLength(2);
  });

  it('applyBusinessRuleTaskLinks sincroniza tasks ao atualizar regra', () => {
    const p = project();
    const next = applyBusinessRuleTaskLinks(p, 'r2', ['T-1', 'T-2']);
    expect(next.businessRules.find(r => r.id === 'r2')?.linkedTaskIds?.sort()).toEqual([
      'T-1',
      'T-2',
    ]);
    expect(next.tasks.find(t => t.id === 'T-2')?.linkedBusinessRuleIds).toContain('r2');
  });
});
