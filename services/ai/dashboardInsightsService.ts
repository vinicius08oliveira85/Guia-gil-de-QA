import { Type } from '@google/genai';
import { Project, DashboardInsightsAnalysis, SDLCPhaseAnalysis } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getCurrentAndPreviousPeriodMetrics } from '../metricsHistoryService';
import { getFormattedContext } from './documentContextService';
import { generateSDLCPhaseAnalysis } from './sdlcPhaseAnalysisService';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { logger } from '../../utils/logger';

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutos

const analysisCache = new Map<
  string,
  { snapshotHash: string; expiresAt: number; analysis: DashboardInsightsAnalysis }
>();

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
};

const createMetricsSnapshot = (project: Project): string => {
  const metrics = calculateProjectMetrics(project);
  const periodMetrics = getCurrentAndPreviousPeriodMetrics(project, 'week');

  const snapshot = {
    projectId: project.id,
    metrics: {
      totalTestCases: metrics.totalTestCases,
      passedTestCases: metrics.passedTestCases,
      failedTestCases: metrics.failedTestCases,
      blockedTestCases: metrics.blockedTestCases,
      notRunTestCases: metrics.notRunTestCases,
      executedTestCases: metrics.executedTestCases,
      testPassRate: metrics.testPassRate,
      automationRatio: metrics.automationRatio,
      testCoverage: metrics.testCoverage,
      totalBugs: metrics.openVsClosedBugs.open + metrics.openVsClosedBugs.closed,
      openBugs: metrics.openVsClosedBugs.open,
      bugsBySeverity: metrics.bugsBySeverity,
      averageFailuresPerDay: metrics.quickAnalysis.averageFailuresPerDay,
      topProblematicTasks: metrics.quickAnalysis.topProblematicTasks,
      reexecutedTests: metrics.quickAnalysis.reexecutedTests,
      recentlyResolvedBugs: metrics.quickAnalysis.recentlyResolvedBugs,
    },
    trends:
      periodMetrics.current && periodMetrics.previous
        ? {
            passRate: {
              current: periodMetrics.current.testPassRate,
              previous: periodMetrics.previous.testPassRate,
            },
            totalBugs: {
              current: periodMetrics.current.totalBugs,
              previous: periodMetrics.previous.totalBugs,
            },
          }
        : null,
    history: project.metricsHistory?.slice(0, 7) || [], // Últimos 7 dias
  };

  return JSON.stringify(snapshot);
};

const insightsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    qualityScore: {
      type: Type.NUMBER,
      description: 'Score de qualidade geral do projeto (0-100)',
    },
    qualityLevel: {
      type: Type.STRING,
      enum: ['Excelente', 'Bom', 'Regular', 'Ruim', 'Crítico'],
      description: 'Nível de qualidade geral',
    },
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['success', 'warning', 'error', 'info'],
          },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ['Baixa', 'Média', 'Alta', 'Crítica'],
          },
          actionable: { type: Type.BOOLEAN },
        },
        required: ['type', 'title', 'description', 'priority', 'actionable'],
      },
    },
    predictions: {
      type: Type.OBJECT,
      properties: {
        nextWeekPassRate: { type: Type.NUMBER },
        nextWeekBugs: { type: Type.NUMBER },
        riskFactors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              factor: { type: Type.STRING },
              probability: {
                type: Type.STRING,
                enum: ['Baixa', 'Média', 'Alta'],
              },
              impact: { type: Type.STRING },
            },
            required: ['factor', 'probability', 'impact'],
          },
        },
      },
      required: ['riskFactors'],
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: ['Testes', 'Bugs', 'Cobertura', 'Processo', 'Qualidade'],
          },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          impact: {
            type: Type.STRING,
            enum: ['Baixo', 'Médio', 'Alto'],
          },
          effort: {
            type: Type.STRING,
            enum: ['Baixo', 'Médio', 'Alto'],
          },
        },
        required: ['category', 'title', 'description', 'impact', 'effort'],
      },
    },
    metricEnhancements: {
      type: Type.OBJECT,
      properties: {
        testPassRate: {
          type: Type.OBJECT,
          properties: {
            current: { type: Type.NUMBER },
            predicted: { type: Type.NUMBER },
            suggestion: { type: Type.STRING },
          },
          required: ['current', 'predicted', 'suggestion'],
        },
        bugResolution: {
          type: Type.OBJECT,
          properties: {
            current: { type: Type.NUMBER },
            predicted: { type: Type.NUMBER },
            suggestion: { type: Type.STRING },
          },
          required: ['current', 'predicted', 'suggestion'],
        },
        coverage: {
          type: Type.OBJECT,
          properties: {
            current: { type: Type.NUMBER },
            target: { type: Type.NUMBER },
            suggestion: { type: Type.STRING },
          },
          required: ['current', 'target', 'suggestion'],
        },
      },
      required: ['testPassRate', 'bugResolution', 'coverage'],
    },
  },
  required: [
    'qualityScore',
    'qualityLevel',
    'insights',
    'predictions',
    'recommendations',
    'metricEnhancements',
  ],
};

