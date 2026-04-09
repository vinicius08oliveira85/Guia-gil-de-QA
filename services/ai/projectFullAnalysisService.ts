import { Type } from '@google/genai';
import { Project, ProjectFullAnalysis } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getFormattedContext } from './documentContextService';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { logger } from '../../utils/logger';
import { getQualityAlerts, calculateQualityScore } from '../../components/tasks/qualityMetrics';

const MAX_ANALYSES_STORED = 10;
/** Máximo de tarefas incluídas no contexto enviado ao modelo para análise completa. */
const MAX_TASKS_IN_CONTEXT = 100;
/** Máximo de caracteres por trecho de documento no contexto. */
const MAX_DOCUMENTS_SNIPPET_CHARS = 500;

const normalizeSnippet = (value: string | undefined, maxLength: number): string => {
  if (!value) return '';
  const s = value.replace(/\s+/g, ' ').trim();
  return s.length <= maxLength ? s : `${s.slice(0, maxLength)}…`;
};

function aggregateTestExecutionForContext(tasks: Project['tasks']) {
  let passed = 0;
  let failed = 0;
  let notRun = 0;
  let blocked = 0;
  const testStrategiesCount = new Map<string, number>();
  let totalTestCases = 0;

  for (const t of tasks || []) {
    for (const tc of t.testCases || []) {
      totalTestCases++;
      if (tc.status === 'Passed') passed++;
      else if (tc.status === 'Failed') failed++;
      else if (tc.status === 'Not Run') notRun++;
      else if (tc.status === 'Blocked') blocked++;
      const s = tc.executedStrategy || 'Não definida';
      testStrategiesCount.set(s, (testStrategiesCount.get(s) || 0) + 1);
    }
  }

  return { passed, failed, notRun, blocked, testStrategiesCount, totalTestCases };
}

function buildFullContext(project: Project): string {
  const metrics = calculateProjectMetrics(project);
  const tasks = project.tasks || [];
  const { passed, failed, notRun, blocked, testStrategiesCount, totalTestCases } =
    aggregateTestExecutionForContext(tasks);
  const tasksByType = { tarefa: tasks.filter(t => t.type === 'Tarefa').length, bug: tasks.filter(t => t.type === 'Bug').length };
  const taskStatus = {
    toDo: tasks.filter(t => t.type !== 'Bug' && t.status === 'To Do').length,
    inProgress: tasks.filter(t => t.type !== 'Bug' && t.status === 'In Progress').length,
    done: tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length,
    blocked: tasks.filter(t => t.type !== 'Bug' && t.status === 'Blocked').length,
  };
  const testExecution = { passed, failed, notRun, blocked };
  const totalStrategies = tasks.reduce((acc, t) => acc + (t.testStrategy?.length ?? 0), 0);
  const defectRate = metrics.totalTestCases > 0
    ? Math.round((metrics.failedTestCases / metrics.totalTestCases) * 100)
    : 0;
  const qualityMetrics = {
    coverage: metrics.testCoverage,
    passRate: metrics.testPassRate,
    defectRate,
    reopeningRate: 0,
  };
  const qualityScore = calculateQualityScore(qualityMetrics);
  const alerts = getQualityAlerts(qualityMetrics);
  const documentsInfo = (project.documents || []).map(doc => ({
    name: doc.name,
    category: doc.category,
    contentSnippet: normalizeSnippet(doc.content, MAX_DOCUMENTS_SNIPPET_CHARS),
    hasAnalysis: !!doc.analysis?.trim(),
  }));
  const tasksSummary = tasks.slice(0, MAX_TASKS_IN_CONTEXT).map(t => ({
    id: t.id,
    title: t.title?.slice(0, 80),
    type: t.type,
    status: t.status,
    priority: t.priority,
    testCasesCount: (t.testCases || []).length,
  }));
  const phasesInfo = (project.phases || []).map(p => ({ name: p.name, status: p.status }));
  const currentPhaseProgress = project.sdlcPhaseAnalysis?.progressPercentage ?? 0;

  return JSON.stringify({
    projectName: project.name,
    projectDescription: normalizeSnippet(project.description, MAX_DOCUMENTS_SNIPPET_CHARS),
    documentsCount: (project.documents || []).length,
    documents: documentsInfo,
    tasksCount: tasks.length,
    tasksByType,
    taskStatus,
    tasksSummary,
    totalTestCases,
    testExecution,
    testStrategiesCount: Object.fromEntries(testStrategiesCount),
    totalStrategies,
    qualityScore,
    qualityMetrics,
    alerts: alerts.slice(0, 10),
    phases: phasesInfo,
    currentPhase: metrics.currentPhase,
    currentPhaseProgress,
    kpis: {
      passRate: metrics.testPassRate,
      testCoverage: metrics.testCoverage,
      openBugs: metrics.openVsClosedBugs?.open ?? 0,
      closedBugs: metrics.openVsClosedBugs?.closed ?? 0,
    },
  }, null, 2);
}

const projectFullAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Resumo executivo do estado do projeto em português',
    },
    documentsAnalysis: {
      type: Type.STRING,
      description: 'Análise dos documentos: presença, qualidade, alinhamento com tarefas e testes',
    },
    tasksAnalysis: {
      type: Type.STRING,
      description: 'Análise das tarefas: distribuição, bloqueios, conclusão, prioridades',
    },
    testsAnalysis: {
      type: Type.STRING,
      description: 'Análise dos testes: cobertura, taxa de sucesso, estratégias, falhas',
    },
    indicatorsAndPhases: {
      type: Type.STRING,
      description: 'Análise dos indicadores e fases: progresso real, riscos de atraso',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Pontos fortes identificados',
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Pontos fracos identificados',
    },
    risks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Riscos identificados',
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Recomendações acionáveis',
    },
  },
  required: [
    'summary',
    'documentsAnalysis',
    'tasksAnalysis',
    'testsAnalysis',
    'indicatorsAndPhases',
    'strengths',
    'weaknesses',
    'risks',
    'recommendations',
  ],
};

/**
 * Gera análise IA completa do projeto (documentos, tarefas, testes, indicadores e fases).
 * Resultado deve ser adicionado a project.projectFullAnalyses e persistido via onUpdateProject (Supabase + IndexedDB).
 */
export async function generateProjectFullAnalysis(project: Project): Promise<ProjectFullAnalysis> {
  const documentContext = await getFormattedContext(project);
  const fullContext = buildFullContext(project);

  const prompt = `${documentContext}
Você é um especialista sênior em QA, STLC e gestão de projetos de software. Analise de forma completa e estruturada todo o projeto fornecido.

CONTEXTO COMPLETO DO PROJETO (JSON):
${fullContext}

INSTRUÇÕES:
1. Gere um resumo executivo conciso e acionável sobre o estado geral do projeto (documentos, tarefas, testes, indicadores e fases).
2. Analise os documentos: presença, qualidade, categorias, alinhamento com tarefas e testes; indique se há documentos sem análise IA.
3. Analise as tarefas: distribuição por tipo e status, bloqueios, taxa de conclusão, prioridades e responsáveis; destaque riscos de atraso.
4. Analise os testes: cobertura, taxa de sucesso, distribuição por status e estratégia, falhas; avalie a efetividade das estratégias de teste.
5. Analise indicadores e fases: score de qualidade, KPIs, alertas, progresso das fases SDLC; avalie se as fases refletem o avanço real do projeto.
6. Liste pontos fortes, pontos fracos, riscos e recomendações acionáveis (em português).
7. Use apenas português brasileiro e seja específico com base nos dados fornecidos.

Respeite o schema JSON de resposta.
`;

  try {
    const response = await callGeminiWithRetry({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: projectFullAnalysisSchema,
      },
    });

    const parsed = JSON.parse(response.text.trim()) as Omit<ProjectFullAnalysis, 'generatedAt'>;
    const analysis: ProjectFullAnalysis = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
    return analysis;
  } catch (error) {
    logger.error('Erro ao gerar análise completa do projeto', 'projectFullAnalysisService', error);
    throw error;
  }
}

/** Adiciona uma nova análise à lista do projeto e mantém no máximo MAX_ANALYSES_STORED. */
export function appendProjectFullAnalysis(
  project: Project,
  analysis: ProjectFullAnalysis
): Project {
  const list = project.projectFullAnalyses ?? [];
  const next = [analysis, ...list].slice(0, MAX_ANALYSES_STORED);
  return { ...project, projectFullAnalyses: next };
}
