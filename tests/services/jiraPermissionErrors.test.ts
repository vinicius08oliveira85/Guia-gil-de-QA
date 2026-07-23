import { describe, expect, it } from 'vitest';
import {
  formatJiraPermissionError,
  isJiraPermissionError,
} from '../../services/jira/permissionErrors';

describe('jira permissionErrors', () => {
  it('detecta 403 com mensagem PT do Jira', () => {
    const err = new Error(
      'Jira API Error (403): {"errorMessages":["No momento você não tem permissão para executar esta operação."],"errors":{}}'
    );
    expect(isJiraPermissionError(err)).toBe(true);
  });

  it('formata mensagem amigável sem perder o detalhe', () => {
    const err = formatJiraPermissionError(
      new Error('Jira API Error (403): {"errorMessages":["denied"]}'),
      'listar filas'
    );
    expect(err.message).toMatch(/Sem permissão para listar filas/i);
    expect(err.message).toMatch(/agente/i);
    expect(err.message).not.toMatch(/^Jira API Error \(403\)/);
  });

  it('ignora erros que não são de permissão', () => {
    expect(isJiraPermissionError(new Error('Jira API Error (500): boom'))).toBe(false);
    expect(isJiraPermissionError('string')).toBe(false);
  });
});
