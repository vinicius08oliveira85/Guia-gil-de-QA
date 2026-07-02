import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JiraTask } from '../../../types';
import {
  formatJiraAttachedFormsForPrompt,
  validateTaskAiContext,
  computeTaskAiContextHash,
  type TaskAiContext,
} from '../../../services/ai/taskAiContext';
import type { JiraAttachedForm } from '../../../services/jira/attachedForms';

vi.mock('../../../services/jiraService', () => ({
  getJiraConfig: vi.fn(() => null),
}));

vi.mock('../../../services/jira/attachedForms', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../services/jira/attachedForms')>();
  return {
    ...actual,
    fetchIssueAttachedForms: vi.fn(async () => []),
  };
});

const baseCtx = (overrides: Partial<TaskAiContext> = {}): TaskAiContext => ({
  title: 'Acesso Salesforce',
  description: '(sem descrição)',
  taskType: 'Tarefa',
  attachedFormsContext: 'Formulário: Solicitar algo à TI (Submetido)\n  - Sistema: Salesforce',
  businessRulesBlock: '',
  imageParts: [],
  imageSummary: '(nenhuma imagem disponível para análise visual)',
  imageFingerprint: '',
  attachmentsContext: '',
  hasRealDescription: false,
  hasAttachedForms: true,
  hasImages: false,
  hasBusinessRules: false,
  ...overrides,
});

describe('formatJiraAttachedFormsForPrompt', () => {
  it('formata campos legíveis e omite vazios', () => {
    const forms: JiraAttachedForm[] = [
      {
        id: '1',
        name: 'Solicitar algo à TI',
        submitted: true,
        answers: [
          { label: 'Sistema', answer: 'Salesforce' },
          { label: 'Vazio', answer: '' },
        ],
      },
    ];
    const text = formatJiraAttachedFormsForPrompt(forms);
    expect(text).toContain('Solicitar algo à TI');
    expect(text).toContain('Submetido');
    expect(text).toContain('Sistema: Salesforce');
    expect(text).not.toContain('Vazio');
  });
});

describe('validateTaskAiContext', () => {
  it('aceita tarefa só com formulários anexados', () => {
    expect(() => validateTaskAiContext(baseCtx())).not.toThrow();
  });

  it('rejeita quando não há nenhuma fonte de conteúdo', () => {
    expect(() =>
      validateTaskAiContext(
        baseCtx({
          hasAttachedForms: false,
          attachedFormsContext: '(sem formulários anexados)',
        })
      )
    ).toThrow(/sem conteúdo analisável/i);
  });
});

describe('computeTaskAiContextHash', () => {
  const task: JiraTask = {
    id: 'SUS-1',
    title: 'T',
    description: '',
    status: 'To Do',
    type: 'Tarefa',
    testCases: [],
  };

  it('muda quando formulários mudam', () => {
    const h1 = computeTaskAiContextHash(task, baseCtx());
    const h2 = computeTaskAiContextHash(
      task,
      baseCtx({ attachedFormsContext: 'outro formulário' })
    );
    expect(h1).not.toBe(h2);
  });
});
