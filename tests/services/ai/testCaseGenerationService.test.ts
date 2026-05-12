import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { JiraTask, TestCase } from '../../../types';

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

// Os testes unitários focam na lógica de cache em memória. A camada de
// persistência é mockada para não interferir com fake timers/IDB.
// Cobertura específica do IndexedDB vive em `testCaseGenerationCachePersistence.test.ts`.
vi.mock('../../../services/ai/testCaseGenerationCachePersistence', () => ({
  loadPersistedCacheEntry: vi.fn(async () => null),
  savePersistedCacheEntry: vi.fn(async () => undefined),
  deletePersistedCacheEntry: vi.fn(async () => undefined),
  clearPersistedCache: vi.fn(async () => undefined),
}));

import {
  generateTestArtifactsForTask,
  generateTestCasesForTask,
  isTestCasesOutdated,
  invalidateTestCaseCache,
} from '../../../services/ai/testCaseGenerationService';
import { testCaseLooksAutomated } from '../../../utils/testCaseMigration';

const buildTask = (overrides: Partial<JiraTask> = {}): JiraTask => ({
  id: 'TASK-1',
  title: 'Login de usuário',
  description: 'Permitir login com email e senha',
  status: 'To Do',
  type: 'Tarefa',
  testCases: [],
  ...overrides,
});

const buildAIResponse = (cases: Partial<TestCase>[]) => ({
  strategy: [],
  bddScenarios: [],
  testCases: cases.map((c, i) => ({
    id: c.id ?? '',
    action: c.action ?? `Caso ${i}`,
    parameters: c.parameters ?? '—',
    expectedResult: c.expectedResult ?? 'ok',
    observedResult: c.observedResult ?? '',
    status: c.status ?? 'Not Run',
    executionKind: c.executionKind,
    environment: c.environment,
    suite: c.suite,
  })),
});

