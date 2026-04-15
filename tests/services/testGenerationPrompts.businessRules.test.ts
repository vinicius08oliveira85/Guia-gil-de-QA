import { describe, it, expect } from 'vitest';
import { formatBusinessRulesForPrompt, BUSINESS_RULES_PROMPT_MAX_CHARS } from '../../services/ai/testGenerationPrompts';
import type { JiraTask, Project } from '../../types';

const baseProject = (rules: Project['businessRules']): Project =>
  ({
    id: 'p1',
    name: 'P',
    description: '',
    documents: [],
    businessRules: rules,
    tasks: [],
    phases: [],
  }) as Project;

const minimalTask = (overrides: Partial<JiraTask> = {}): JiraTask =>
  ({
    id: 't1',
    title: 'T',
    description: '',
    status: 'To Do',
    testCases: [],
    type: 'Tarefa',
    ...overrides,
  }) as JiraTask;

describe('formatBusinessRulesForPrompt', () => {
  it('retorna vazio sem regras', () => {
    expect(formatBusinessRulesForPrompt(baseProject([]))).toBe('');
    expect(formatBusinessRulesForPrompt(baseProject(undefined))).toBe('');
  });

  it('com linkedBusinessRuleIds resolve e usa título OBRIGATÓRIAS', () => {
    const project = baseProject([
      { id: 'a', title: 'R1', description: 'D1', createdAt: '2020-01-01' },
      { id: 'b', title: 'R2', description: 'D2', createdAt: '2020-01-02' },
    ]);
    const task = minimalTask({ linkedBusinessRuleIds: ['b'] });
    const out = formatBusinessRulesForPrompt(project, task);
    expect(out).toContain('REGRAS DE NEGÓCIO OBRIGATÓRIAS');
    expect(out).toContain('id: b');
    expect(out).toContain('título: R2');
    expect(out).not.toContain('id: a');
  });

  it('com linked ids inexistentes retorna vazio', () => {
    const project = baseProject([{ id: 'a', title: 'R1', description: 'D1', createdAt: 'x' }]);
    const task = minimalTask({ linkedBusinessRuleIds: ['missing'] });
    expect(formatBusinessRulesForPrompt(project, task)).toBe('');
  });

  it('sem vínculos envia todas as regras como CONTEXTO GERAL', () => {
    const project = baseProject([
      { id: 'x', title: 'G1', description: 'dg', createdAt: 'x' },
    ]);
    const out = formatBusinessRulesForPrompt(project, minimalTask());
    expect(out).toContain('CONTEXTO GERAL DE NEGÓCIO');
    expect(out).toContain('id: x');
  });

  it('respeita limite aproximado de caracteres', () => {
    const huge = 'x'.repeat(BUSINESS_RULES_PROMPT_MAX_CHARS + 500);
    const project = baseProject([
      { id: '1', title: 'T', description: huge, createdAt: 'x' },
      { id: '2', title: 'T2', description: 'small', createdAt: 'x' },
    ]);
    const out = formatBusinessRulesForPrompt(project, minimalTask());
    expect(out.length).toBeLessThanOrEqual(BUSINESS_RULES_PROMPT_MAX_CHARS + 800);
    expect(out).toContain('omitidas por limite');
  });
});
