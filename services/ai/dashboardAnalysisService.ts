import { GoogleGenAI, Type } from "@google/genai";
import { Project, DashboardOverviewAnalysis, DashboardRequirementsAnalysis, STLCPhaseName } from '../../types';
import { detectCurrentSTLCPhase } from '../../utils/stlcPhaseDetector';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';

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

const analysisCache = new Map<string, { snapshotHash: string; expiresAt: number; analysis: DashboardOverviewAnalysis | DashboardRequirementsAnalysis }>();

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
  
  const snapshot = {
    projectId: project.id,
    projectName: project.name,
    tasksCount: project.tasks.length,
    requirementsCount: (project.requirements || []).length,
    testCasesCount: project.tasks.flatMap(t => t.testCases || []).length,
    currentPhase,
    metrics: {
      totalTasks: metrics.totalTasks,
      totalTestCases: metrics.totalTestCases,
      testPassRate: metrics.testPassRate,
      testCoverage: metrics.testCoverage,
    },
    phases: project.phases.map(p => ({ name: p.name, status: p.status })),
  };
  
  return JSON.stringify(snapshot);
};

const createRequirementsSnapshot = (project: Project): string => {
  const requirements = project.requirements || [];
  const rtm = project.rtm || [];
  const allTestCases = project.tasks.flatMap(t => t.testCases || []);
  
  const snapshot = {
    requirementsCount: requirements.length,
    requirementsByType: {
      functional: requirements.filter(r => r.type === 'Funcional').length,
      nonFunctional: requirements.filter(r => r.type === 'Não Funcional').length,
    },
    requirementsByStatus: {
      rascunho: requirements.filter(r => r.status === 'Rascunho').length,
      aprovado: requirements.filter(r => r.status === 'Aprovado').length,
      emTeste: requirements.filter(r => r.status === 'Em Teste').length,
      validado: requirements.filter(r => r.status === 'Validado').length,
    },
    rtmEntries: rtm.length,
    totalCoverage: rtm.length > 0 
      ? Math.round(rtm.reduce((sum, entry) => sum + entry.coverage, 0) / rtm.length)
      : 0,
    requirementsWithTestCases: requirements.filter(r => r.testCases.length > 0).length,
    testCasesCount: allTestCases.length,
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

const requirementsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Resumo executivo da análise de requisitos"
    },
    coverage: {
      type: Type.OBJECT,
      properties: {
        analysis: {
          type: Type.STRING,
          description: "Análise de cobertura RTM"
        },
        percentage: {
          type: Type.NUMBER,
          description: "Percentual de cobertura calculado"
        },
        gaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Gaps de cobertura identificados"
        }
      },
      required: ["analysis", "percentage", "gaps"]
    },
    quality: {
      type: Type.OBJECT,
      properties: {
        analysis: {
          type: Type.STRING,
          description: "Análise de qualidade dos requisitos"
        },
        issues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Problemas de qualidade identificados"
        },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Pontos fortes na qualidade dos requisitos"
        }
      },
      required: ["analysis", "issues", "strengths"]
    },
    gaps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Gaps gerais identificados nos requisitos"
    },
    inconsistencies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Inconsistências identificadas"
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Sugestões de melhoria para os requisitos"
    }
  },
  required: ["summary", "coverage", "quality", "gaps", "inconsistencies", "suggestions"]
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
  
  const prompt = `
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
  },
  fases: project.phases.map(p => ({ nome: p.name, status: p.status })),
  totalTarefas: project.tasks.length,
  totalDocumentos: project.documents.length,
}, null, 2)}

INSTRUÇÕES:
1. Gere um resumo executivo conciso e acionável sobre o estado geral do projeto.
2. Analise detalhadamente a fase atual do STLC, explicando o que significa e o que deve ser focado.
3. Analise as métricas fornecidas, identificando pontos fortes e fracos.
4. Identifique riscos potenciais baseados nas métricas e fase atual.
5. Forneça recomendações práticas e acionáveis para melhorar o projeto.
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
 * Gera análise de requisitos do dashboard
 */
export async function generateDashboardRequirementsAnalysis(project: Project): Promise<DashboardRequirementsAnalysis> {
  const snapshot = createRequirementsSnapshot(project);
  const snapshotHash = hashString(snapshot);
  const cacheKey = `dashboard-requirements:${project.id}`;
  
  // Verificar cache
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.snapshotHash === snapshotHash && cached.expiresAt > Date.now()) {
    return cached.analysis as DashboardRequirementsAnalysis;
  }
  
  const requirements = project.requirements || [];
  const rtm = project.rtm || [];
  const allTestCases = project.tasks.flatMap(t => t.testCases || []);
  const currentPhase = detectCurrentSTLCPhase(project);
  
  const totalCoverage = rtm.length > 0 
    ? Math.round(rtm.reduce((sum, entry) => sum + entry.coverage, 0) / rtm.length)
    : 0;
  
  const prompt = `