beforeEach(() => {
  invalidateTestCaseCache();
  mockGenerate.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('testCaseGenerationService.generateTestCasesForTask', () => {
  it('chama o AIService e retorna os casos normalizados', async () => {
    mockGenerate.mockResolvedValueOnce(
      buildAIResponse([
        {
          action: 'Login válido',
          parameters: 'Prioridade alta; execução automatizada com Selenium',
        },
        { action: 'Login inválido' },
      ])
    );

    const task = buildTask();
    const result = await generateTestCasesForTask(task);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith(
      task.title,
      task.description,
      task.bddScenarios,
      'Estruturado',
      task.type,
      null,
      task,
      undefined
    );
    expect(result).toHaveLength(2);
    expect(result[0].action).toContain('Login válido');
    expect(result[0].executionKind).toBe('manual');
    expect(testCaseLooksAutomated(result[0])).toBe(false);
    expect(result[1].executionKind).toBe('manual');
    expect(result.every(tc => tc.status === 'Not Run')).toBe(true);
    expect(result.every(tc => typeof tc.id === 'string' && tc.id.length > 0)).toBe(true);
  });

  it('quando a IA define executionKind automatizado, métricas reconhecem automação', async () => {
    mockGenerate.mockResolvedValueOnce(
      buildAIResponse([{ action: 'Chamada API', parameters: '—', executionKind: 'automated' }])
    );
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].executionKind).toBe('automated');
    expect(testCaseLooksAutomated(result[0])).toBe(true);
  });

  it('força status Not Run mesmo quando a IA retorna outro valor', async () => {
    mockGenerate.mockResolvedValueOnce(
      buildAIResponse([{ action: 'X', status: 'Passed' as TestCase['status'] }])
    );
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].status).toBe('Not Run');
  });

  it('preserva executionKind normalizado após a geração', async () => {
    mockGenerate.mockResolvedValueOnce(
      buildAIResponse([
        { action: 'Fluxo manual', executionKind: 'manual' },
        { action: 'API', executionKind: 'Automático' },
      ])
    );
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].executionKind).toBe('manual');
    expect(result[1].executionKind).toBe('automated');
  });

  it('preserva ids fornecidos pela IA e gera novos para os ausentes', async () => {
    mockGenerate.mockResolvedValueOnce(
      buildAIResponse([
        { id: 'tc-existing', action: 'A' },
        { id: '', action: 'B' },
        { action: 'C' },
      ])
    );
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].id).toBe('tc-existing');
    expect(result[1].id).not.toBe('');
    expect(result[2].id).not.toBe('');
    const ids = new Set(result.map(tc => tc.id));
    expect(ids.size).toBe(3);
  });

  it('preenche parâmetros com placeholder quando a IA omite o campo', async () => {
    mockGenerate.mockResolvedValueOnce({
      strategy: [],
      bddScenarios: [],
      testCases: [
        { id: 'tc-x', action: 'ação mínima', expectedResult: 'ok', status: 'Not Run' },
      ],
    });
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].parameters).toBe('—');
  });

  it('descarta observedResult enviado pela IA na geração inicial', async () => {
    mockGenerate.mockResolvedValueOnce({
      strategy: [],
      bddScenarios: [],
      testCases: [
        {
          id: 'tc-obs',
          action: 'Executar fluxo',
          parameters: '—',
          expectedResult: 'Sucesso',
          observedResult: 'conteúdo inválido da IA',
        },
      ],
    });
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].observedResult).toBe('');
  });

  it('usa placeholder quando expectedResult vem vazio da IA', async () => {
    mockGenerate.mockResolvedValueOnce({
      strategy: [],
      bddScenarios: [],
      testCases: [
        { id: 'tc-exp', action: 'Passo', parameters: '—', expectedResult: '', status: 'Not Run' },
      ],
    });
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].expectedResult).toMatch(/Resultado esperado não gerado/);
  });

  it('converte \\n literal entre passos numerados em quebras de linha reais', async () => {
    const flat =
      '1. Abrir o sistema\\n2. Fazer login\\n3. Validar painel';
    mockGenerate.mockResolvedValueOnce({
      strategy: [],
      bddScenarios: [],
      testCases: [
        {
          id: 'tc-nl',
          action: flat,
          parameters: '- dado A\\n- dado B',
          expectedResult: '• ok 1\\n• ok 2',
          status: 'Not Run',
        },
      ],
    });
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].action.split('\n')).toHaveLength(3);
    expect(result[0].action).toContain('1. Abrir');
    expect(result[0].parameters.split('\n')).toHaveLength(2);
    expect(result[0].expectedResult.split('\n')).toHaveLength(2);
  });

  it('não interpreta \\n dentro de caminho Windows (ex.: C:\\notes) como nova linha', async () => {
    const withWinPath = '1. Abrir o arquivo em C:\\notes\\relatorio.txt';
    mockGenerate.mockResolvedValueOnce({
      strategy: [],
      bddScenarios: [],
      testCases: [
        {
          id: 'tc-path',
          action: withWinPath,
          parameters: '—',
          expectedResult: 'Documento exibido.',
          status: 'Not Run',
        },
      ],
    });
    const result = await generateTestCasesForTask(buildTask());
    expect(result[0].action.split('\n')).toHaveLength(1);
    expect(result[0].action).toContain('C:\\notes\\relatorio');
  });

  it('blinda contra testCases não-array do retorno da IA', async () => {
    mockGenerate.mockResolvedValueOnce({
      strategy: [],
      bddScenarios: [],
      testCases: undefined,
    });
    const result = await generateTestCasesForTask(buildTask());
    expect(result).toEqual([]);
  });

  it('generateTestArtifactsForTask retorna snapshotHash e generatedAt', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse([{ action: 'A' }]));
    const artifacts = await generateTestArtifactsForTask(buildTask());
    expect(typeof artifacts.snapshotHash).toBe('string');
    expect(artifacts.snapshotHash.length).toBeGreaterThan(0);
    expect(typeof artifacts.generatedAt).toBe('string');
    expect(() => new Date(artifacts.generatedAt).toISOString()).not.toThrow();
  });
});

