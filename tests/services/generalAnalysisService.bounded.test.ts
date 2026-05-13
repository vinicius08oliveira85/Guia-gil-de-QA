import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project, JiraTask, TestCase } from '../../types';

vi.mock('../../services/ai/documentContextService', () => ({
  getFormattedContext: vi.fn(() => Promise.resolve('')),
}));

vi.mock('../../services/ai/geminiApiWrapper', () => ({
  callGeminiWithRetry: vi.fn(() =>
    Promise.resolve({
      text: JSON.stringify({
        summary: 'Resumo',
        detectedProblems: [],
        riskCalculation: { overallRisk: 'Baixo', riskScore: 15, riskFactors: [] },
        missingItems: [],
        bddSuggestions: [],
        qaImprovements: [],
        taskAnalyses: [],
        testAnalyses: [],
      }),
    })
  ),
}));

import {
  generateGeneralIAAnalysis,
  MAX_PERSISTED_TEST_ANALYSES,
  invalidateGeneralAnalysisCache,
  getTaskIaAnalysisSnapshotHash,
} from '../../services/ai/generalAnalysisService';

function makeTestCase(i: number, status: TestCase['status'] = 'Not Run'): TestCase {
  return {
    id: `tc-${i}`,
    description: `Case ${i}`,
    steps: ['passo'],
    expectedResult: 'ok',
    status,
    priority: 'Média',
  };
}

function makeProject(id: string, taskCount: number, testsPerTask: number): Project {
  const tasks: JiraTask[] = [];
  for (let i = 0; i < taskCount; i++) {
    const testCases: TestCase[] = [];
    for (let j = 0; j < testsPerTask; j++) {
      testCases.push(makeTestCase(i * testsPerTask + j, j % 5 === 0 ? 'Failed' : 'Not Run'));
    }
    tasks.push({
      id: `t-${i}`,
      title: `Task ${i}`,
      description: 'desc',
      status: 'To Do',
      type: 'Tarefa',
      testCases,
    });
  }
  return {
    id,
    name: 'Test Project',
    description: '',
    tasks,
    phases: [],
    documents: [],
    businessRules: [],
  };
}

describe('generalAnalysisService — limites de persistência', () => {
  beforeEach(() => {
    invalidateGeneralAnalysisCache('bounded-proj-a');
    invalidateGeneralAnalysisCache('bounded-proj-b');
  });

  it('testAnalyses tem no máximo MAX_PERSISTED_TEST_ANALYSES mesmo com milhares de casos', async () => {
    const project = makeProject('bounded-proj-a', 2, 500);
    const analysis = await generateGeneralIAAnalysis(project);
    expect(analysis.testAnalyses.length).toBeLessThanOrEqual(MAX_PERSISTED_TEST_ANALYSES);
  });

  it('mantém uma entrada de taskAnalyses por tarefa no contexto (até 10 tarefas)', async () => {
    const project = makeProject('bounded-proj-b', 10, 4);
    const analysis = await generateGeneralIAAnalysis(project);
    expect(analysis.taskAnalyses.length).toBe(10);
  });

  it('ignora a cauda de descrições gigantes após o limite seguro do snapshot', () => {
    const stablePrefix = 'ABCD '.repeat(500);
    const taskA: JiraTask = {
      id: 't-huge',
      title: 'Task enorme',
      description: `${stablePrefix}TAIL-A-${'A'.repeat(20_000)}`,
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
    };
    const taskB: JiraTask = {
      ...taskA,
      description: `${stablePrefix}TAIL-B-${'B'.repeat(20_000)}`,
    };

    expect(getTaskIaAnalysisSnapshotHash(taskA)).toBe(getTaskIaAnalysisSnapshotHash(taskB));
  });

  it('gera análise sem estourar a pilha quando a descrição contém payload gigante', async () => {
    const project = makeProject('bounded-proj-c', 1, 1);
    project.tasks[0].description = `data:image/png;base64,${'A'.repeat(120_000)}`;

    await expect(generateGeneralIAAnalysis(project)).resolves.toMatchObject({
      summary: 'Resumo',
    });
  });
});
