import { GoogleGenAI, Type } from "@google/genai";
import { Project, DashboardInsightsAnalysis } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getCurrentAndPreviousPeriodMetrics } from '../metricsHistoryService';
import { getFormattedContext } from './documentContextService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("GEMINI_API_KEY environment variable not set. Some features may not work.");
}

const getAI = () => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY não configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY.");
  }
  return ai;
};

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutos

const analysisCache = new Map<string, { snapshotHash: string; expiresAt: number; analysis: DashboardInsightsAnalysis }>();

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
    trends: periodMetrics.current && periodMetrics.previous ? {
      passRate: {
        current: periodMetrics.current.testPassRate,
        previous: periodMetrics.previous.testPassRate,
      },
      totalBugs: {
        current: periodMetrics.current.totalBugs,
        previous: periodMetrics.previous.totalBugs,
      },
    } : null,
    history: project.metricsHistory?.slice(0, 7) || [], // Últimos 7 dias
  };
  
  return JSON.stringify(snapshot);
};

const insightsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    qualityScore: {
      type: Type.NUMBER,
      description: "Score de qualidade geral do projeto (0-100)"
    },
    qualityLevel: {
      type: Type.STRING,
      enum: ['Excelente', 'Bom', 'Regular', 'Ruim', 'Crítico'],
      description: "Nível de qualidade geral"
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
  required: ['qualityScore', 'qualityLevel', 'insights', 'predictions', 'recommendations', 'metricEnhancements'],
};

/**
 * Gera análise de insights do dashboard com IA
 */
export async function generateDashboardInsightsAnalysis(project: Project): Promise<DashboardInsightsAnalysis> {
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
  
  const documentContext = await getFormattedContext();
  const prompt = `${documentContext}
Você é um especialista sênior em QA e análise de métricas de qualidade de software.
Analise as métricas do dashboard fornecidas e gere insights acionáveis, previsões e recomendações.

CONTEXTO E MÉTRICAS:
${JSON.stringify({
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
  tendencias: periodMetrics.current && periodMetrics.previous ? {
    passRate: {
      atual: periodMetrics.current.testPassRate,
      anterior: periodMetrics.previous.testPassRate,
    },
    totalBugs: {
      atual: periodMetrics.current.totalBugs,
      anterior: periodMetrics.previous.totalBugs,
    },
  } : null,
  historico: project.metricsHistory?.slice(0, 7) || [],
}, null, 2)}

INSTRUÇÕES:
1. Calcule um score de qualidade geral (0-100) baseado em:
   - Taxa de sucesso dos testes
   - Número e severidade de bugs
   - Cobertura de testes
   - Tendências (melhoria ou piora)
   - Retrabalho (testes reexecutados)

2. Gere insights específicos e acionáveis (mínimo 3, máximo 8):
   - Identifique padrões, anomalias e oportunidades
   - Cada insight deve ter tipo (success/warning/error/info), título, descrição, prioridade e se é acionável
   - Foque em insights que ajudem a melhorar a qualidade

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
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
    console.error('Erro ao gerar análise de insights do dashboard:', error);
    throw error;
  }
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