describe('testCaseGenerationService — cache', () => {
  it('retorna do cache quando o snapshot da tarefa não muda', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse([{ action: 'A' }]));

    const task = buildTask();
    const first = await generateTestCasesForTask(task);
    const second = await generateTestCasesForTask(task);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('regenera quando o snapshot muda (ex.: descrição alterada)', async () => {
    mockGenerate
      .mockResolvedValueOnce(buildAIResponse([{ action: 'v1' }]))
      .mockResolvedValueOnce(buildAIResponse([{ action: 'v2' }]));

    const task = buildTask();
    await generateTestCasesForTask(task);
    await generateTestCasesForTask({ ...task, description: 'novo escopo' });

    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it('regenera quando bddScenarios mudam', async () => {
    mockGenerate
      .mockResolvedValueOnce(buildAIResponse([{ action: 'a' }]))
      .mockResolvedValueOnce(buildAIResponse([{ action: 'b' }]));

    const task = buildTask({
      bddScenarios: [{ id: 'b1', title: 't', gherkin: 'Dado X' }],
    });
    await generateTestCasesForTask(task);
    await generateTestCasesForTask({
      ...task,
      bddScenarios: [{ id: 'b1', title: 't', gherkin: 'Dado Y' }],
    });

    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it('respeita forceRefresh ignorando o cache válido', async () => {
    mockGenerate
      .mockResolvedValueOnce(buildAIResponse([{ action: 'A' }]))
      .mockResolvedValueOnce(buildAIResponse([{ action: 'B' }]));

    const task = buildTask();
    await generateTestCasesForTask(task);
    await generateTestCasesForTask(task, { forceRefresh: true });

    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it('regenera após o TTL expirar', async () => {
    vi.useFakeTimers();
    mockGenerate
      .mockResolvedValueOnce(buildAIResponse([{ action: 'antes' }]))
      .mockResolvedValueOnce(buildAIResponse([{ action: 'depois' }]));

    const task = buildTask();
    await generateTestCasesForTask(task);

    vi.advanceTimersByTime(1000 * 60 * 5 + 1);

    await generateTestCasesForTask(task);
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it('invalidateTestCaseCache(taskId) remove apenas a entrada da tarefa', async () => {
    mockGenerate
      .mockResolvedValueOnce(buildAIResponse([{ action: 'A1' }]))
      .mockResolvedValueOnce(buildAIResponse([{ action: 'B1' }]))
      .mockResolvedValueOnce(buildAIResponse([{ action: 'A2' }]));

    const taskA = buildTask({ id: 'A' });
    const taskB = buildTask({ id: 'B' });
    await generateTestCasesForTask(taskA);
    await generateTestCasesForTask(taskB);

    invalidateTestCaseCache('A');

    await generateTestCasesForTask(taskA);
    await generateTestCasesForTask(taskB);

    expect(mockGenerate).toHaveBeenCalledTimes(3);
  });
});

describe('testCaseGenerationService.isTestCasesOutdated', () => {
  it('retorna true quando não há cache nem hash persistido', () => {
    expect(isTestCasesOutdated(buildTask())).toBe(true);
  });

  it('retorna false logo após gerar com sucesso', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse([{ action: 'A' }]));
    const task = buildTask();
    await generateTestCasesForTask(task);
    expect(isTestCasesOutdated(task)).toBe(false);
  });

  it('retorna true quando o conteúdo da tarefa muda', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse([{ action: 'A' }]));
    const task = buildTask();
    await generateTestCasesForTask(task);
    expect(isTestCasesOutdated({ ...task, title: 'novo título' })).toBe(true);
  });

  it('respeita testCasesSnapshotHash persistido quando o cache em memória está vazio', async () => {
    mockGenerate.mockResolvedValueOnce(buildAIResponse([{ action: 'A' }]));
    const task = buildTask();
    const artifacts = await generateTestArtifactsForTask(task);
    const persistedTask: JiraTask = {
      ...task,
      testCasesSnapshotHash: artifacts.snapshotHash,
      testCasesGeneratedAt: artifacts.generatedAt,
    };

    invalidateTestCaseCache();

    expect(isTestCasesOutdated(persistedTask)).toBe(false);
    expect(isTestCasesOutdated({ ...persistedTask, title: 'mudou' })).toBe(true);
  });
});

describe('testCaseGenerationService — validação e propagação de erros', () => {
  it('lança erro quando a tarefa não tem título', async () => {
    await expect(
      generateTestCasesForTask(buildTask({ title: '   ' }))
    ).rejects.toThrow(/sem título/i);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('lança erro quando a tarefa não tem descrição', async () => {
    await expect(
      generateTestCasesForTask(buildTask({ description: '' }))
    ).rejects.toThrow(/sem descrição/i);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('repropaga erros do AIService e não preenche o cache', async () => {
    const aiError = new Error('Gemini quota exceeded');
    mockGenerate.mockRejectedValueOnce(aiError);

    const task = buildTask();
    await expect(generateTestCasesForTask(task)).rejects.toBe(aiError);
    expect(isTestCasesOutdated(task)).toBe(true);
  });
});
