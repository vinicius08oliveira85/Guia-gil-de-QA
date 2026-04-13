import { Type } from "@google/genai";
import { Project, GeneralIAAnalysis, TaskIAAnalysis, TestIAAnalysis, JiraTask, TestCase } from '../../types';
import { getFormattedContext } from './documentContextService';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { logger } from '../../utils/logger';

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
/** Espaço reservado para instruções fixas + margem ao montar o prompt com JSON embutido. */
const PROMPT_TEMPLATE_RESERVE = 2400;

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
  riskSignals: string[];
  riskScore: number;
  riskLevel: TaskIAAnalysis['riskLevel'];
}

/** Snapshot usado para hash de cache: inclui todos os campos que influenciam o resultado da análise. */
interface TestSnapshot {
  id: string;
  taskId: string;
  taskTitle: string;
  description: string;
  expectedResult: string;
  status: TestCase['status'];
  priority?: string;
  stepsCount: number;
  isAutomated: boolean;
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
    missingSteps: number;
    missingExpectedResult: number;
    automated: number;
  };
}

const generalAnalysisCache = new Map<string, { snapshotHash: string; expiresAt: number; analysis: GeneralIAAnalysis }>();

const normalizeText = (value?: string, maxLength: number = TEXT_SNIPPET_LENGTH): string => {
  if (!value) return '';
  const sanitized = value.replace(/\s+/g, ' ').trim();
  if (sanitized.length <= maxLength) return sanitized;
  return `${sanitized.slice(0, maxLength)}…`;
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
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

  const riskSignals: string[] = [];
  let riskScore = 20;

  if (!hasDescription) {
    riskScore += 20;
    riskSignals.push('Sem descrição detalhada');
  }
  if (totalTests === 0) {
    riskScore += 25;
    riskSignals.push('Sem casos de teste');
  }
  if (testsFailed > 0) {
    riskScore += Math.min(30, testsFailed * 5);
    riskSignals.push(`${testsFailed} teste(s) falhando`);
  }
  if (testsNotRun > Math.max(0, totalTests - testsPassed)) {
    riskScore += 10;
    riskSignals.push('Testes pendentes de execução');
  }
  if (!hasBDD) {
    riskScore += 8;
    riskSignals.push('Sem cenários BDD');
  }
  if (!hasStrategy) {
    riskScore += 8;
    riskSignals.push('Sem estratégia de testes');
  }
  if ((task.dependencies?.length || 0) > 0) {
    riskScore += 5;
    riskSignals.push('Possui dependências abertas');
  }

  riskScore = Math.min(100, riskScore);

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
    riskSignals,
    riskScore,
    riskLevel: getRiskLevelFromScore(riskScore)
  };
};

const calculateTestSnapshot = (task: JiraTask, testCase: TestCase): TestSnapshot => {
  const issues: string[] = [];
  if (!testCase.steps || testCase.steps.length === 0) {
    issues.push('Passos não detalhados');
  }
  if (!testCase.expectedResult) {
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
    description: normalizeText(testCase.description, 180),
    expectedResult: normalizeText(testCase.expectedResult, 180),
    status: testCase.status,
    priority: testCase.priority,
    stepsCount: testCase.steps?.length || 0,
    isAutomated: testCase.isAutomated || false,
    issues
  };
};

/** Métricas de testes sobre todas as tarefas (varredura O(n) sem array gigante de snapshots). */
const aggregateTestsMetricsFromTasks = (tasks: JiraTask[]): ProjectMetrics['tests'] => {
  const byStatus: Record<string, number> = {};
  let total = 0;
  let missingSteps = 0;
  let missingExpectedResult = 0;
  let automated = 0;

  for (const task of tasks) {
    for (const tc of task.testCases || []) {
      total++;
      const st = tc.status;
      byStatus[st] = (byStatus[st] || 0) + 1;
      if (!tc.steps?.length) missingSteps++;
      if (!tc.expectedResult?.trim()) missingExpectedResult++;
      if (tc.isAutomated) automated++;
    }
  }

  return { total, byStatus, missingSteps, missingExpectedResult, automated };
};

