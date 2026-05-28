import { Type } from '@google/genai';
import {
  Project,
  GeneralIAAnalysis,
  TaskIAAnalysis,
  TestIAAnalysis,
  JiraTask,
  TestCase,
} from '../../types';
import { resolveTaskStoryPoints } from '../../utils/taskStoryPoints';
import { resolveTaskDisplaySprint } from '../../utils/taskSprintDisplay';
import { getFormattedContext } from './documentContextService';
import { TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS } from './testGenerationPrompts';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { hashString } from '../../utils/hash';
import { logger } from '../../utils/logger';
import { parseAiJsonText } from '../../utils/aiJsonParse';

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos
/** Máximo de tarefas no contexto do prompt (análise geral mais rica em projetos grandes). */
const MAX_TASKS_IN_CONTEXT = 250;
const MAX_AI_TASKS = 20;
const MAX_AI_TESTS = 30;
/**
 * Pool de snapshots de teste para priorização (evita materializar todos os casos do projeto).
 * `selectPriorityTests` escolhe entre estes; métricas globais vêm de `aggregateTestsMetricsFromTasks`.
 */
const MAX_TEST_SNAPSHOT_POOL = 2000;
/** Análises persistidas em `generalIAAnalysis.testAnalyses` = apenas os testes priorizados (≤ MAX_AI_TESTS). */
export const MAX_PERSISTED_TEST_ANALYSES = MAX_AI_TESTS;
/** Máximo de caracteres por trecho de texto (descrição, etc.) no contexto. */
const TEXT_SNIPPET_LENGTH = 500;
/** Limite total de caracteres do prompt de análise geral (contexto expandido). */
const MAX_PROMPT_LENGTH = 40_000;
/** Mínimo de caracteres reservados ao bloco JSON de contexto no prompt. */
const MIN_CONTEXT_JSON_LENGTH = 2000;

/** Pontuação base de risco por tarefa. */
const RISK_SCORE_BASE = 20;
const RISK_SCORE_STORY_POINTS_CAP = 15;
const RISK_SCORE_STORY_POINTS_MULTIPLIER = 2;
const RISK_SCORE_LARGE_TASK_STORY_POINTS_THRESHOLD = 5;
const RISK_SCORE_COMPLEX_TASK_STORY_POINTS_THRESHOLD = 8;
const RISK_SCORE_LARGE_TASK_NO_TESTS = 15;
const RISK_SCORE_COMPLEX_TASK_NO_BDD = 10;
const RISK_SCORE_NO_DESCRIPTION = 20;
const RISK_SCORE_NO_TESTS = 25;
const RISK_SCORE_FAILED_TEST_MULTIPLIER = 5;
const RISK_SCORE_FAILED_TEST_CAP = 30;
const RISK_SCORE_PENDING_TESTS = 10;
const RISK_SCORE_NO_BDD = 8;
const RISK_SCORE_NO_STRATEGY = 8;
const RISK_SCORE_DEPENDENCIES = 5;
const RISK_SCORE_MAX = 100;

/** Multiplicador de segurança antes de normalizar texto longo (evita regex em strings massivas). */
const TRUNCATION_MULTIPLIER = 5;

const CONTEXT_TRUNCATION_NOTICE =
  '[AVISO: contexto JSON reduzido por limite de prompt — tarefas/testes menos prioritários foram omitidos; métricas globais (metrics, qualitySignals) foram preservadas.]';

const GENERAL_ANALYSIS_PROMPT_INSTRUCTIONS = `INSTRUÇÕES:
1. Gere um resumo executivo e liste problemas/riscos globais com base em qualitySignals e metrics.
2. Calcule o risco geral (overallRisk, riskScore e riskFactors) considerando métricas de tarefas e testes.
3. Para cada entrada em priorityTasks:
   - Produza um item em taskAnalyses seguindo o schema (resumo, problemas, nível de risco, score, itens faltantes, sugestões BDD, melhorias de QA).
4. Para cada entrada em priorityTests:
   - Produza um item em testAnalyses; no campo **coverage** use Markdown (listas, **negrito**), texto escaneável; evite parágrafos densos.
5. Gere missingItems, bddSuggestions e qaImprovements alinhados ao contexto.
6. Respeite o schema informado (JSON puro, sem texto adicional).

OBSERVAÇÕES IMPORTANTES:
- Foque em recomendações acionáveis e priorizadas.
- Utilize o idioma português.
- Não faça referência a tarefas/testes que não estejam presentes no contexto.
- Ao sugerir melhorias em casos de teste (quando aplicável), alinhe-se a esta padronização de roteiro:
${TEST_CASE_VISUAL_FORMAT_INSTRUCTIONS}
- Em **testAnalyses[].coverage**, priorize Markdown estruturado (listas e **negrito**); não escreva um único parágrafo longo.`;

