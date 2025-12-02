import { GoogleGenAI, Type } from "@google/genai";
import { Project, SDLCPhaseAnalysis, PhaseName } from '../../types';
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

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutos

const analysisCache = new Map<string, { snapshotHash: string; expiresAt: number; analysis: SDLCPhaseAnalysis }>();

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
};

const createPhaseSnapshot = (project: Project): string => {
  const metrics = calculateProjectMetrics(project);
  const currentPhase = metrics.currentPhase;
  const currentPhaseData = project.phases.find(p => p.name === currentPhase);
  
  const snapshot = {
    projectId: project.id,
    currentPhase,
    phaseStatus: currentPhaseData?.status || 'Não Iniciado',
    metrics: {
      totalTasks: metrics.totalTasks,
      totalTestCases: metrics.totalTestCases,
      executedTestCases: metrics.executedTestCases,
      passedTestCases: metrics.passedTestCases,
      failedTestCases: metrics.failedTestCases,
      testPassRate: metrics.testPassRate,
      testCoverage: metrics.testCoverage,
      openBugs: metrics.openVsClosedBugs.open,
      bugsBySeverity: metrics.bugsBySeverity,
      totalDocuments: project.documents.length,
      hasBddScenarios: project.tasks.some(t => t.bddScenarios && t.bddScenarios.length > 0),
    },
    phases: project.phases.map(p => ({
      name: p.name,
      status: p.status,
    })),
  };
  
  return JSON.stringify(snapshot);
};

const sdlcPhaseAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    currentPhase: {
      type: Type.STRING,
      enum: ['Request', 'Analysis', 'Design', 'Analysis and Code', 'Build', 'Test', 'Release', 'Deploy', 'Operate', 'Monitor'],
      description: "Fase atual do SDLC detectada"
    },
    explanation: {
      type: Type.STRING,
      description: "Explicação detalhada de por que o projeto está nesta fase, baseado nas métricas e status"
    },
    nextSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ['Baixa', 'Média', 'Alta', 'Crítica'],
          },
        },
        required: ['step', 'description', 'priority'],
      },
      description: "Próximos passos recomendados para avançar na fase atual ou para a próxima fase"
    },
    blockers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          blocker: { type: Type.STRING },
          description: { type: Type.STRING },
          impact: {
            type: Type.STRING,
            enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
          },
          suggestion: { type: Type.STRING },
        },
        required: ['blocker', 'description', 'impact', 'suggestion'],
      },
      description: "Bloqueios ou problemas identificados que impedem o progresso"
    },
    progressPercentage: {
      type: Type.NUMBER,
      description: "Percentual de conclusão da fase atual (0-100)"
    },
  },
  required: ['currentPhase', 'explanation', 'nextSteps', 'blockers', 'progressPercentage'],
};

/**
 * Calcula o percentual de progresso da fase atual baseado nas métricas
 */
function calculatePhaseProgress(project: Project, currentPhase: PhaseName): number {
  const metrics = calculateProjectMetrics(project);
  const totalTasks = project.tasks.filter(t => t.type === 'Tarefa').length;
  const doneTasks = project.tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length;
  
  switch (currentPhase) {
    case 'Request':
      // Progresso baseado em documentos ou tarefas criados
      const hasContent = project.documents.length > 0 || project.tasks.length > 0;
      return hasContent ? 100 : 0;
      
    case 'Analysis':
      // Progresso baseado em cenários BDD
      const tasksWithBdd = project.tasks.filter(t => t.bddScenarios && t.bddScenarios.length > 0).length;
      return totalTasks > 0 ? Math.round((tasksWithBdd / totalTasks) * 100) : 0;
      
    case 'Design':
      // Progresso baseado em casos de teste criados
      const totalTestCases = metrics.totalTestCases;
      const expectedTestCases = totalTestCases > 0 ? totalTestCases : 1;
      return Math.min(100, Math.round((totalTestCases / expectedTestCases) * 100));
      
    case 'Analysis and Code':
      // Progresso baseado em tarefas concluídas
      return totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      
    case 'Build':
      // Similar a Analysis and Code
      return totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      
    case 'Test':
      // Progresso baseado em testes executados
      return metrics.totalTestCases > 0 
        ? Math.round((metrics.executedTestCases / metrics.totalTestCases) * 100) 
        : 0;
        
    case 'Release':
      // Progresso baseado em testes executados e bugs resolvidos
      const testProgress = metrics.totalTestCases > 0 
        ? (metrics.executedTestCases / metrics.totalTestCases) * 50 
        : 0;
      const bugProgress = metrics.openVsClosedBugs.open === 0 ? 50 : 
        Math.max(0, 50 - (metrics.openVsClosedBugs.open * 10));
      return Math.min(100, Math.round(testProgress + bugProgress));
      
    case 'Deploy':
      // Similar a Release
      return metrics.openVsClosedBugs.open === 0 && metrics.executedTestCases === metrics.totalTestCases ? 100 : 0;
      
    case 'Operate':
      // Similar a Deploy
      return metrics.openVsClosedBugs.open === 0 && metrics.executedTestCases === metrics.totalTestCases ? 100 : 0;
      
    case 'Monitor':
      // Fase manual, sempre 0 até ser marcada manualmente
      return 0;
      
    default:
      return 0;
  }
}

/**
 * Gera análise de fase SDLC com IA
 */
