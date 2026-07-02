import { describe, expect, it } from 'vitest';
import {
  findAttachedFormsFieldId,
  formatAttachedFormsCustomFieldValue,
  isJiraIntegratedTask,
} from '../../utils/jiraAttachedFormsField';
import {
  formatJiraFormAnswerValue,
  formatFormAnswerRawValue,
  hasAttachedFormsContent,
  mergeFormAnswers,
  parseFormDetailAnswers,
  parseFormIndexResponse,
  resolveChoiceLabel,
} from '../../services/jira/attachedForms';
import type { JiraTask } from '../../types';

function makeTask(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: 'GDPI-1',
    title: 'Tarefa',
    description: '',
    status: 'To Do',
    type: 'Tarefa',
    priority: 'Média',
    assignee: 'QA',
    testCases: [],
    comments: [],
    tags: [],
    ...overrides,
  };
}

describe('jiraAttachedFormsField', () => {
  it('identifica tarefa integrada ao Jira pela chave', () => {
    expect(isJiraIntegratedTask(makeTask({ id: 'GDPI-443' }))).toBe(true);
    expect(isJiraIntegratedTask(makeTask({ id: 'local-task-1' }))).toBe(false);
  });

  it('resolve o id do campo Formulários anexados', () => {
    const fieldId = findAttachedFormsFieldId([
      { id: 'customfield_10099', name: 'Formulários anexados', custom: true },
      { id: 'customfield_10001', name: 'Serviço', custom: true },
    ]);
    expect(fieldId).toBe('customfield_10099');
  });

  it('formata valor do custom field', () => {
    const task = makeTask({
      jiraCustomFields: {
        customfield_10099: [{ name: 'Formulário de triagem' }],
      },
    });
    const text = formatAttachedFormsCustomFieldValue(task, [
      { id: 'customfield_10099', name: 'Formulários anexados', custom: true },
    ]);
    expect(text).toBe('Formulário de triagem');
  });
});

describe('attachedForms helpers', () => {
  it('formata resposta do formulário', () => {
    expect(formatJiraFormAnswerValue({ label: 'Setor', answer: 'NCI' })).toBe('NCI');
    expect(formatJiraFormAnswerValue({ label: 'Vazio' })).toBe('—');
  });

  it('detecta conteúdo exibível', () => {
    expect(
      hasAttachedFormsContent([
        { id: '1', name: 'Form', submitted: true, answers: [{ label: 'A', answer: 'B' }] },
      ])
    ).toBe(true);
    expect(
      hasAttachedFormsContent([{ id: '1', name: 'Form', submitted: false, answers: [] }])
    ).toBe(true);
    expect(hasAttachedFormsContent([])).toBe(false);
  });

  it('parseia índice de formulários em array ou objeto', () => {
    expect(parseFormIndexResponse([{ id: 'abc', name: 'Form 1' }])).toHaveLength(1);
    expect(parseFormIndexResponse({ forms: [{ id: 'xyz', name: 'Form 2' }] })).toHaveLength(1);
  });

  it('parseia respostas do JSON completo do formulário', () => {
    const answers = parseFormDetailAnswers({
      design: {
        questions: {
          q1: {
            label: 'O que você precisa?',
            choices: [
              { id: 2, label: 'Solicitar acesso ou permissão' },
            ],
          },
          q2: {
            label: 'Qual sistema?',
            choices: [{ id: 4, label: 'Salesforce' }],
          },
          q3: {
            label: 'Usuário',
          },
          q4: {
            label: 'Informações',
          },
        },
      },
      state: {
        answers: {
          q1: 2,
          q2: { choices: ['4'] },
          q3: { text: 'jorge.arruda' },
          q4: {
            text: 'Boa tarde, equipe!\n\nSolicito criação de acesso ao SalesForce.',
          },
        },
        status: 's',
      },
    });

    expect(answers).toHaveLength(4);
    expect(answers[0].answer).toBe('Solicitar acesso ou permissão');
    expect(answers[1].answer).toBe('Salesforce');
    expect(answers[2].answer).toBe('jorge.arruda');
    expect(answers[3].answer).toContain('SalesForce');
  });

  it('mescla format/answers com design do formulário', () => {
    const detail = {
      design: {
        questions: {
          '7': {
            label: 'Tipo de acesso',
            choices: [{ id: 1, label: 'Novo acesso' }],
          },
        },
      },
      state: {
        answers: {
          '7': 1,
        },
      },
    };

    const merged = mergeFormAnswers(detail, [
      { label: 'O que você precisa?', answer: 'Solicitar acesso ou permissão' },
      { label: 'Tipo de acesso', answer: '', choice: 1 },
      { label: 'Justificativa', answer: '' },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged[0].answer).toBe('Solicitar acesso ou permissão');
    expect(merged[1].answer).toBe('Novo acesso');
  });

  it('resolve rótulo de choice por id', () => {
    const question = {
      choices: [
        { id: 1, label: 'Novo acesso' },
        { id: 2, label: 'Alteração de acesso' },
      ],
    };
    expect(resolveChoiceLabel(question, 1)).toBe('Novo acesso');
    expect(resolveChoiceLabel(question, 2)).toBe('Alteração de acesso');
  });

  it('formata respostas complexas', () => {
    expect(formatFormAnswerRawValue({ text: 'Novo acesso' })).toBe('Novo acesso');
    expect(formatFormAnswerRawValue({ choices: ['A', 'B'] })).toBe('A, B');
  });
});