/** Snapshot usado para hash de cache: inclui todos os campos que influenciam o resultado da análise. */
interface TaskSnapshot {
  id: string;
  title: string;
  type: JiraTask['type'];
  status: JiraTask['status'];
  priority?: string;
  description: string;
  testCasesTotal: number;
  testsPassed: number;
  testsFailed: number;
  testsNotRun: number;
  bddScenarios: number;
  hasTestStrategy: boolean;
  hasDescription: boolean;
  dependencies: number;
  storyPoints: number;
  sprintName?: string;
  riskSignals: string[];
  riskScore: number;
  riskLevel: TaskIAAnalysis['riskLevel'];
}

/** Snapshot usado para hash de cache: inclui todos os campos que influenciam o resultado da análise. */
interface TestSnapshot {
  id: string;
  taskId: string;
  taskTitle: string;
  /** Trecho normalizado da ação (roteiro). */
  description: string;
  expectedResult: string;
  status: TestCase['status'];
  /** Linhas não vazias na ação (substitui contagem de passos antigos). */
  stepsCount: number;
  issues: string[];
}

interface ProjectMetrics {
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    withoutTests: number;
    withoutDescription: number;
    withoutBDD: number;
    withoutStrategy: number;
    withFailedTests: number;
    withPendingTests: number;
    highRisk: number;
  };
  tests: {
    total: number;
    byStatus: Record<string, number>;
    missingAction: number;
    missingExpectedResult: number;
    automated: number;
  };
}

const generalAnalysisCache = new Map<
  string,
  { snapshotHash: string; expiresAt: number; analysis: GeneralIAAnalysis }
>();

const normalizeText = (value?: string, maxLength: number = TEXT_SNIPPET_LENGTH): string => {
  if (!value) return '';
  // Evita processar strings massivas (ex: base64) com regex para prevenir STATUS_STACK_OVERFLOW
  const truncatedInput =
    value.length > maxLength * TRUNCATION_MULTIPLIER
      ? value.slice(0, maxLength * TRUNCATION_MULTIPLIER)
      : value;
  const sanitized = truncatedInput.replace(/\s+/g, ' ').trim();
  if (sanitized.length <= maxLength) return sanitized;
  return `${sanitized.slice(0, maxLength)}…`;
};


const getRiskLevelFromScore = (score: number): TaskIAAnalysis['riskLevel'] => {
  if (score >= 80) return 'Crítico';
  if (score >= 60) return 'Alto';
  if (score >= 40) return 'Médio';
  return 'Baixo';
};

const calculateTaskSnapshot = (task: JiraTask): TaskSnapshot => {
  const testCases = task.testCases || [];
  const totalTests = testCases.length;
  const testsFailed = testCases.filter(tc => tc.status === 'Failed').length;
  const testsNotRun = testCases.filter(tc => tc.status === 'Not Run').length;
  const testsPassed = totalTests - testsFailed - testsNotRun;
  const hasDescription = !!task.description && task.description.trim().length > 0;
  const hasBDD = (task.bddScenarios?.length || 0) > 0;
  const hasStrategy = (task.testStrategy?.length || 0) > 0;
  const storyPoints = resolveTaskStoryPoints(task);
  const displaySprint = resolveTaskDisplaySprint(task);

  const riskSignals: string[] = [];
  let riskScore = RISK_SCORE_BASE;

  if (storyPoints > 0) {
    riskScore += Math.min(
      RISK_SCORE_STORY_POINTS_CAP,
      storyPoints * RISK_SCORE_STORY_POINTS_MULTIPLIER
    );
  }
  if (storyPoints > RISK_SCORE_LARGE_TASK_STORY_POINTS_THRESHOLD && totalTests === 0) {
    riskSignals.push('Tarefa grande sem testes');
    riskScore += RISK_SCORE_LARGE_TASK_NO_TESTS;
  }
  if (storyPoints > RISK_SCORE_COMPLEX_TASK_STORY_POINTS_THRESHOLD && !hasBDD) {
    riskSignals.push('Tarefa complexa sem BDD');
    riskScore += RISK_SCORE_COMPLEX_TASK_NO_BDD;
  }

  if (!hasDescription) {
    riskScore += RISK_SCORE_NO_DESCRIPTION;
    riskSignals.push('Sem descrição detalhada');
  }
  if (totalTests === 0) {
    riskScore += RISK_SCORE_NO_TESTS;
    riskSignals.push('Sem casos de teste');
  }
  if (testsFailed > 0) {
    riskScore += Math.min(
      RISK_SCORE_FAILED_TEST_CAP,
      testsFailed * RISK_SCORE_FAILED_TEST_MULTIPLIER
    );
    riskSignals.push(`${testsFailed} teste(s) falhando`);
  }
  if (testsNotRun > Math.max(0, totalTests - testsPassed)) {
    riskScore += RISK_SCORE_PENDING_TESTS;
    riskSignals.push('Testes pendentes de execução');
  }
  if (!hasBDD) {
    riskScore += RISK_SCORE_NO_BDD;
    riskSignals.push('Sem cenários BDD');
  }
  if (!hasStrategy) {
    riskScore += RISK_SCORE_NO_STRATEGY;
    riskSignals.push('Sem estratégia de testes');
  }
  if ((task.dependencies?.length || 0) > 0) {
    riskScore += RISK_SCORE_DEPENDENCIES;
    riskSignals.push('Possui dependências abertas');
  }

  riskScore = Math.min(RISK_SCORE_MAX, riskScore);

  return {
    id: task.id,
    title: task.title,
    type: task.type,
    status: task.status,
    priority: task.priority,
    description: normalizeText(task.description, TEXT_SNIPPET_LENGTH),
    testCasesTotal: totalTests,
    testsPassed,
    testsFailed,
    testsNotRun,
    bddScenarios: task.bddScenarios?.length || 0,
    hasTestStrategy: hasStrategy,
    hasDescription,
    dependencies: task.dependencies?.length || 0,
    storyPoints,
    sprintName: displaySprint?.name,
    riskSignals,
    riskScore,
    riskLevel: getRiskLevelFromScore(riskScore),
  };
};