/**
 * Gera análise de insights do dashboard com IA
 */
export async function generateDashboardInsightsAnalysis(
  project: Project
): Promise<DashboardInsightsAnalysis> {
  const snapshot = createMetricsSnapshot(project);
  const snapshotHash = hashString(snapshot);
  const cacheKey = `dashboard-insights:${project.id}`;

  // Verificar cache
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.snapshotHash === snapshotHash && cached.expiresAt > Date.now()) {
    return cached.analysis;
  }

  const metrics = calculateProjectMetrics(project);
  const periodMetrics = getCurrentAndPreviousPeriodMetrics(project, 'week');
  const tasksAndTestsData = prepareTasksAndTestsData(project);

  const documentContext = await getFormattedContext(project);
  const prompt = `${documentContext}
Você é um especialista sênior em QA e análise de métricas de qualidade de software.
Analise as métricas do dashboard fornecidas e gere insights acionáveis, previsões e recomendações.

CONTEXTO E MÉTRICAS:
${JSON.stringify(
  {
    metricas: {
      totalTestCases: metrics.totalTestCases,
      passedTestCases: metrics.passedTestCases,
      failedTestCases: metrics.failedTestCases,
      blockedTestCases: metrics.blockedTestCases,
      notRunTestCases: metrics.notRunTestCases,
      executedTestCases: metrics.executedTestCases,
      testPassRate: metrics.testPassRate,
      automationRatio: metrics.automationRatio,
      testCoverage: metrics.testCoverage,
      totalBugs: metrics.openVsClosedBugs.open + metrics.openVsClosedBugs.closed,
      openBugs: metrics.openVsClosedBugs.open,
      bugsBySeverity: metrics.bugsBySeverity,
      averageFailuresPerDay: metrics.quickAnalysis.averageFailuresPerDay,
      topProblematicTasks: metrics.quickAnalysis.topProblematicTasks,
      reexecutedTests: metrics.quickAnalysis.reexecutedTests,
      recentlyResolvedBugs: metrics.quickAnalysis.recentlyResolvedBugs,
    },
    tarefasETestes: {
      resumo: tasksAndTestsData.summary,
      tarefasSemTestes: tasksAndTestsData.tasksWithoutTests.length,
      tarefasSemBdd: tasksAndTestsData.tasksWithoutBdd.length,
      tarefasProblematicas: tasksAndTestsData.problematicTasks,
      detalhesTarefas: tasksAndTestsData.tasks.slice(0, 20), // Limitar a 20 tarefas para não exceder tokens
    },
    tendencias:
      periodMetrics.current && periodMetrics.previous
        ? {
            passRate: {
              atual: periodMetrics.current.testPassRate,
              anterior: periodMetrics.previous.testPassRate,
            },
            totalBugs: {
              atual: periodMetrics.current.totalBugs,
              anterior: periodMetrics.previous.totalBugs,
            },
          }
        : null,
    historico: project.metricsHistory?.slice(0, 7) || [],
  },
  null,
  2
)}

INSTRUÇÕES:
Como um QA sênior experiente, analise profundamente os dados fornecidos de Tarefas, Testes e Documentos para gerar indicadores completos do Dashboard.

1. Calcule um score de qualidade geral (0-100) baseado em:
   - Taxa de sucesso dos testes
   - Número e severidade de bugs
   - Cobertura de testes (considere tarefas sem testes e sem BDD)
   - Tendências (melhoria ou piora)
   - Retrabalho (testes reexecutados)
   - Tarefas problemáticas identificadas

2. Gere insights específicos e acionáveis (mínimo 3, máximo 8):
   - Analise os dados de Tarefas & Testes fornecidos (tarefasSemTestes, tarefasSemBdd, tarefasProblematicas)
   - Identifique padrões, anomalias e oportunidades baseados nos detalhes das tarefas
   - Cada insight deve ter tipo (success/warning/error/info), título, descrição, prioridade e se é acionável
   - Foque em insights que ajudem a melhorar a qualidade, considerando o contexto dos documentos
   - Use os dados detalhados de tarefas para identificar problemas específicos

3. Faça previsões baseadas em tendências:
   - Preveja taxa de sucesso para próxima semana (se houver histórico suficiente)
   - Preveja número de bugs para próxima semana
   - Identifique fatores de risco com probabilidade e impacto

4. Gere recomendações priorizadas (mínimo 3, máximo 6):
   - Categorize por: Testes, Bugs, Cobertura, Processo, Qualidade
   - Indique impacto e esforço de cada recomendação
   - Seja específico e acionável

5. Forneça melhorias para métricas específicas:
   - testPassRate: análise atual vs prevista com sugestão
   - bugResolution: análise atual vs prevista com sugestão
   - coverage: análise atual vs meta com sugestão

6. Use português brasileiro.
7. Seja específico e baseado nos dados fornecidos.

Respeite o schema JSON fornecido.
  `;

  try {
    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: insightsAnalysisSchema,
      },
    });

    const parsedResponse = JSON.parse(response.text.trim());

    const analysis: DashboardInsightsAnalysis = {
      ...parsedResponse,
      generatedAt: new Date().toISOString(),
      isOutdated: false,
    };

    // Salvar no cache
    analysisCache.set(cacheKey, {
      snapshotHash,
      expiresAt: Date.now() + CACHE_TTL_MS,
      analysis,
    });

    return analysis;
  } catch (error) {
    logger.error(
      'Erro ao gerar análise de insights do dashboard',
      'dashboardInsightsService',
      error
    );
    throw error;
  }
}

