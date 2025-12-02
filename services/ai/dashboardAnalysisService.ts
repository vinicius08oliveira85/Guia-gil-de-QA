import { GoogleGenAI, Type } from "@google/genai";
import { Project, DashboardOverviewAnalysis, STLCPhaseName } from '../../types';
import { detectCurrentSTLCPhase } from '../../utils/stlcPhaseDetector';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
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

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

const analysisCache = new Map<string, { snapshotHash: string; expiresAt: number; analysis: DashboardOverviewAnalysis }>();

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
};

const createProjectSnapshot = (project: Project): string => {
  const metrics = calculateProjectMetrics(project);
  const currentPhase = detectCurrentSTLCPhase(project);
  
  // Normalizar texto de documentos para snapshot
  const normalizeText = (value?: string, maxLength: number = 200): string => {
    if (!value) return '';
    const sanitized = value.replace(/\s+/g, ' ').trim();
    if (sanitized.length <= maxLength) return sanitized;
    return `${sanitized.slice(0, maxLength)}…`;
  };

  // Informações de documentos
  const documentsInfo = (project.documents || []).map(doc => ({
    name: doc.name,
    contentSnippet: normalizeText(doc.content, 150),
    hasAnalysis: !!doc.analysis && doc.analysis.length > 0,
  }));

  // Status de tarefas
  const taskStatusInfo = {
    toDo: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'To Do').length,
    inProgress: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'In Progress').length,
    done: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length,
    blocked: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'Blocked').length,
  };

  // Status de execução de testes
  const allTestCases = project.tasks.flatMap(t => t.testCases || []);
  const testExecutionInfo = {
    passed: allTestCases.filter(tc => tc.status === 'Passed').length,
    failed: allTestCases.filter(tc => tc.status === 'Failed').length,
    notRun: allTestCases.filter(tc => tc.status === 'Not Run').length,
    blocked: allTestCases.filter(tc => tc.status === 'Blocked').length,
  };
  
  const snapshot = {
    projectId: project.id,
    projectName: project.name,
    tasksCount: project.tasks.length,
    documentsCount: (project.documents || []).length,
    testCasesCount: allTestCases.length,
    currentPhase,
    metrics: {
      totalTasks: metrics.totalTasks,
      totalTestCases: metrics.totalTestCases,
      testPassRate: metrics.testPassRate,
      testCoverage: metrics.testCoverage,
      documentMetrics: metrics.documentMetrics,
      taskStatus: taskStatusInfo,
      testExecution: testExecutionInfo,
    },
    documents: documentsInfo,
    taskStatus: taskStatusInfo,
    testExecution: testExecutionInfo,
    phases: project.phases.map(p => ({ name: p.name, status: p.status })),
  };
  
  return JSON.stringify(snapshot);
};

const overviewAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Resumo executivo da análise geral do projeto"
    },
    currentPhase: {
      type: Type.STRING,
      description: "Análise detalhada da fase atual do STLC"
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        analysis: {
          type: Type.STRING,
          description: "Análise das métricas do projeto"
        },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Pontos fortes identificados nas métricas"
        },
        weaknesses: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Pontos fracos identificados nas métricas"
        }
      },
      required: ["analysis", "strengths", "weaknesses"]
    },
    risks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Riscos identificados no projeto"
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Recomendações acionáveis para o projeto"
    }
  },
  required: ["summary", "currentPhase", "metrics", "risks", "recommendations"]
};

/**
 * Gera análise de visão geral do dashboard
 */
