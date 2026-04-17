import { describe, it, expect } from 'vitest';
import {
  formatBusinessRulesForPrompt,
  buildTestGenerationRolePreamble,
  BUSINESS_RULES_PROMPT_MAX_CHARS,
} from '../../services/ai/testGenerationPrompts';
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
  it('retorna vazio sem tarefa, sem vínculos ou sem regras resolvíveis', () => {
    expect(formatBusinessRulesForPrompt(baseProject([]))).toBe('');
    expect(formatBusinessRulesForPrompt(baseProject([]), null)).toBe('');
    expect(formatBusinessRulesForPrompt(baseProject([]), minimalTask())).toBe('');
  });

  it('com linkedBusinessRuleIds resolve e usa delimitador ###', () => {
    const project = baseProject([
      { id: 'a', title: 'R1', description: 'D1', category: 'Geral', createdAt: '2020-01-01' },
      { id: 'b', title: 'R2', description: 'D2', category: 'Segurança', createdAt: '2020-01-02' },
    ]);
    const task = minimalTask({ linkedBusinessRuleIds: ['b'] });
    const out = formatBusinessRulesForPrompt(project, task);
    expect(out).toContain('### REGRAS DE NEGÓCIO APLICÁVEIS ###');
    expect(out).toContain('id: b');
    expect(out).toContain('[Regra 1: R2 — Segurança]');
    expect(out).not.toContain('id: a');
  });

  it('com linked ids inexistentes retorna vazio', () => {
    const project = baseProject([{ id: 'a', title: 'R1', description: 'D1', category: 'Geral', createdAt: 'x' }]);
    const task = minimalTask({ linkedBusinessRuleIds: ['missing'] });
    expect(formatBusinessRulesForPrompt(project, task)).toBe('');
  });

  it('sem vínculos na tarefa não envia regras do projeto', () => {
    const project = baseProject([{ id: 'x', title: 'G1', description: 'dg', category: 'Geral', createdAt: 'x' }]);
    expect(formatBusinessRulesForPrompt(project, minimalTask())).toBe('');
  });

  it('respeita limite aproximado de caracteres', () => {
    const huge = 'x'.repeat(BUSINESS_RULES_PROMPT_MAX_CHARS + 500);
    const project = baseProject([
      { id: '1', title: 'T', description: huge, category: 'Geral', createdAt: 'x' },
      { id: '2', title: 'T2', description: 'small', category: 'Geral', createdAt: 'x' },
    ]);
    const out = formatBusinessRulesForPrompt(project, minimalTask({ linkedBusinessRuleIds: ['1', '2'] }));
    expect(out.length).toBeLessThanOrEqual(BUSINESS_RULES_PROMPT_MAX_CHARS + 800);
    expect(out).toContain('omitidas por limite');
  });
});

describe('buildTestGenerationRolePreamble', () => {
  it('inclui placeholder quando não há bloco de regras', () => {
    const p = buildTestGenerationRolePreamble('Tit', 'Desc', '');
    expect(p).toContain('bloco TAREFA');
    expect(p).toContain('### REGRAS DE NEGÓCIO APLICÁVEIS ###');
    expect(p).toContain('nenhuma regra vinculada');
  });

  it('incorpora bloco de regras quando fornecido', () => {
    const br = '### REGRAS DE NEGÓCIO APLICÁVEIS ###\nx';
    const p = buildTestGenerationRolePreamble('A', 'B', br);
    expect(p).toContain(br);
  });
});