const buildProjectMetrics = (taskSnapshots: TaskSnapshot[], testsMetrics: ProjectMetrics['tests']): ProjectMetrics => {
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
      highRisk: taskSnapshots.filter(t => t.riskLevel === 'Crítico' || t.riskLevel === 'Alto').length
    },
    tests: testsMetrics
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
    return tasks.flatMap((task) => (task.testCases || []).map((tc) => calculateTestSnapshot(task, tc)));
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

  return pool
    .sort((a, b) => b.score - a.score)
    .map((p) => p.snap);
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
  if (metrics.tests.missingSteps > 0) {
    signals.push(`${metrics.tests.missingSteps} caso(s) de teste sem passos descritos.`);
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

  return [...tasks]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, MAX_AI_TASKS);
};

const selectPriorityTests = (tests: TestSnapshot[]): TestSnapshot[] => {
  if (tests.length <= MAX_AI_TESTS) {
    return tests;
  }

  return [...tests]
    .sort((a, b) => testSnapshotPriorityScore(b) - testSnapshotPriorityScore(a))
    .slice(0, MAX_AI_TESTS);
};

const buildTaskHeuristicAnalysis = (snapshot: TaskSnapshot): TaskIAAnalysis => {
  const missingItems: string[] = [];
  if (!snapshot.hasDescription) missingItems.push('Adicionar descrição detalhada da tarefa.');
  if (snapshot.testCasesTotal === 0) missingItems.push('Criar casos de teste funcionais e negativos.');
  if (snapshot.testsNotRun > 0) missingItems.push('Executar casos de teste pendentes.');
  if (!snapshot.hasTestStrategy) missingItems.push('Documentar estratégia de testes alinhada ao risco.');

  const bddSuggestions = snapshot.bddScenarios > 0
    ? []
    : [`Criar ao menos um cenário BDD cobrindo o fluxo principal de "${snapshot.title}".`];

  const detectedProblems = [
    ...snapshot.riskSignals,
    snapshot.testsFailed > 0 ? `${snapshot.testsFailed} teste(s) falhando.` : '',
    snapshot.testsNotRun > 0 ? `${snapshot.testsNotRun} teste(s) não executados.` : ''
  ].filter(Boolean);

  const qaImprovements = [
    snapshot.testsFailed > 0 ? 'Investigue as falhas registradas e ajuste critérios de aceite.' : '',
    snapshot.testsNotRun > 0 ? 'Inclua os testes pendentes no próximo ciclo de execução.' : '',
    !snapshot.hasTestStrategy ? 'Descreva ferramentas e técnicas planejadas na estratégia de testes.' : ''
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
    isOutdated: false
  };
};

const buildTestHeuristicAnalysis = (snapshot: TestSnapshot): TestIAAnalysis => {
  const detectedProblems = snapshot.issues.length > 0
    ? snapshot.issues
    : ['Nenhum problema crítico detectado automaticamente.'];

  const suggestions: string[] = [];
  if (snapshot.status !== 'Passed') {
    suggestions.push('Reexecutar o teste em ambiente controlado e registrar evidências.');
  }
  if (snapshot.stepsCount === 0) {
    suggestions.push('Detalhar passos executáveis para padronizar a execução.');
  }
  if (!snapshot.expectedResult) {
    suggestions.push('Documentar o resultado esperado para facilitar a validação.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Monitorar o teste em regressões futuras.');
  }

  const coverage = `Cobertura baseada em ${snapshot.stepsCount} passo(s) documentado(s).`;

  return {
    testId: snapshot.id,
    taskId: snapshot.taskId,
    summary: `Resumo automático (${snapshot.status}) para "${snapshot.description}".`,
    coverage,
    detectedProblems,
    suggestions,
    generatedAt: new Date().toISOString(),
    isOutdated: false
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
    analysis
  });
};

