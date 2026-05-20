import { describe, it, expect } from 'vitest';
import type { JiraTask } from '../../types';
import { getTaskQaRiskLevel } from '../../services/ai/generalAnalysisService';

function makeTask(overrides: Partial<JiraTask> = {}): JiraTask {
  return {
    id: 'QA-1',
    title: 'Tarefa grande',
    description: 'Descrição suficiente para não penalizar por vazio.',
    status: 'To Do',
    type: 'Tarefa',
    testCases: [],
    bddScenarios: [],
    ...overrides,
  };
}

describe('getTaskQaRiskLevel — Story Points', () => {
  it('tarefa com muitos SP e sem testes tende a risco mais alto que tarefa pequena', () => {
    const heavy = getTaskQaRiskLevel(
      makeTask({ storyPoints: 13, testCases: [], bddScenarios: [] })
    );
    const light = getTaskQaRiskLevel(
      makeTask({ storyPoints: 1, testCases: [], bddScenarios: [{ id: '1', title: 'c', steps: [] }] })
    );
    const order = ['Baixo', 'Médio', 'Alto', 'Crítico'];
    expect(order.indexOf(heavy)).toBeGreaterThan(order.indexOf(light));
  });

  it('usa iaAnalysis.riskLevel quando persistido', () => {
    const level = getTaskQaRiskLevel(
      makeTask({
        storyPoints: 1,
        iaAnalysis: {
          riskLevel: 'Crítico',
          summary: 'x',
          snapshotHash: 'h',
          generatedAt: new Date().toISOString(),
        },
      })
    );
    expect(level).toBe('Crítico');
  });
});
