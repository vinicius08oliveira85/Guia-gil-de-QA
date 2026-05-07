import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TestGenerationArtifacts } from '../../../services/ai/testCaseGenerationService';

const mockGenerate = vi.fn();

vi.mock('../../../services/ai/aiServiceFactory', () => ({
  getAIService: () => ({
    generateTestCasesForTask: mockGenerate,
  }),
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  __resetInMemoryCacheForTests,
  generateTestArtifactsForTask,
  invalidateTestCaseCache,
} from '../../../services/ai/testCaseGenerationService';
import {
  loadPersistedCacheEntry,
  savePersistedCacheEntry,
  deletePersistedCacheEntry,
  clearPersistedCache,
} from '../../../services/ai/testCaseGenerationCachePersistence';
import type { JiraTask } from '../../../types';

const buildTask = (overrides: Partial<JiraTask> = {}): JiraTask => ({
  id: 'TASK-PERSIST-1',
  title: 'Persistência de cache',
  description: 'Garante que o cache persistido sobrevive a recarregamentos.',
  status: 'To Do',
  type: 'Tarefa',
  testCases: [],
  ...overrides,
});

const buildAIResponse = (action: string) => ({
  strategy: [],
  bddScenarios: [],
  testCases: [
    {
      id: '',
      action,
      parameters: '—',
      expectedResult: 'ok',
      observedResult: '',
      status: 'Not Run' as const,
    },
  ],
});

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(async () => {
  __resetInMemoryCacheForTests();
  await clearPersistedCache();
  mockGenerate.mockReset();
});

describe('testCaseGenerationCachePersistence', () => {
  it('persiste o entry no IndexedDB após gerar artefatos', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse('persistido'));

    const task = buildTask();
    const artifacts = await generateTestArtifactsForTask(task);
    await flushMicrotasks();

    const entry = await loadPersistedCacheEntry(task.id);
    expect(entry).not.toBeNull();
    expect(entry!.hash).toBe(artifacts.snapshotHash);
    expect(entry!.artifacts.testCases).toHaveLength(1);
    expect(entry!.artifacts.testCases[0].action).toBe('persistido');
  });

  it('aquece o cache em memória a partir do entry persistido (cenário "reload")', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse('original'));

    const task = buildTask();
    const original = await generateTestArtifactsForTask(task);
    await flushMicrotasks();

    __resetInMemoryCacheForTests();

    const second = await generateTestArtifactsForTask(task);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(second.snapshotHash).toBe(original.snapshotHash);
    expect(second.testCases[0].action).toBe('original');
  });

  it('descarta entry persistido com hash divergente e regenera', async () => {
    mockGenerate
      .mockResolvedValueOnce(buildAIResponse('v1'))
      .mockResolvedValueOnce(buildAIResponse('v2'));

    const task = buildTask();
    await generateTestArtifactsForTask(task);
    await flushMicrotasks();

    __resetInMemoryCacheForTests();

    const next = await generateTestArtifactsForTask({
      ...task,
      description: 'descrição diferente',
    });
    await flushMicrotasks();

    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(next.testCases[0].action).toBe('v2');
  });

  it('invalidateTestCaseCache(taskId) remove o entry persistido', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse('A'));
    const task = buildTask();
    await generateTestArtifactsForTask(task);
    await flushMicrotasks();

    expect(await loadPersistedCacheEntry(task.id)).not.toBeNull();

    invalidateTestCaseCache(task.id);
    await flushMicrotasks();

    expect(await loadPersistedCacheEntry(task.id)).toBeNull();
  });

  it('savePersistedCacheEntry/deletePersistedCacheEntry isolados funcionam corretamente', async () => {
    const artifacts: TestGenerationArtifacts = {
      testCases: [],
      strategy: [],
      bddScenarios: [],
      snapshotHash: 'abc123',
      generatedAt: new Date().toISOString(),
    };

    await savePersistedCacheEntry({
      taskId: 'manual-1',
      hash: 'abc123',
      expiresAt: Date.now() + 60_000,
      artifacts,
    });

    const entry = await loadPersistedCacheEntry('manual-1');
    expect(entry?.hash).toBe('abc123');

    await deletePersistedCacheEntry('manual-1');
    expect(await loadPersistedCacheEntry('manual-1')).toBeNull();
  });
});
