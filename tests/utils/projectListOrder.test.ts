import { describe, it, expect } from 'vitest';
import type { Project } from '../../types';
import {
  applyManualProjectOrder,
  buildProjectOrderIds,
  moveProjectIdInOrder,
} from '../../utils/projectListOrder';

const p = (id: string, name: string): Project =>
  ({
    id,
    name,
    tasks: [],
    documents: [],
    phases: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  }) as Project;

describe('projectListOrder', () => {
  it('applyManualProjectOrder reordena por ids e mantém desconhecidos no final', () => {
    const projects = [p('a', 'A'), p('b', 'B'), p('c', 'C')];
    const ordered = applyManualProjectOrder(projects, ['c', 'a']);
    expect(ordered.map(x => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('moveProjectIdInOrder move card da posição 1 para 0', () => {
    const base = ['x', 'y', 'z'];
    expect(moveProjectIdInOrder(base, 'y', 0)).toEqual(['y', 'x', 'z']);
  });

  it('buildProjectOrderIds preserva ordem atual', () => {
    const projects = [p('1', 'Um'), p('2', 'Dois')];
    expect(buildProjectOrderIds(projects)).toEqual(['1', '2']);
  });
});