const calculateTestSnapshot = (task: JiraTask, testCase: TestCase): TestSnapshot => {
  const issues: string[] = [];
  const actionLines = testCase.action
    ? testCase.action.split(/\r?\n/).filter(l => l.trim()).length
    : 0;
  const stepsCount = actionLines > 0 ? actionLines : testCase.action?.trim() ? 1 : 0;

  if (!testCase.action?.trim()) {
    issues.push('Ação não detalhada');
  }
  if (!testCase.expectedResult?.trim()) {
    issues.push('Resultado esperado ausente');
  }
  if (testCase.status === 'Failed') {
    issues.push('Teste falhando');
  }
  if (testCase.status === 'Not Run') {
    issues.push('Teste não executado');
  }

  return {
    id: testCase.id,
    taskId: task.id,
    taskTitle: task.title,
    description: normalizeText(testCase.action, 180),
    expectedResult: normalizeText(testCase.expectedResult, 180),
    status: testCase.status,
    stepsCount,
    issues,
  };
};

/** Métricas de testes sobre todas as tarefas (varredura O(n) sem array gigante de snapshots). */
const aggregateTestsMetricsFromTasks = (tasks: JiraTask[]): ProjectMetrics['tests'] => {
  const byStatus: Record<string, number> = {};
  let total = 0;
  let missingAction = 0;
  let missingExpectedResult = 0;

  for (const task of tasks) {
    for (const tc of task.testCases || []) {
      total++;
      const st = tc.status;
      byStatus[st] = (byStatus[st] || 0) + 1;
      if (!tc.action?.trim()) missingAction++;
      if (!tc.expectedResult?.trim()) missingExpectedResult++;
    }
  }

  return { total, byStatus, missingAction, missingExpectedResult, automated: 0 };
};

const buildProjectMetrics = (
  taskSnapshots: TaskSnapshot[],
  testsMetrics: ProjectMetrics['tests']
): ProjectMetrics => {
  const tasksByStatus = taskSnapshots.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  return {
    tasks: {
      total: taskSnapshots.length,
      byStatus: tasksByStatus,
      withoutTests: taskSnapshots.filter(t => t.testCasesTotal === 0).length,
      withoutDescription: taskSnapshots.filter(t => !t.hasDescription).length,
      withoutBDD: taskSnapshots.filter(t => t.bddScenarios === 0).length,
      withoutStrategy: taskSnapshots.filter(t => !t.hasTestStrategy).length,
      withFailedTests: taskSnapshots.filter(t => t.testsFailed > 0).length,
      withPendingTests: taskSnapshots.filter(t => t.testsNotRun > 0).length,
      highRisk: taskSnapshots.filter(t => t.riskLevel === 'Crítico' || t.riskLevel === 'Alto')
        .length,
    },
    tests: testsMetrics,
  };
};

const testSnapshotPriorityScore = (test: TestSnapshot): number => {
  let total = 0;
  if (test.status === 'Failed') total += 30;
  if (test.status === 'Not Run') total += 15;
  total += test.issues.length * 5;
  return total;
};

/**
 * Mantém até `maxKeep` snapshots com maior score de prioridade, sem alocar um array com todos os casos.
 */
