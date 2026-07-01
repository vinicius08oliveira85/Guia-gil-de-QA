import { describe, expect, it } from 'vitest';
import { mergeBusinessRules, mergeProjects } from '../../utils/projectMerge';
import type { BusinessRule, Project } from '../../types';

const baseProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: 'p1',
    name: 'Projeto',
    description: '',
    documents: [],
    businessRules: [],
    tasks: [],
    phases: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }) as Project;

const rule = (overrides: Partial<BusinessRule> & Pick<BusinessRule, 'id' | 'title'>): BusinessRule =>
  ({
    createdAt: '2024-01-01T00:00:00.000Z',
    linkedTaskIds: [],
    ...overrides,
  }) as BusinessRule;

describe('projectMerge businessRules', () => {
  it('mergeBusinessRules une regras locais e remotas por id', () => {
    const merged = mergeBusinessRules(
      [rule({ id: 'r1', title: 'Local', updatedAt: '2025-01-02T00:00:00.000Z' })],
      [rule({ id: 'r2', title: 'Remota' })]
    );
    expect(merged).toHaveLength(2);
    expect(merged.map(r => r.id).sort()).toEqual(['r1', 'r2']);
  });

  it('mergeProjects preserva regras locais quando remoto é mais recente mas sem regras', () => {
    const local = baseProject({
      updatedAt: '2024-06-01T00:00:00.000Z',
      businessRules: [rule({ id: 'r1', title: 'Mapa de Internação', searchKeywords: ['Mapa'] })],
    });
    const remote = baseProject({
      updatedAt: '2025-06-01T00:00:00.000Z',
      businessRules: [],
    });

    const merged = mergeProjects(local, remote);
    expect(merged.businessRules).toHaveLength(1);
    expect(merged.businessRules[0].id).toBe('r1');
    expect(merged.businessRules[0].title).toBe('Mapa de Internação');
  });
});
