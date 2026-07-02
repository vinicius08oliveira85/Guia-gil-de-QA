import { describe, expect, it } from 'vitest';
import {
  findAttachedFormsFieldId,
  formatAttachedFormsCustomFieldValue,
  isJiraIntegratedTask,
} from '../../utils/jiraAttachedFormsField';
import {
  formatJiraFormAnswerValue,
  hasAttachedFormsContent,
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
    expect(formatJiraFormAnswerValue({ label: 'Opção', choice: 2 })).toBe('2');
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
});
