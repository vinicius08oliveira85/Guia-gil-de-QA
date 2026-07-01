import { describe, expect, it } from 'vitest';
import {
  applyBusinessRuleTaskLinks,
  getLinkedBusinessRuleIdsForTask,
  isBusinessRuleLinkedToTask,
  toggleBusinessRuleTaskLink,
} from '../../utils/businessRuleTaskLinking';
import type { BusinessRule, JiraTask, Project } from '../../types';

const task = (id: string): JiraTask =>
  ({
    id,
    title: `Task ${id}`,
    status: 'To Do',
    testCases: [],
    type: 'Tarefa',
  }) as JiraTask;

const rule = (id: string, linkedTaskIds: string[] = []): BusinessRule =>
  ({
    id,
    title: `RN-${id}`,
    createdAt: '2024-01-01T00:00:00.000Z',
    linkedTaskIds,
  }) as BusinessRule;

const project = (tasks: JiraTask[], rules: BusinessRule[]): Project =>
  ({
    id: 'p1',
    name: 'P',
    description: '',
    documents: [],
    businessRules: rules,
    tasks,
    phases: [],
  }) as Project;

describe('businessRuleTaskLinking — seleção na task', () => {
  it('isBusinessRuleLinkedToTask detecta vínculo bidirecional', () => {
    const t = task('GDPI-1');
    const r = rule('r1', ['GDPI-1']);
    expect(isBusinessRuleLinkedToTask(t, r)).toBe(true);

    const t2 = { ...t, linkedBusinessRuleIds: ['r2'] };
    const r2 = rule('r2');
    expect(isBusinessRuleLinkedToTask(t2, r2)).toBe(true);
  });

  it('getLinkedBusinessRuleIdsForTask une ids diretos e reverso', () => {
    const t = task('GDPI-1');
    const p = project(
      [t],
      [rule('r1', ['GDPI-1']), rule('r2'), { ...rule('r3'), linkedTaskIds: [] }]
    );
    const withDirect = { ...t, linkedBusinessRuleIds: ['r3'] };
    expect(getLinkedBusinessRuleIdsForTask(withDirect, p).sort()).toEqual(['r1', 'r3']);
  });

  it('toggleBusinessRuleTaskLink vincula e desvincula task na regra', () => {
    const t = task('GDPI-99');
    const r = rule('r1');
    const p = project([t], [r]);

    const linked = toggleBusinessRuleTaskLink(p, 'GDPI-99', 'r1', true);
    expect(linked.businessRules[0].linkedTaskIds).toContain('GDPI-99');
    expect(linked.tasks[0].linkedBusinessRuleIds).toContain('r1');

    const unlinked = toggleBusinessRuleTaskLink(linked, 'GDPI-99', 'r1', false);
    expect(unlinked.businessRules[0].linkedTaskIds ?? []).not.toContain('GDPI-99');
    expect(unlinked.tasks[0].linkedBusinessRuleIds ?? []).not.toContain('r1');
  });

  it('applyBusinessRuleTaskLinks mantém sincronismo bidirecional', () => {
    const p = project([task('A'), task('B')], [rule('r1')]);
    const next = applyBusinessRuleTaskLinks(p, 'r1', ['A', 'B']);
    expect(next.businessRules[0].linkedTaskIds).toEqual(['A', 'B']);
    expect(next.tasks.find(t => t.id === 'A')?.linkedBusinessRuleIds).toContain('r1');
    expect(next.tasks.find(t => t.id === 'B')?.linkedBusinessRuleIds).toContain('r1');
  });
});
