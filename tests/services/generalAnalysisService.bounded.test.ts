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
});