export async function generateSDLCPhaseAnalysis(project: Project): Promise<SDLCPhaseAnalysis> {
  const snapshot = createPhaseSnapshot(project);
  const snapshotHash = hashString(snapshot);
  const cacheKey = `sdlc-phase-analysis:${project.id}`;
  
  // Verificar cache
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.snapshotHash === snapshotHash && cached.expiresAt > Date.now()) {
    return cached.analysis;
  }
  
  const metrics = calculateProjectMetrics(project);
  const currentPhase = metrics.currentPhase;
  const progressPercentage = calculatePhaseProgress(project, currentPhase);
  
  const phaseDescriptions: Record<PhaseName, string> = {
    'Request': 'Solicitação da demanda pelo time de atendimento ou produto.',
    'Analysis': 'Análise do time de produto e levantamento dos requisitos.',
    'Design': 'Design pelo time de UX/UI com base nas necessidades levantadas.',
    'Analysis and Code': 'Análise e codificação pelo time de desenvolvimento.',
    'Build': 'Código fonte compilado e construído em um pacote executável.',
    'Test': 'Etapa onde o software é testado para garantir seu correto funcionamento.',
    'Release': 'Preparo para o software ser instalado em ambiente produtivo.',
    'Deploy': 'O software é implantado em ambiente produtivo para os usuários finais.',
    'Operate': 'Software em execução, monitorado pela equipe de operações.',
    'Monitor': 'Coleta de métricas e logs para avaliar o desempenho e a saúde da aplicação.'
  };
  
  const prompt = `
Você é um especialista sênior em QA e gestão de projetos de software seguindo metodologias ágeis e DevOps.
Analise o estado atual do projeto e forneça uma análise didática sobre a fase SDLC atual.

CONTEXTO DO PROJETO:
${JSON.stringify({
  faseAtual: currentPhase,
  descricaoFase: phaseDescriptions[currentPhase],
  statusFase: project.phases.find(p => p.name === currentPhase)?.status || 'Não Iniciado',
  progresso: `${progressPercentage}%`,
  metricas: {
    totalTarefas: metrics.totalTasks,
    totalCasosDeTeste: metrics.totalTestCases,
    casosExecutados: metrics.executedTestCases,
    casosAprovados: metrics.passedTestCases,
    casosFalhados: metrics.failedTestCases,
    taxaSucesso: `${metrics.testPassRate}%`,
    coberturaTestes: `${metrics.testCoverage}%`,
    bugsAbertos: metrics.openVsClosedBugs.open,
    bugsPorSeveridade: metrics.bugsBySeverity,
    totalDocumentos: project.documents.length,
    temCenariosBDD: project.tasks.some(t => t.bddScenarios && t.bddScenarios.length > 0),
  },
  fases: project.phases.map(p => ({
    nome: p.name,
    status: p.status,
  })),
}, null, 2)}

INSTRUÇÕES:
1. EXPLICAÇÃO (explanation):
   - Explique de forma didática e clara por que o projeto está na fase "${currentPhase}"
   - Baseie-se nas métricas fornecidas (tarefas, testes, bugs, documentos)
   - Seja específico sobre o que foi concluído e o que falta para avançar
   - Use linguagem acessível e educativa

2. PRÓXIMOS PASSOS (nextSteps):
   - Liste 3 a 5 passos concretos e acionáveis para avançar na fase atual ou para a próxima fase
   - Priorize os passos (Baixa, Média, Alta, Crítica)
   - Seja específico e prático
   - Foque em ações que o time de QA pode realizar

3. BLOQUEIOS (blockers):
   - Identifique problemas ou bloqueios que impedem o progresso
   - Se não houver bloqueios, retorne array vazio
   - Para cada bloqueio, forneça:
     * Nome do bloqueio
     * Descrição do problema
     * Impacto (Baixo, Médio, Alto, Crítico)
     * Sugestão de como resolver

4. PROGRESSO (progressPercentage):
   - O progresso já foi calculado: ${progressPercentage}%
   - Use este valor no retorno

5. Use português brasileiro.
6. Seja didático e educativo, como se estivesse explicando para alguém aprendendo sobre SDLC.
7. Baseie-se exclusivamente nos dados fornecidos.

Respeite o schema JSON fornecido.
  `;
  
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sdlcPhaseAnalysisSchema,
      },
    });
    
    const parsedResponse = JSON.parse(response.text.trim());
    
    const analysis: SDLCPhaseAnalysis = {
      ...parsedResponse,
      progressPercentage, // Usar o valor calculado, não o da IA
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
    console.error('Erro ao gerar análise de fase SDLC:', error);
    throw error;
  }
}

/**
 * Marca análise de fase SDLC como desatualizada quando há mudanças
 */
export function markSDLCPhaseAnalysisAsOutdated(project: Project): Project {
  const updatedProject = { ...project };
  
  const currentSnapshot = createPhaseSnapshot(project);
  
  if (project.sdlcPhaseAnalysis) {
    const cacheKey = `sdlc-phase-analysis:${project.id}`;
    const cached = analysisCache.get(cacheKey);
    const currentHash = hashString(currentSnapshot);
    
    if (!cached || cached.snapshotHash !== currentHash) {
      updatedProject.sdlcPhaseAnalysis = {
        ...project.sdlcPhaseAnalysis,
        isOutdated: true,
      };
    }
  }
  
  return updatedProject;
}

