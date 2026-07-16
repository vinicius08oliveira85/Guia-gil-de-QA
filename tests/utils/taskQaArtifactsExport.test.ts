import { describe, it, expect } from 'vitest';
import type { JiraTask } from '../../types';
import {
  TASK_QA_EXPORT_FORMAT_ID,
  TASK_QA_EXPORT_FORMAT_VERSION,
  applyTaskQaArtifactsToTask,
  exportTaskQaArtifactsToJSON,
  parseTaskQaArtifactsFromJson,
} from '../../utils/taskQaArtifactsExport';

const baseTask: JiraTask = {
  id: 'GDPI-10',
  title: 'Cadastro',
  description: 'Desc',
  status: 'To Do',
  type: 'Tarefa',
  testCases: [
    {
      id: 'tc-1',
      action: '1. Abrir tela',
      parameters: '—',
      expectedResult: '• Tela aberta',
      observedResult: '',
      status: 'Not Run',
    },
  ],
  testStrategy: [
    {
      testType: 'Funcional',
      description: 'Validar fluxo',
      howToExecute: ['Abrir', 'Salvar'],
      tools: 'Postman',
    },
  ],
  bddScenarios: [
    {
      id: 'bdd-1',
      title: 'Happy path',
      gherkin: 'Funcionalidade: Cadastro\nCenário: OK\nDado que...\nQuando...\nEntão...',
    },
  ],
};

describe('taskQaArtifactsExport', () => {
  it('exporta envelope com BDD, estratégias e casos', () => {
    const json = exportTaskQaArtifactsToJSON(baseTask);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe(TASK_QA_EXPORT_FORMAT_ID);
    expect(parsed.formatVersion).toBe(TASK_QA_EXPORT_FORMAT_VERSION);
    expect(parsed.task.id).toBe('GDPI-10');
    expect(parsed.task.bddScenarios).toHaveLength(1);
    expect(parsed.task.testStrategy).toHaveLength(1);
    expect(parsed.task.testCases).toHaveLength(1);
  });

  it('faz round-trip parse e aplica na tarefa aberta', () => {
    const json = exportTaskQaArtifactsToJSON(baseTask);
    const artifacts = parseTaskQaArtifactsFromJson(JSON.parse(json));
    const target: JiraTask = {
      ...baseTask,
      id: 'OTHER-1',
      title: 'Outra tarefa',
      testCases: [],
      testStrategy: [],
      bddScenarios: [],
    };
    const merged = applyTaskQaArtifactsToTask(target, artifacts);
    expect(merged.id).toBe('OTHER-1');
    expect(merged.title).toBe('Outra tarefa');
    expect(merged.testCases).toHaveLength(1);
    expect(merged.testStrategy).toHaveLength(1);
    expect(merged.bddScenarios).toHaveLength(1);
  });

  it('rejeita JSON sem artefatos QA', () => {
    expect(() =>
      parseTaskQaArtifactsFromJson({
        format: TASK_QA_EXPORT_FORMAT_ID,
        task: { id: 'X-1', title: 'Vazia' },
      })
    ).toThrow(/Nenhum artefato QA/i);
  });
});