Você é um especialista sênior em QA e gerenciamento de requisitos. 
Analise os requisitos do projeto e gere uma análise focada em cobertura RTM e qualidade.

CONTEXTO DO PROJETO:
${JSON.stringify({
  nome: project.name,
  faseAtualSTLC: currentPhase,
  requisitos: {
    total: requirements.length,
    funcionais: requirements.filter(r => r.type === 'Funcional').length,
    naoFuncionais: requirements.filter(r => r.type === 'Não Funcional').length,
    porStatus: {
      rascunho: requirements.filter(r => r.status === 'Rascunho').length,
      aprovado: requirements.filter(r => r.status === 'Aprovado').length,
      emTeste: requirements.filter(r => r.status === 'Em Teste').length,
      validado: requirements.filter(r => r.status === 'Validado').length,
    },
    comCasosTeste: requirements.filter(r => r.testCases.length > 0).length,
  },
  rtm: {
    entradas: rtm.length,
    coberturaMedia: totalCoverage,
    requisitosComRTM: rtm.length,
  },
  casosTeste: {
    total: allTestCases.length,
    executados: allTestCases.filter(tc => tc.status !== 'Not Run').length,
    aprovados: allTestCases.filter(tc => tc.status === 'Passed').length,
  },
  exemplosRequisitos: requirements.slice(0, 5).map(r => ({
    id: r.id,
    titulo: r.title,
    tipo: r.type,
    status: r.status,
    casosTeste: r.testCases.length,
    criteriosAceitacao: r.acceptanceCriteria.length,
  })),
}, null, 2)}

INSTRUÇÕES:
1. Gere um resumo executivo sobre o estado dos requisitos e RTM.
2. Analise a cobertura RTM, identificando gaps e calculando percentual de cobertura.
3. Avalie a qualidade dos requisitos, identificando problemas e pontos fortes.
4. Identifique gaps gerais nos requisitos (requisitos sem casos de teste, sem critérios de aceitação, etc.).
5. Identifique inconsistências (requisitos aprovados sem casos de teste, requisitos validados sem cobertura adequada, etc.).
6. Forneça sugestões práticas de melhoria.
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
        responseSchema: requirementsAnalysisSchema,
      },
    });
    
    const parsedResponse = JSON.parse(response.text.trim());
    
    const analysis: DashboardRequirementsAnalysis = {
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
    console.error('Erro ao gerar análise de requisitos:', error);
    throw error;
  }
}

/**
 * Marca análises como desatualizadas quando há mudanças no projeto
 */
export function markDashboardAnalysesAsOutdated(project: Project): Project {
  const updatedProject = { ...project };
  
  // Criar snapshots atuais
  const currentOverviewSnapshot = createProjectSnapshot(project);
  const currentRequirementsSnapshot = createRequirementsSnapshot(project);
  
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
  
  if (project.dashboardRequirementsAnalysis) {
    const cacheKey = `dashboard-requirements:${project.id}`;
    const cached = analysisCache.get(cacheKey);
    const currentHash = hashString(currentRequirementsSnapshot);
    
    if (!cached || cached.snapshotHash !== currentHash) {
      updatedProject.dashboardRequirementsAnalysis = {
        ...project.dashboardRequirementsAnalysis,
        isOutdated: true,
      };
    }
  }
  
  return updatedProject;
}

