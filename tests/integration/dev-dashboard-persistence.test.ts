/**
 * Round-trip IndexedDB: Stack Dev e Análises IA (Dev) do Dashboard Dev.
 * Garante que campos usados na aba Tarefas & Implementação persistem após reload.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Project, ProjectDevFullAnalysis } from '../../types';
import {
  addProject,
  getProjectById,
  loadProjectsFromIndexedDB,
  updateProject,
} from '../../services/dbService';
import { appendDevProjectAnalysis } from '../../services/ai/projectDevFullAnalysisService';
import { DEV_STACK_PRESETS } from '../../utils/devStackPresets';

function createDevProject(idSuffix: string): Project {
  return {
    id: `dev-persist-${idSuffix}`,
    name: 'Projeto Dev Persistência',
    description: 'Teste round-trip Dashboard Dev',
    workflow: 'dev',
    tasks: [
      {
        id: 'TASK-DEV-001',
        title: 'Implementar endpoint',
        description: 'Criar rota REST',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [],
      },
    ],
    documents: [],
    phases: [],
    settings: {},
  };
}

function sampleDevAnalysis(generatedAt: string, summary: string): ProjectDevFullAnalysis {
  return {
    summary,
    stackAlignment: 'Stack alinhada ao backlog',
    implementationBacklog: '1. API\n2. UI',
    architectureNotes: 'Módulos por feature',
    strengths: ['TypeScript strict'],
    weaknesses: ['Sem testes e2e'],
    risks: ['Dependência externa'],
    recommendations: ['Adicionar Vitest'],
    generatedAt,
  };
}

describe('Persistência Dashboard Dev (IndexedDB)', () => {
  let project: Project;

  beforeEach(() => {
    project = createDevProject(String(Date.now()));
  });

  it('deve persistir settings.devStack após updateProject e reload', async () => {
    const preset = DEV_STACK_PRESETS[0].config;

    await addProject(project);
    await updateProject({
      ...project,
      settings: {
        ...project.settings,
        devStack: preset,
      },
    });

    const reloaded = await getProjectById(project.id);

    expect(reloaded?.settings?.devStack).toEqual(preset);
    expect(reloaded?.settings?.devStack?.languages).toContain('TypeScript');
    expect(reloaded?.settings?.devStack?.frameworks).toContain('React');
  });

  it('deve atualizar devStack incrementalmente (edição parcial)', async () => {
    await addProject(project);

    await updateProject({
      ...project,
      settings: {
        devStack: {
          languages: ['TypeScript'],
          frameworks: ['React'],
          databases: [],
          tools: ['Cursor AI'],
          architectureStyle: 'MVC',
          testingApproach: 'Vitest',
          notes: 'v1',
        },
      },
    });

    const mid = await getProjectById(project.id);
    expect(mid?.settings?.devStack?.notes).toBe('v1');

    await updateProject({
      ...mid!,
      settings: {
        ...mid!.settings,
        devStack: {
          ...mid!.settings!.devStack!,
          notes: 'v2 — convenções do time',
          databases: ['PostgreSQL'],
        },
      },
    });

    const final = await getProjectById(project.id);
    expect(final?.settings?.devStack?.notes).toBe('v2 — convenções do time');
    expect(final?.settings?.devStack?.databases).toEqual(['PostgreSQL']);
    expect(final?.settings?.devStack?.languages).toEqual(['TypeScript']);
  });

  it('deve persistir devProjectFullAnalyses (múltiplas análises)', async () => {
    const first = sampleDevAnalysis('2026-07-10T10:00:00.000Z', 'Primeira análise Dev');
    const second = sampleDevAnalysis('2026-07-10T11:00:00.000Z', 'Segunda análise Dev');

    await addProject(project);

    let withFirst = appendDevProjectAnalysis(project, first);
    await updateProject(withFirst);

    withFirst = (await getProjectById(project.id))!;
    expect(withFirst.devProjectFullAnalyses).toHaveLength(1);
    expect(withFirst.devProjectFullAnalyses?.[0].summary).toBe('Primeira análise Dev');

    const withSecond = appendDevProjectAnalysis(withFirst, second);
    await updateProject(withSecond);

    const reloaded = await getProjectById(project.id);
    expect(reloaded?.devProjectFullAnalyses).toHaveLength(2);
    expect(reloaded?.devProjectFullAnalyses?.[0].summary).toBe('Segunda análise Dev');
    expect(reloaded?.devProjectFullAnalyses?.[1].summary).toBe('Primeira análise Dev');
    expect(reloaded?.devProjectFullAnalyses?.[0].risks).toEqual(['Dependência externa']);
  });

  it('deve persistir stack, análises Dev e guia de implementação na mesma tarefa', async () => {
    const analysis = sampleDevAnalysis('2026-07-10T12:00:00.000Z', 'Análise consolidada');
    const preset = DEV_STACK_PRESETS[1].config;

    await addProject(project);

    const withDevContext = appendDevProjectAnalysis(
      {
        ...project,
        settings: { devStack: preset },
      },
      analysis
    );

    const taskWithGuidance = {
      ...withDevContext.tasks[0],
      devGuidance: {
        overview: 'Implementar módulo NestJS',
        prerequisites: ['Node 20'],
        implementationSteps: [
          {
            order: 1,
            title: 'Criar controller',
            description: 'Endpoint GET /health',
            cursorAgentAction: 'create' as const,
            cursorAgentPrompt: 'Crie HealthController em src/health/',
          },
        ],
        cursorAgentMasterPrompt: 'Implemente health check completo',
      },
      devGuidanceSnapshotHash: 'hash-dev-001',
      devGuidanceGeneratedAt: '2026-07-10T12:05:00.000Z',
    };

    await updateProject({
      ...withDevContext,
      tasks: [taskWithGuidance],
    });

    const fromList = (await loadProjectsFromIndexedDB()).find(p => p.id === project.id);
    const fromId = await getProjectById(project.id);

    for (const reloaded of [fromList, fromId]) {
      expect(reloaded).toBeDefined();
      expect(reloaded?.settings?.devStack?.frameworks).toContain('NestJS');
      expect(reloaded?.devProjectFullAnalyses?.[0].summary).toBe('Análise consolidada');
      expect(reloaded?.tasks[0].devGuidance?.overview).toContain('NestJS');
      expect(reloaded?.tasks[0].devGuidanceSnapshotHash).toBe('hash-dev-001');
    }
  });
});
