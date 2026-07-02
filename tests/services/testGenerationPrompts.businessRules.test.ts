import { describe, it, expect } from 'vitest';
import {
  buildTaskContextBlock,
  buildTestGenerationRolePreamble,
} from '../../services/ai/testGenerationPrompts';
import {
  formatBusinessRulesForPrompt,
  BUSINESS_RULES_PROMPT_MAX_CHARS,
} from '../../services/ai/promptUtils';
import type { TaskAiContext } from '../../services/ai/taskAiContext';
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
      { id: 'a', title: 'R1', description: 'D1', category: 'Geral', createdAt: '2020-01-01', linkedTaskIds: [] },
      { id: 'b', title: 'R2', description: 'D2', category: 'Segurança', createdAt: '2020-01-02', linkedTaskIds: [] },
    ]);
    const task = minimalTask({ linkedBusinessRuleIds: ['b'] });
    const out = formatBusinessRulesForPrompt(project, task);
    expect(out).toContain('### REGRAS DE NEGÓCIO APLICÁVEIS ###');
    expect(out).toContain('id: b');
    expect(out).toContain('[Regra 1: R2]');
    expect(out).not.toContain('id: a');
  });

  it('com linked ids inexistentes retorna vazio', () => {
    const project = baseProject([
      { id: 'a', title: 'R1', description: 'D1', category: 'Geral', createdAt: 'x' },
    ]);
    const task = minimalTask({ linkedBusinessRuleIds: ['missing'] });
    expect(formatBusinessRulesForPrompt(project, task)).toBe('');
  });

  it('sem vínculos na tarefa não envia regras do projeto', () => {
    const project = baseProject([
      { id: 'x', title: 'G1', description: 'dg', category: 'Geral', createdAt: 'x' },
    ]);
    expect(formatBusinessRulesForPrompt(project, minimalTask())).toBe('');
  });

  it('com linkedBusinessRuleCategories inclui todas as regras da categoria', () => {
    const project = baseProject([
      { id: 'a', title: 'A1', description: 'd1', category: 'Geral', createdAt: '1' },
      { id: 'b', title: 'B1', description: 'd2', category: 'Segurança', createdAt: '2' },
      { id: 'c', title: 'C1', description: 'd3', category: 'Geral', createdAt: '3' },
    ]);
    const task = minimalTask({ linkedBusinessRuleCategories: ['Geral'] });
    const out = formatBusinessRulesForPrompt(project, task);
    expect(out).toContain('id: a');
    expect(out).toContain('id: c');
    expect(out).not.toContain('id: b');
  });

  it('união de ids e categorias deduplica por id', () => {
    const project = baseProject([
      { id: 'a', title: 'R1', description: 'd', category: 'Geral', createdAt: '1' },
      { id: 'b', title: 'R2', description: 'd', category: 'Geral', createdAt: '2' },
    ]);
    const task = minimalTask({
      linkedBusinessRuleIds: ['a'],
      linkedBusinessRuleCategories: ['Geral'],
    });
    const out = formatBusinessRulesForPrompt(project, task);
    expect(out).toContain('id: a');
    expect(out).toContain('id: b');
    const idOccurrences = (out.match(/id: a/g) ?? []).length;
    expect(idOccurrences).toBe(1);
  });

  it('respeita limite aproximado de caracteres', () => {
    const huge = 'x'.repeat(BUSINESS_RULES_PROMPT_MAX_CHARS + 500);
    const project = baseProject([
      { id: '1', title: 'T', description: huge, category: 'Geral', createdAt: 'x' },
      { id: '2', title: 'T2', description: 'small', category: 'Geral', createdAt: 'x' },
    ]);
    const out = formatBusinessRulesForPrompt(
      project,
      minimalTask({ linkedBusinessRuleIds: ['1', '2'] })
    );
    expect(out.length).toBeLessThanOrEqual(BUSINESS_RULES_PROMPT_MAX_CHARS + 800);
    expect(out).toContain('omitidas por limite');
  });
});

describe('buildTestGenerationRolePreamble', () => {
  const ctx = (overrides: Partial<TaskAiContext> = {}): TaskAiContext => ({
    title: 'Tit',
    description: 'Desc',
    attachedFormsContext: 'Formulário X',
    businessRulesBlock: '',
    imageParts: [],
    imageSummary: '(nenhuma imagem)',
    imageFingerprint: '',
    attachmentsContext: '',
    hasRealDescription: true,
    hasAttachedForms: true,
    hasImages: false,
    hasBusinessRules: false,
    ...overrides,
  });

  it('inclui placeholder quando não há bloco de regras', () => {
    const p = buildTestGenerationRolePreamble(ctx());
    expect(p).toContain('CONTEXTO DA TAREFA');
    expect(p).toContain('### REGRAS DE NEGÓCIO APLICÁVEIS ###');
    expect(p).toContain('nenhuma regra vinculada');
    expect(p).toContain('formulários anexados');
  });

  it('incorpora bloco de regras quando fornecido', () => {
    const br = '### REGRAS DE NEGÓCIO APLICÁVEIS ###\nx';
    const p = buildTestGenerationRolePreamble(ctx({ businessRulesBlock: br, hasBusinessRules: true }));
    expect(p).toContain(br);
  });
});

describe('buildTaskContextBlock', () => {
  it('inclui formulários anexados e imagens', () => {
    const block = buildTaskContextBlock({
      title: 'Acesso',
      description: '(sem descrição)',
      attachedFormsContext: 'Formulário: TI\n  - Sistema: Salesforce',
      businessRulesBlock: '',
      imageParts: [],
      imageSummary: '- Imagem 1 (descrição)',
      imageFingerprint: 'x',
      attachmentsContext: '',
      hasRealDescription: false,
      hasAttachedForms: true,
      hasImages: true,
      hasBusinessRules: false,
    });
    expect(block).toContain('Formulários anexados');
    expect(block).toContain('Salesforce');
    expect(block).toContain('Imagens para análise visual');
  });
});
