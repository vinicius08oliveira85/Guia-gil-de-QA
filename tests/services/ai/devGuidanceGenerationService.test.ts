import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { JiraTask } from '../../types';
import {
  clearDevGuidanceCache,
  generateDevGuidanceForTask,
} from '../../../services/ai/devGuidanceGenerationService';

vi.mock('../../../services/ai/geminiApiWrapper', () => ({
  callGeminiWithRetry: vi.fn(async () => ({
    text: JSON.stringify({
      overview: 'Implementar cadastro.',
      prerequisites: ['Ler regras de negócio'],
      implementationSteps: [
        {
          order: 1,
          title: 'Modelar entidade',
          description: 'Criar tabela e DTO.',
        },
      ],
      suggestedTests: ['Validar campo obrigatório'],
    }),
  })),
}));

vi.mock('../../../services/ai/taskAiContext', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../services/ai/taskAiContext')>();
  return {
    ...actual,
    resolveTaskAiContext: vi.fn(async () => ({
      title: 'Tarefa X',
      description: 'Descrição da tarefa',
      taskType: 'Tarefa' as const,
      attachedFormsContext: '(sem formulários)',
      businessRulesBlock: '',
      imageParts: [],
      imageSummary: '',
      imageFingerprint: '',
      attachmentsContext: '',
      hasRealDescription: true,
      hasAttachedForms: false,
      hasImages: false,
      hasBusinessRules: false,
    })),
  };
});

function buildTask(): JiraTask {
  return {
    id: 'TASK-1',
    title: 'Implementar cadastro',
    description: 'Criar fluxo de cadastro de usuário',
    status: 'To Do',
    type: 'Tarefa',
    testCases: [],
  };
}

describe('devGuidanceGenerationService', () => {
  beforeEach(() => {
    clearDevGuidanceCache();
  });

  it('gera guia Dev normalizado', async () => {
    const result = await generateDevGuidanceForTask(buildTask(), {
      project: {
        id: 'p1',
        name: 'Dev',
        description: '',
        workflow: 'dev',
        documents: [],
        businessRules: [],
        tasks: [],
        phases: [],
        settings: {
          devStack: {
            languages: ['TypeScript'],
            frameworks: ['React'],
            databases: [],
            tools: [],
          },
        },
      },
    });

    expect(result.overview).toContain('cadastro');
    expect(result.implementationSteps).toHaveLength(1);
    expect(result.snapshotHash).toBeTruthy();
    expect(result.generatedAt).toBeTruthy();
  });
});