const collectTestSnapshotsForPool = (tasks: JiraTask[], maxKeep: number): TestSnapshot[] => {
  let totalCases = 0;
  for (const t of tasks) {
    totalCases += (t.testCases || []).length;
  }

  if (totalCases <= maxKeep) {
    return tasks.flatMap(task => (task.testCases || []).map(tc => calculateTestSnapshot(task, tc)));
  }

  type Slot = { snap: TestSnapshot; score: number };
  const pool: Slot[] = [];

  for (const task of tasks) {
    for (const tc of task.testCases || []) {
      const snap = calculateTestSnapshot(task, tc);
      const score = testSnapshotPriorityScore(snap);

      if (pool.length < maxKeep) {
        pool.push({ snap, score });
        continue;
      }

      let minIdx = 0;
      for (let i = 1; i < pool.length; i++) {
        if (pool[i].score < pool[minIdx].score) minIdx = i;
      }
      if (score > pool[minIdx].score) {
        pool[minIdx] = { snap, score };
      }
    }
  }

  return pool.sort((a, b) => b.score - a.score).map(p => p.snap);
};

const buildQualitySignals = (metrics: ProjectMetrics, tasks: TaskSnapshot[]): string[] => {
  const signals: string[] = [];

  if (metrics.tasks.withoutTests > 0) {
    signals.push(`${metrics.tasks.withoutTests} tarefa(s) sem casos de teste documentados.`);
  }
  if (metrics.tasks.withoutDescription > 0) {
    signals.push(`${metrics.tasks.withoutDescription} tarefa(s) sem descrição adequada.`);
  }
  if (metrics.tasks.withFailedTests > 0) {
    signals.push(`${metrics.tasks.withFailedTests} tarefa(s) com testes falhando.`);
  }
  if (metrics.tests.missingAction > 0) {
    signals.push(`${metrics.tests.missingAction} caso(s) de teste sem ação descrita.`);
  }
  if (metrics.tests.missingExpectedResult > 0) {
    signals.push(`${metrics.tests.missingExpectedResult} caso(s) sem resultado esperado.`);
  }
  if (metrics.tasks.withPendingTests > 0) {
    signals.push(`${metrics.tasks.withPendingTests} tarefa(s) com testes não executados.`);
  }
  if (metrics.tasks.withoutBDD > 0) {
    signals.push(`${metrics.tasks.withoutBDD} tarefa(s) sem cenários BDD.`);
  }

  // adicionar destaque das 3 tarefas com maior risco
  const topRiskTasks = [...tasks]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)
    .map(task => `${task.title} (${task.riskLevel})`);

  if (topRiskTasks.length > 0) {
    signals.push(`Tarefas de maior risco: ${topRiskTasks.join(', ')}.`);
  }

  return signals.slice(0, 8);
};

const selectPriorityTasks = (tasks: TaskSnapshot[]): TaskSnapshot[] => {
  if (tasks.length <= MAX_AI_TASKS) {
    return tasks;
  }

  return [...tasks].sort((a, b) => b.riskScore - a.riskScore).slice(0, MAX_AI_TASKS);
};

const selectPriorityTests = (tests: TestSnapshot[]): TestSnapshot[] => {
  if (tests.length <= MAX_AI_TESTS) {
    return tests;
  }

  return [...tests]
    .sort((a, b) => testSnapshotPriorityScore(b) - testSnapshotPriorityScore(a))
    .slice(0, MAX_AI_TESTS);
};

/** Hash determinístico de um TaskSnapshot, usado em `TaskIAAnalysis.snapshotHash`. */
const computeTaskSnapshotHash = (snapshot: TaskSnapshot): string =>
  hashString(JSON.stringify(snapshot));

/** Hash determinístico de um TestSnapshot, usado em `TestIAAnalysis.snapshotHash`. */
const computeTestSnapshotHash = (snapshot: TestSnapshot): string =>
  hashString(JSON.stringify(snapshot));

const buildTaskHeuristicAnalysis = (snapshot: TaskSnapshot): TaskIAAnalysis => {
  const missingItems: string[] = [];
  if (!snapshot.hasDescription) missingItems.push('Adicionar descrição detalhada da tarefa.');
  if (snapshot.testCasesTotal === 0)
    missingItems.push('Criar casos de teste funcionais e negativos.');
  if (snapshot.testsNotRun > 0) missingItems.push('Executar casos de teste pendentes.');
  if (!snapshot.hasTestStrategy)
    missingItems.push('Documentar estratégia de testes alinhada ao risco.');

  const bddSuggestions =
    snapshot.bddScenarios > 0
      ? []
      : [`Criar ao menos um cenário BDD cobrindo o fluxo principal de "${snapshot.title}".`];

  const detectedProblems = [
    ...snapshot.riskSignals,
    snapshot.testsFailed > 0 ? `${snapshot.testsFailed} teste(s) falhando.` : '',
    snapshot.testsNotRun > 0 ? `${snapshot.testsNotRun} teste(s) não executados.` : '',
  ].filter(Boolean);

  const qaImprovements = [
    snapshot.testsFailed > 0
      ? 'Investigue as falhas registradas e ajuste critérios de aceite.'
      : '',
    snapshot.testsNotRun > 0 ? 'Inclua os testes pendentes no próximo ciclo de execução.' : '',
    !snapshot.hasTestStrategy
      ? 'Descreva ferramentas e técnicas planejadas na estratégia de testes.'
      : '',
  ].filter(Boolean);

  if (qaImprovements.length === 0) {
    qaImprovements.push('Monitore métricas de qualidade e mantenha evidências atualizadas.');
  }

  const summary = `Avaliação automática: tarefa em ${snapshot.status} com risco ${snapshot.riskLevel} e ${snapshot.testCasesTotal} teste(s) mapeados.`;

  return {
    taskId: snapshot.id,
    summary,
    detectedProblems: detectedProblems.slice(0, 5),
    riskLevel: snapshot.riskLevel,
    riskScore: snapshot.riskScore,
    missingItems,
    bddSuggestions,
    qaImprovements,
    generatedAt: new Date().toISOString(),
    isOutdated: false,
    snapshotHash: computeTaskSnapshotHash(snapshot),
  };
};

