import { describe, it, expect } from 'vitest';
import { getProjectIconMeta } from '../../utils/projectIcon';
import type { Project } from '../../types';

function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    id: '1',
    name: 'Projeto',
    description: '',
    documents: [],
    businessRules: [],
    tasks: [],
    phases: [],
    ...overrides,
  };
}

describe('getProjectIconMeta', () => {
  it('prioriza tag de categoria', () => {
    const meta = getProjectIconMeta(baseProject({ tags: ['Mobile'] }));
    expect(meta.kind).toBe('mobile');
    expect(meta.label).toMatch(/mobile/i);
  });

  it('detecta domínio saúde por palavras-chave', () => {
    const meta = getProjectIconMeta(
      baseProject({ name: 'Gestão de Pacientes Internados', description: 'Hospital' })
    );
    expect(meta.kind).toBe('health');
  });

  it('usa ícone Jira quando só há chave Jira', () => {
    const meta = getProjectIconMeta(
      baseProject({
        name: 'Backoffice',
        settings: { jiraProjectKey: 'QA' },
      })
    );
    expect(meta.kind).toBe('jira');
  });

  it('retorna geral como fallback', () => {
    const meta = getProjectIconMeta(baseProject({ name: 'Alpha' }));
    expect(meta.kind).toBe('general');
  });
});