/**
 * Prepara dados detalhados de Tarefas e Testes para o prompt
 */
function prepareTasksAndTestsData(project: Project) {
  const tasks = project.tasks.map(task => ({
    id: task.id,
    title: task.title,
    type: task.type,
    status: task.status,
    priority: task.priority,
    testCases:
      task.testCases?.map(tc => ({
        title: tc.title,
        status: tc.status,
        isAutomated: tc.isAutomated || false,
      })) || [],
    bddScenarios: task.bddScenarios?.length || 0,
    hasBddScenarios: (task.bddScenarios?.length || 0) > 0,
  }));

  const tasksWithoutTests = tasks.filter(t => t.testCases.length === 0 && t.type !== 'Bug');
  const tasksWithoutBdd = tasks.filter(t => !t.hasBddScenarios && t.type !== 'Bug');

  const problematicTasks = tasks
    .filter(t => {
      const failedTests = t.testCases.filter(tc => tc.status === 'Failed').length;
      return failedTests > 0;
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      failedTests: t.testCases.filter(tc => tc.status === 'Failed').length,
      totalTests: t.testCases.length,
    }))
    .sort((a, b) => b.failedTests - a.failedTests)
    .slice(0, 5);

  return {
    tasks,
    tasksWithoutTests,
    tasksWithoutBdd,
    problematicTasks,
    summary: {
      totalTasks: tasks.length,
      tasksWithTests: tasks.filter(t => t.testCases.length > 0).length,
      tasksWithBdd: tasks.filter(t => t.hasBddScenarios).length,
      totalTestCases: tasks.reduce((sum, t) => sum + t.testCases.length, 0),
      automatedTestCases: tasks.reduce(
        (sum, t) => sum + t.testCases.filter(tc => tc.isAutomated).length,
        0
      ),
      failedTestCases: tasks.reduce(
        (sum, t) => sum + t.testCases.filter(tc => tc.status === 'Failed').length,
        0
      ),
    },
  };
}

/**
 * Gera análise completa do dashboard (SDLC + Insights) com prompt unificado
 */
export async function generateCompleteDashboardAnalysis(
  project: Project
): Promise<{ sdlcAnalysis: SDLCPhaseAnalysis; insightsAnalysis: DashboardInsightsAnalysis }> {
  // Gerar ambas análises em paralelo para melhor performance
  const [sdlcAnalysis, insightsAnalysis] = await Promise.all([
    generateSDLCPhaseAnalysis(project),
    generateDashboardInsightsAnalysis(project),
  ]);

  return {
    sdlcAnalysis,
    insightsAnalysis,
  };
}

/**
 * Marca análise de insights como desatualizada quando há mudanças
 */
export function markDashboardInsightsAsOutdated(project: Project): Project {
  const updatedProject = { ...project };

  const currentSnapshot = createMetricsSnapshot(project);

  if (project.dashboardInsightsAnalysis) {
    const cacheKey = `dashboard-insights:${project.id}`;
    const cached = analysisCache.get(cacheKey);
    const currentHash = hashString(currentSnapshot);

    if (!cached || cached.snapshotHash !== currentHash) {
      updatedProject.dashboardInsightsAnalysis = {
        ...project.dashboardInsightsAnalysis,
        isOutdated: true,
      };
    }
  }

  return updatedProject;
}