const buildTestHeuristicAnalysis = (snapshot: TestSnapshot): TestIAAnalysis => {
  const detectedProblems =
    snapshot.issues.length > 0
      ? snapshot.issues
      : ['Nenhum problema crítico detectado automaticamente.'];

  const suggestions: string[] = [];
  if (snapshot.status !== 'Passed') {
    suggestions.push('Reexecutar o teste em ambiente controlado e registrar evidências.');
  }
  if (snapshot.stepsCount === 0) {
    suggestions.push('Detalhar a ação executável no roteiro para padronizar a execução.');
  }
  if (!snapshot.expectedResult) {
    suggestions.push('Documentar o resultado esperado para facilitar a validação.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Monitorar o teste em regressões futuras.');
  }

  const coverage = `Roteiro com ${snapshot.stepsCount} linha(s) de ação documentada(s).`;

  return {
    testId: snapshot.id,
    taskId: snapshot.taskId,
    summary: `Resumo automático (${snapshot.status}) para "${snapshot.description}".`,
    coverage,
    detectedProblems,
    suggestions,
    generatedAt: new Date().toISOString(),
    isOutdated: false,
    snapshotHash: computeTestSnapshotHash(snapshot),
  };
};

const getCachedAnalysis = (key: string, hash: string): GeneralIAAnalysis | null => {
  const cached = generalAnalysisCache.get(key);
  if (!cached) return null;
  if (cached.snapshotHash !== hash) return null;
  if (cached.expiresAt < Date.now()) {
    generalAnalysisCache.delete(key);
    return null;
  }
  return cached.analysis;
};

const setCachedAnalysis = (key: string, hash: string, analysis: GeneralIAAnalysis): void => {
  generalAnalysisCache.set(key, {
    snapshotHash: hash,
    expiresAt: Date.now() + CACHE_TTL_MS,
    analysis,
  });
};

/**
 * Remove a entrada em memória da análise geral do projeto (mesmo `snapshotHash` antigo).
 * O fluxo por snapshot já evita exibir análise obsoleta; esta chamada libera RAM de modo previsível.
 * O store invalida quando `getGeneralIAAnalysisSnapshotHash` muda ou ao excluir o projeto.
 */
export function invalidateGeneralAnalysisCache(projectId: string): void {
  generalAnalysisCache.delete(`general-ia-analysis:${projectId}`);
}

const getFallbackRiskScore = (taskAnalyses: TaskIAAnalysis[]): number => {
  if (taskAnalyses.length === 0) return 35;
  const total = taskAnalyses.reduce((acc, task) => acc + (task.riskScore || 0), 0);
  return Math.round(total / taskAnalyses.length);
};

const generalAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description:
        'Um resumo geral consolidado de todas as tarefas e testes do projeto, destacando pontos principais, status geral e recomendações estratégicas.',
    },
    detectedProblems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Lista de problemas críticos detectados em todo o projeto (ex: falta de testes, tarefas sem descrição, riscos de qualidade).',
    },
    riskCalculation: {
      type: Type.OBJECT,
      properties: {
        overallRisk: {
          type: Type.STRING,
          enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
          description: 'Nível de risco geral do projeto baseado em todas as análises.',
        },
        riskScore: {
          type: Type.NUMBER,
          description:
            'Score de risco numérico de 0 a 100, onde 0 é sem risco e 100 é risco crítico.',
        },
        riskFactors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              factor: { type: Type.STRING, description: 'Nome do fator de risco identificado.' },
              impact: {
                type: Type.STRING,
                enum: ['Baixo', 'Médio', 'Alto'],
                description: 'Impacto deste fator no projeto.',
              },
              description: {
                type: Type.STRING,
                description: 'Descrição detalhada do fator de risco.',
              },
            },
            required: ['factor', 'impact', 'description'],
          },
          description: 'Lista de fatores de risco identificados no projeto.',
        },
      },
      required: ['overallRisk', 'riskScore', 'riskFactors'],
    },
    missingItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Lista de itens faltantes ou incompletos no projeto (ex: testes não criados, documentação ausente, cenários BDD faltantes).',
    },
    bddSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING, description: 'ID da tarefa que precisa de cenários BDD.' },
          taskTitle: { type: Type.STRING, description: 'Título da tarefa.' },
          scenarios: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de cenários BDD sugeridos em formato Gherkin.',
          },
        },
        required: ['taskId', 'taskTitle', 'scenarios'],
      },
      description:
        'Sugestões de cenários BDD para tarefas que ainda não os possuem ou precisam de mais.',
    },
    qaImprovements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Lista de melhorias de QA recomendadas para o projeto como um todo.',
    },
    taskAnalyses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          summary: { type: Type.STRING, description: 'Resumo da análise da tarefa.' },
          detectedProblems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Problemas específicos detectados nesta tarefa.',
          },
          riskLevel: {
            type: Type.STRING,
            enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
            description: 'Nível de risco desta tarefa específica.',
          },
          riskScore: {
            type: Type.NUMBER,
            description: 'Score de risco de 0 a 100 para esta tarefa.',
          },
          missingItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Itens faltantes específicos desta tarefa.',
          },
          bddSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Sugestões de cenários BDD para esta tarefa.',
          },
          qaImprovements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Melhorias de QA específicas para esta tarefa.',
          },
        },
        required: [
          'taskId',
          'summary',
          'detectedProblems',
          'riskLevel',
          'riskScore',
          'missingItems',
          'bddSuggestions',
          'qaImprovements',
        ],
      },
      description: 'Análises individuais detalhadas para cada tarefa do projeto.',
    },
    testAnalyses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          testId: { type: Type.STRING },
          taskId: { type: Type.STRING },
          summary: { type: Type.STRING, description: 'Resumo da análise do teste.' },
          coverage: {
            type: Type.STRING,
            description:
              'Cobertura e qualidade do roteiro em Markdown ENXUTO: use **negrito** para lacunas ou riscos críticos; listas (`-`, `•` ou numeradas) para achados; evite parágrafos longos — prefira vários blocos curtos com linhas em branco entre eles.',
          },
          detectedProblems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Problemas detectados neste teste específico.',
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Sugestões de melhoria para este teste.',
          },
        },
        required: ['testId', 'taskId', 'summary', 'coverage', 'detectedProblems', 'suggestions'],
      },
      description: 'Análises individuais detalhadas para cada teste do projeto.',
    },
  },
  required: [
    'summary',
    'detectedProblems',
    'riskCalculation',
    'missingItems',
    'bddSuggestions',
    'qaImprovements',
    'taskAnalyses',
    'testAnalyses',
  ],
};

/** Monta o payload e hash usados na análise geral (API e UI de freshness). */
function buildGeneralIaAnalysisSnapshot(project: Project): {
  snapshotHash: string;
  snapshotJsonCompact: string;
  taskSnapshots: TaskSnapshot[];
  priorityTests: TestSnapshot[];
  tasksForContext: JiraTask[];
} {
  const tasksForContext = project.tasks.slice(0, MAX_TASKS_IN_CONTEXT);
  const taskSnapshots = tasksForContext.map(calculateTaskSnapshot);
  const testsMetrics = aggregateTestsMetricsFromTasks(tasksForContext);
  const testSnapshotsPool = collectTestSnapshotsForPool(tasksForContext, MAX_TEST_SNAPSHOT_POOL);

  const metrics = buildProjectMetrics(taskSnapshots, testsMetrics);
  const qualitySignals = buildQualitySignals(metrics, taskSnapshots);
  const priorityTasks = selectPriorityTasks(taskSnapshots);
  const priorityTests = selectPriorityTests(testSnapshotsPool);

  const snapshotPayload = {
    project: {
      id: project.id,
      name: project.name,
      description: normalizeText(project.description, 400),
      tags: project.tags || [],
    },
    metrics,
    qualitySignals,
    priorityTasks,
    priorityTests,
  };

  const snapshotJsonCompact = JSON.stringify(snapshotPayload);
  const snapshotHash = hashString(snapshotJsonCompact);

  return {
    snapshotHash,
    snapshotJsonCompact,
    taskSnapshots,
    priorityTests,
    tasksForContext,
  };
}

/** Hash atual do projeto para comparar com `GeneralIAAnalysis.snapshotHash` (freshness na UI). */
export function getGeneralIAAnalysisSnapshotHash(project: Project): string {
  return buildGeneralIaAnalysisSnapshot(project).snapshotHash;
}