/** Remove o cache de análise geral do projeto para forçar nova análise na próxima abertura. Chamar ao salvar/editar tarefa ou caso de teste. */
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
      description: "Um resumo geral consolidado de todas as tarefas e testes do projeto, destacando pontos principais, status geral e recomendações estratégicas."
    },
    detectedProblems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de problemas críticos detectados em todo o projeto (ex: falta de testes, tarefas sem descrição, riscos de qualidade)."
    },
    riskCalculation: {
      type: Type.OBJECT,
      properties: {
        overallRisk: {
          type: Type.STRING,
          enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
          description: "Nível de risco geral do projeto baseado em todas as análises."
        },
        riskScore: {
          type: Type.NUMBER,
          description: "Score de risco numérico de 0 a 100, onde 0 é sem risco e 100 é risco crítico."
        },
        riskFactors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              factor: { type: Type.STRING, description: "Nome do fator de risco identificado." },
              impact: {
                type: Type.STRING,
                enum: ['Baixo', 'Médio', 'Alto'],
                description: "Impacto deste fator no projeto."
              },
              description: { type: Type.STRING, description: "Descrição detalhada do fator de risco." }
            },
            required: ['factor', 'impact', 'description']
          },
          description: "Lista de fatores de risco identificados no projeto."
        }
      },
      required: ['overallRisk', 'riskScore', 'riskFactors']
    },
    missingItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de itens faltantes ou incompletos no projeto (ex: testes não criados, documentação ausente, cenários BDD faltantes)."
    },
    bddSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING, description: "ID da tarefa que precisa de cenários BDD." },
          taskTitle: { type: Type.STRING, description: "Título da tarefa." },
          scenarios: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de cenários BDD sugeridos em formato Gherkin."
          }
        },
        required: ['taskId', 'taskTitle', 'scenarios']
      },
      description: "Sugestões de cenários BDD para tarefas que ainda não os possuem ou precisam de mais."
    },
    qaImprovements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de melhorias de QA recomendadas para o projeto como um todo."
    },
    taskAnalyses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Resumo da análise da tarefa." },
          detectedProblems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Problemas específicos detectados nesta tarefa."
          },
          riskLevel: {
            type: Type.STRING,
            enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
            description: "Nível de risco desta tarefa específica."
          },
          riskScore: {
            type: Type.NUMBER,
            description: "Score de risco de 0 a 100 para esta tarefa."
          },
          missingItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Itens faltantes específicos desta tarefa."
          },
          bddSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Sugestões de cenários BDD para esta tarefa."
          },
          qaImprovements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Melhorias de QA específicas para esta tarefa."
          }
        },
        required: ['taskId', 'summary', 'detectedProblems', 'riskLevel', 'riskScore', 'missingItems', 'bddSuggestions', 'qaImprovements']
      },
      description: "Análises individuais detalhadas para cada tarefa do projeto."
    },
    testAnalyses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          testId: { type: Type.STRING },
          taskId: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Resumo da análise do teste." },
          coverage: { type: Type.STRING, description: "Avaliação da cobertura e qualidade do teste." },
          detectedProblems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Problemas detectados neste teste específico."
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Sugestões de melhoria para este teste."
          }
        },
        required: ['testId', 'taskId', 'summary', 'coverage', 'detectedProblems', 'suggestions']
      },
      description: "Análises individuais detalhadas para cada teste do projeto."
    }
  },
  required: ['summary', 'detectedProblems', 'riskCalculation', 'missingItems', 'bddSuggestions', 'qaImprovements', 'taskAnalyses', 'testAnalyses']
};

/**
 * Gera uma análise geral consolidada de todas as tarefas e testes do projeto
 */