export async function generateDashboardOverviewAnalysis(project: Project): Promise<DashboardOverviewAnalysis> {
  const snapshot = createProjectSnapshot(project);
  const snapshotHash = hashString(snapshot);
  const cacheKey = `dashboard-overview:${project.id}`;
  
  // Verificar cache
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.snapshotHash === snapshotHash && cached.expiresAt > Date.now()) {
    return cached.analysis as DashboardOverviewAnalysis;
  }
  
  const metrics = calculateProjectMetrics(project);
  const currentPhase = detectCurrentSTLCPhase(project);
  const allTestCases = project.tasks.flatMap(t => t.testCases || []);
  
  const documentContext = await getFormattedContext();
  const prompt = `${documentContext}
Você é um especialista sênior em QA e STLC (Software Testing Life Cycle). 
Analise o projeto fornecido e gere uma análise estratégica focada na visão geral do projeto.

CONTEXTO DO PROJETO:
${JSON.stringify({
  nome: project.name,
  descricao: project.description,
  faseAtualSTLC: currentPhase,
  metricas: {
    totalTarefas: metrics.totalTasks,
    totalCasosTeste: metrics.totalTestCases,
    taxaAprovacao: metrics.testPassRate,
    coberturaTeste: metrics.testCoverage,
    faseAtualSDLC: metrics.currentPhase,
    metricasDocumentos: metrics.documentMetrics,
    statusTarefas: metrics.taskStatus,
    execucaoTestes: metrics.testExecution,
  },
  documentos: (project.documents || []).map(doc => ({
    nome: doc.name,
    temAnalise: !!doc.analysis && doc.analysis.length > 0,
  })),
  statusTarefas: {
    toDo: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'To Do').length,
    inProgress: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'In Progress').length,
    done: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length,
    blocked: project.tasks.filter(t => t.type !== 'Bug' && t.status === 'Blocked').length,
  },
  execucaoTestes: {
    passed: allTestCases.filter(tc => tc.status === 'Passed').length,
    failed: allTestCases.filter(tc => tc.status === 'Failed').length,
    notRun: allTestCases.filter(tc => tc.status === 'Not Run').length,
    blocked: allTestCases.filter(tc => tc.status === 'Blocked').length,
  },
  fases: project.phases.map(p => ({ nome: p.name, status: p.status })),
  totalTarefas: project.tasks.length,
  totalDocumentos: project.documents.length,
}, null, 2)}

INSTRUÇÕES:
1. Gere um resumo executivo conciso e acionável sobre o estado geral do projeto, considerando tarefas, testes e documentos.
2. Analise detalhadamente a fase atual do STLC, explicando o que significa e o que deve ser focado.
3. Analise as métricas fornecidas, incluindo:
   - Status das tarefas (distribuição entre To Do, In Progress, Done, Blocked)
   - Execução de testes (taxa de sucesso, distribuição de status)
   - Documentos (total, categorias, documentos com análise)
4. Identifique pontos fortes e fracos considerando:
   - Sincronização entre documentos, tarefas e testes
   - Qualidade da documentação
   - Progresso das tarefas
   - Eficácia dos testes
5. Identifique riscos potenciais baseados em:
   - Desequilíbrio no status das tarefas
   - Taxa de falha de testes
   - Falta de documentação ou documentos sem análise
   - Inconsistências entre documentos e tarefas
6. Forneça recomendações práticas e acionáveis considerando:
   - Necessidade de sincronização entre documentos, tarefas e testes
   - Melhorias na documentação
   - Otimização do fluxo de trabalho
   - Aumento da taxa de sucesso dos testes
7. Use português brasileiro.
8. Seja específico e baseado nos dados fornecidos.

Respeite o schema JSON fornecido.
  `;
  
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: overviewAnalysisSchema,
      },
    });
    
    const parsedResponse = JSON.parse(response.text.trim());
    
    const analysis: DashboardOverviewAnalysis = {
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
    console.error('Erro ao gerar análise de visão geral:', error);
    throw error;
  }
}

/**
 * Marca análises como desatualizadas quando há mudanças no projeto
 */
export function markDashboardAnalysesAsOutdated(project: Project): Project {
  const updatedProject = { ...project };
  
  // Criar snapshot atual
  const currentOverviewSnapshot = createProjectSnapshot(project);
  
  // Verificar se houve mudanças
  if (project.dashboardOverviewAnalysis) {
    const cacheKey = `dashboard-overview:${project.id}`;
    const cached = analysisCache.get(cacheKey);
    const currentHash = hashString(currentOverviewSnapshot);
    
    if (!cached || cached.snapshotHash !== currentHash) {
      updatedProject.dashboardOverviewAnalysis = {
        ...project.dashboardOverviewAnalysis,
        isOutdated: true,
      };
    }
  }
  
  return updatedProject;
}