/** Hash do snapshot de tarefa usado em `TaskIAAnalysis.snapshotHash`. */
export function getTaskIaAnalysisSnapshotHash(task: JiraTask): string {
  return computeTaskSnapshotHash(calculateTaskSnapshot(task));
}

/** Nível de risco para exibição (análise persistida ou heurística do snapshot atual). */
export function getTaskQaRiskLevel(task: JiraTask): TaskIAAnalysis['riskLevel'] {
  return task.iaAnalysis?.riskLevel ?? getTaskQaRiskSnapshot(task).riskLevel;
}

/** Score, nível e sinais heurísticos de risco (testável; ignora análise IA persistida). */
export function getTaskQaRiskSnapshot(task: JiraTask): Pick<
  TaskSnapshot,
  'riskScore' | 'riskLevel' | 'riskSignals'
> {
  const { riskScore, riskLevel, riskSignals } = calculateTaskSnapshot(task);
  return { riskScore, riskLevel, riskSignals };
}

/** Sinais heurísticos de risco (tooltip no card; ignora análise IA persistida). */
export function getTaskQaRiskSignals(task: JiraTask): string[] {
  return getTaskQaRiskSnapshot(task).riskSignals;
}

/** Hash do snapshot de teste usado em `TestIAAnalysis.snapshotHash`. */
export function getTestIaAnalysisSnapshotHash(task: JiraTask, testCase: TestCase): string {
  return computeTestSnapshotHash(calculateTestSnapshot(task, testCase));
}

interface GeneralAnalysisSnapshotPayload {
  project: {
    id: string;
    name: string;
    description: string;
    tags: string[];
  };
  metrics: ProjectMetrics;
  qualitySignals: string[];
  priorityTasks: TaskSnapshot[];
  priorityTests: TestSnapshot[];
  _truncationNotice?: string;
}

/**
 * Reduz o JSON de contexto preservando métricas globais e removendo tarefas/testes menos prioritários.
 * INSTRUÇÕES e schema (via API) permanecem intactos — apenas o bloco JSON é ajustado.
 */
function shrinkSnapshotJsonForPrompt(compactJson: string, maxLen: number): string {
  if (compactJson.length <= maxLen) return compactJson;

  try {
    const payload = JSON.parse(compactJson) as GeneralAnalysisSnapshotPayload;
    let tasks = [...payload.priorityTasks];
    let tests = [...payload.priorityTests];

    const buildCandidate = (): string =>
      JSON.stringify({
        project: payload.project,
        metrics: payload.metrics,
        qualitySignals: payload.qualitySignals,
        priorityTasks: tasks,
        priorityTests: tests,
        _truncationNotice: CONTEXT_TRUNCATION_NOTICE,
      });

    let candidate = buildCandidate();
    let guard = 0;

    while (candidate.length > maxLen && guard++ < 500) {
      if (tests.length > 0) {
        const removeCount = Math.max(1, Math.ceil(tests.length * 0.12));
        tests = tests.slice(0, tests.length - removeCount);
      } else if (tasks.length > 1) {
        const removeCount = Math.max(1, Math.ceil((tasks.length - 1) * 0.12));
        tasks = tasks.slice(0, tasks.length - removeCount);
      } else {
        break;
      }
      candidate = buildCandidate();
    }

    if (candidate.length <= maxLen) return candidate;

    const minimal = JSON.stringify({
      project: payload.project,
      metrics: payload.metrics,
      qualitySignals: payload.qualitySignals,
      priorityTasks: tasks.slice(0, 1),
      priorityTests: [],
      _truncationNotice: CONTEXT_TRUNCATION_NOTICE,
    });
    if (minimal.length <= maxLen) return minimal;

    const noticeSuffix = `\n${CONTEXT_TRUNCATION_NOTICE}`;
    return `${compactJson.slice(0, Math.max(0, maxLen - noticeSuffix.length))}${noticeSuffix}`;
  } catch {
    const noticeSuffix = `\n${CONTEXT_TRUNCATION_NOTICE}`;
    return `${compactJson.slice(0, Math.max(0, maxLen - noticeSuffix.length))}${noticeSuffix}`;
  }
}

function buildGeneralAnalysisPrompt(documentContext: string, snapshotJsonCompact: string): string {
  const headerPrefix = `${documentContext}
Você é um especialista sênior em QA e precisa produzir uma análise estratégica e acionável.
Use o contexto JSON fornecido (tarefas e testes mais críticos já foram filtrados para você).

CONTEXTO E MÉTRICAS (JSON compacto):
`;

  const headerSuffix = '\n\n';
  const fixedLen =
    headerPrefix.length + headerSuffix.length + GENERAL_ANALYSIS_PROMPT_INSTRUCTIONS.length;
  const maxJsonLen = Math.max(MIN_CONTEXT_JSON_LENGTH, MAX_PROMPT_LENGTH - fixedLen);
  const contextJsonBlock = shrinkSnapshotJsonForPrompt(snapshotJsonCompact, maxJsonLen);

  return `${headerPrefix}${contextJsonBlock}${headerSuffix}${GENERAL_ANALYSIS_PROMPT_INSTRUCTIONS}`;
}