export async function generateGeneralIAAnalysis(project: Project): Promise<GeneralIAAnalysis> {
  try {
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
        tags: project.tags || []
      },
      metrics,
      qualitySignals,
      priorityTasks,
      priorityTests
    };

    const snapshotJsonCompact = JSON.stringify(snapshotPayload);
    const snapshotHash = hashString(snapshotJsonCompact);
    const cacheKey = `general-ia-analysis:${project.id}`;

    const cached = getCachedAnalysis(cacheKey, snapshotHash);
    if (cached) {
      return cached;
    }

    const documentContext = await getFormattedContext(project);
    const maxJsonLen = Math.max(
      2000,
      MAX_PROMPT_LENGTH - documentContext.length - PROMPT_TEMPLATE_RESERVE
    );
    const contextJsonBlock =
      snapshotJsonCompact.length > maxJsonLen
        ? `${snapshotJsonCompact.slice(0, maxJsonLen - 48)}\n[...JSON truncado por limite de prompt...]`
        : snapshotJsonCompact;

    const finalPrompt = `${documentContext}
Você é um especialista sênior em QA e precisa produzir uma análise estratégica e acionável.
Use o contexto JSON fornecido (tarefas e testes mais críticos já foram filtrados para você).

CONTEXTO E MÉTRICAS (JSON compacto):
${contextJsonBlock}

INSTRUÇÕES:
1. Gere um resumo executivo e liste problemas/riscos globais com base em qualitySignals e metrics.
2. Calcule o risco geral (overallRisk, riskScore e riskFactors) considerando métricas de tarefas e testes.
3. Para cada entrada em priorityTasks:
   - Produza um item em taskAnalyses seguindo o schema (resumo, problemas, nível de risco, score, itens faltantes, sugestões BDD, melhorias de QA).
4. Para cada entrada em priorityTests:
   - Produza um item em testAnalyses com cobertura, problemas e recomendações.
5. Gere missingItems, bddSuggestions e qaImprovements alinhados ao contexto.
6. Respeite o schema informado (JSON puro, sem texto adicional).

OBSERVAÇÕES IMPORTANTES:
- Foque em recomendações acionáveis e priorizadas.
- Utilize o idioma português.
- Não faça referência a tarefas/testes que não estejam presentes no contexto.
    `.slice(0, MAX_PROMPT_LENGTH);

    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generalAnalysisSchema,
      },
    });

    const parsedResponse = JSON.parse(response.text.trim());

    const aiTaskAnalysesMap = new Map<string, any>(
      (parsedResponse.taskAnalyses || []).map((analysis: TaskIAAnalysis) => [analysis.taskId, analysis])
    );

    const aiTestAnalysesMap = new Map<string, any>(
      (parsedResponse.testAnalyses || []).map((analysis: TestIAAnalysis) => [analysis.testId, analysis])
    );

    const finalTaskAnalyses: TaskIAAnalysis[] = taskSnapshots.map(snapshot => {
      const aiAnalysis = aiTaskAnalysesMap.get(snapshot.id);
      if (aiAnalysis) {
        return {
          taskId: aiAnalysis.taskId,
          summary: aiAnalysis.summary || 'Análise da tarefa.',
          detectedProblems: aiAnalysis.detectedProblems || [],
          riskLevel: aiAnalysis.riskLevel || snapshot.riskLevel,
          riskScore: typeof aiAnalysis.riskScore === 'number' ? aiAnalysis.riskScore : snapshot.riskScore,
          missingItems: aiAnalysis.missingItems || [],
          bddSuggestions: aiAnalysis.bddSuggestions || [],
          qaImprovements: aiAnalysis.qaImprovements || [],
          generatedAt: new Date().toISOString(),
          isOutdated: false
        };
      }

      return buildTaskHeuristicAnalysis(snapshot);
    });

    const finalTestAnalyses: TestIAAnalysis[] = priorityTests.map((snapshot) => {
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
          isOutdated: false
        };
      }

      return buildTestHeuristicAnalysis(snapshot);
    });

    const fallbackRiskScore = getFallbackRiskScore(finalTaskAnalyses);

    const analysis: GeneralIAAnalysis = {
      summary: parsedResponse.summary || 'Análise geral do projeto.',
      detectedProblems: parsedResponse.detectedProblems || [],
      riskCalculation: {
        overallRisk: parsedResponse.riskCalculation?.overallRisk || getRiskLevelFromScore(fallbackRiskScore),
        riskScore: parsedResponse.riskCalculation?.riskScore ?? fallbackRiskScore,
        riskFactors: parsedResponse.riskCalculation?.riskFactors || []
      },
      missingItems: parsedResponse.missingItems || [],
      bddSuggestions: parsedResponse.bddSuggestions || [],
      qaImprovements: parsedResponse.qaImprovements || [],
      taskAnalyses: finalTaskAnalyses,
      testAnalyses: finalTestAnalyses,
      generatedAt: new Date().toISOString(),
      isOutdated: false
    };

    setCachedAnalysis(cacheKey, snapshotHash, analysis);

    return analysis;
  } catch (error) {
    logger.error("Erro ao gerar análise geral de IA", 'generalAnalysisService', error);
    throw new Error("Falha ao gerar análise geral de IA. Verifique a configuração da API e tente novamente.");
  }
}
