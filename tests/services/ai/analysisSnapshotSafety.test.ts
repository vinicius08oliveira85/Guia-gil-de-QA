import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../types';

vi.mock('../../../services/ai/documentContextService', () => ({
  getFormattedContext: vi.fn(() => Promise.resolve('')),
}));

vi.mock('../../../services/ai/geminiApiWrapper', () => ({
  callGeminiWithRetry: vi.fn(() =>
    Promise.resolve({
      text: JSON.stringify({
        summary: 'Resumo',
        currentPhase: 'Fase atual',
        metrics: { analysis: 'Análise', strengths: [], weaknesses: [] },
        risks: [],
        recommendations: [],
        documentsAnalysis: 'Docs',
        tasksAnalysis: 'Tasks',
        testsAnalysis: 'Tests',
        indicatorsAndPhases: 'Indicadores',
        strengths: [],
        weaknesses: [],
      }),
    })
  ),
}));

import { generateDashboardOverviewAnalysis } from '../../../services/ai/dashboardAnalysisService';
import { generateProjectFullAnalysis } from '../../../services/ai/projectFullAnalysisService';

const buildProject = (): Project => ({
  id: 'project-safety',
  name: 'Projeto',
  description: `data:image/png;base64,${'A'.repeat(120_000)}`,
  tasks: [],
  phases: [],
  documents: [
    {
      name: 'Documento gigante',
      content: `data:image/png;base64,${'B'.repeat(120_000)}`,
      category: 'Especificação',
    },
  ],
  businessRules: [],
});

describe('analysis services — snapshots seguros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera dashboard overview com descrição gigante sem estourar a pilha', async () => {
    await expect(generateDashboardOverviewAnalysis(buildProject())).resolves.toMatchObject({
      summary: 'Resumo',
    });
  });

  it('gera project full analysis com documentos gigantes sem estourar a pilha', async () => {
    await expect(generateProjectFullAnalysis(buildProject())).resolves.toMatchObject({
      summary: 'Resumo',
    });
  });
});