/**
 * Gera uma análise geral consolidada de todas as tarefas e testes do projeto
 */
export async function generateGeneralIAAnalysis(project: Project): Promise<GeneralIAAnalysis> {
  try {
    const {
      snapshotHash,
      snapshotJsonCompact,
      taskSnapshots,
      priorityTests,
    } = buildGeneralIaAnalysisSnapshot(project);
    const cacheKey = `general-ia-analysis:${project.id}`;

    const cached = getCachedAnalysis(cacheKey, snapshotHash);
    if (cached) {
      return cached;
    }

    const documentContext = await getFormattedContext(project);
    const finalPrompt = buildGeneralAnalysisPrompt(documentContext, snapshotJsonCompact);

    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: generalAnalysisSchema,
      },
    });

    const parsedResponse = parseAiJsonText(response.text) as Partial<GeneralIAAnalysis> & {
      taskAnalyses?: TaskIAAnalysis[];
      testAnalyses?: TestIAAnalysis[];
    };

    const aiTaskAnalysesMap = new Map<string, TaskIAAnalysis>(
      (parsedResponse.taskAnalyses || []).map((analysis: TaskIAAnalysis) => [
        analysis.taskId,
        analysis,
      ])
    );

    const aiTestAnalysesMap = new Map<string, TestIAAnalysis>(
      (parsedResponse.testAnalyses || []).map((analysis: TestIAAnalysis) => [
        analysis.testId,
        analysis,
      ])
    );

    const finalTaskAnalyses: TaskIAAnalysis[] = taskSnapshots.map(snapshot => {
      const aiAnalysis = aiTaskAnalysesMap.get(snapshot.id);
      if (aiAnalysis) {
        return {
          taskId: aiAnalysis.taskId,
          summary: aiAnalysis.summary || 'Análise da tarefa.',
          detectedProblems: aiAnalysis.detectedProblems || [],
          riskLevel: aiAnalysis.riskLevel || snapshot.riskLevel,
          riskScore:
            typeof aiAnalysis.riskScore === 'number' ? aiAnalysis.riskScore : snapshot.riskScore,
          missingItems: aiAnalysis.missingItems || [],
          bddSuggestions: aiAnalysis.bddSuggestions || [],
          qaImprovements: aiAnalysis.qaImprovements || [],
          generatedAt: new Date().toISOString(),
          isOutdated: false,
          snapshotHash: computeTaskSnapshotHash(snapshot),
        };
      }

      return buildTaskHeuristicAnalysis(snapshot);
    });

    const finalTestAnalyses: TestIAAnalysis[] = priorityTests.map(snapshot => {
      const aiAnalysis = aiTestAnalysesMap.get(snapshot.id);
      if (aiAnalysis) {
        return {
          testId: aiAnalysis.testId,
          taskId: aiAnalysis.taskId,
          summary: aiAnalysis.summary || 'Análise do teste.',
          coverage: aiAnalysis.coverage || 'Cobertura não avaliada.',
          detectedProblems: aiAnalysis.detectedProblems || [],
          suggestions: aiAnalysis.suggestions || [],
          generatedAt: new Date().toISOString(),
          isOutdated: false,
          snapshotHash: computeTestSnapshotHash(snapshot),
        };
      }

      return buildTestHeuristicAnalysis(snapshot);
    });

    const fallbackRiskScore = getFallbackRiskScore(finalTaskAnalyses);

    const analysis: GeneralIAAnalysis = {
      summary: parsedResponse.summary || 'Análise geral do projeto.',
      detectedProblems: parsedResponse.detectedProblems || [],
      riskCalculation: {
        overallRisk:
          parsedResponse.riskCalculation?.overallRisk || getRiskLevelFromScore(fallbackRiskScore),
        riskScore: parsedResponse.riskCalculation?.riskScore ?? fallbackRiskScore,
        riskFactors: parsedResponse.riskCalculation?.riskFactors || [],
      },
      missingItems: parsedResponse.missingItems || [],
      bddSuggestions: parsedResponse.bddSuggestions || [],
      qaImprovements: parsedResponse.qaImprovements || [],
      taskAnalyses: finalTaskAnalyses,
      testAnalyses: finalTestAnalyses,
      generatedAt: new Date().toISOString(),
      isOutdated: false,
      snapshotHash,
    };

    setCachedAnalysis(cacheKey, snapshotHash, analysis);

    return analysis;
  } catch (error) {
    logger.error('Erro ao gerar análise geral de IA', 'generalAnalysisService', error);
    throw new Error(
      'Falha ao gerar análise geral de IA. Verifique a configuração da API e tente novamente.'
    );
  }
}
