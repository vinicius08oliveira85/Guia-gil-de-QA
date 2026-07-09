import { Type } from '@google/genai';
import type { Project, ProjectDevFullAnalysis } from '../../types';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getFormattedContext } from './documentContextService';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { logger } from '../../utils/logger';
import { parseAiJsonText } from '../../utils/aiJsonParse';
import { formatDevStackForPrompt } from '../../utils/devStackFormat';

const MAX_ANALYSES_STORED = 10;

const devProjectAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    stackAlignment: { type: Type.STRING },
    implementationBacklog: { type: Type.STRING },
    architectureNotes: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'summary',
    'stackAlignment',
    'implementationBacklog',
    'architectureNotes',
    'strengths',
    'weaknesses',
    'risks',
    'recommendations',
  ],
};

function buildDevProjectContext(project: Project): string {
  const metrics = calculateProjectMetrics(project);
  const tasks = project.tasks ?? [];
  const withGuidance = tasks.filter(t => t.devGuidance).length;
  return JSON.stringify(
    {
      projectName: project.name,
      projectDescription: project.description,
      stack: formatDevStackForPrompt(project.settings?.devStack),
      tasksCount: tasks.length,
      tasksWithDevGuidance: withGuidance,
      tasksDone: tasks.filter(t => t.status === 'Done').length,
      openBugs: metrics.openVsClosedBugs?.open ?? 0,
      documentsCount: project.documents?.length ?? 0,
      businessRulesCount: project.businessRules?.length ?? 0,
    },
    null,
    2
  );
}

export async function generateProjectDevFullAnalysis(
  project: Project
): Promise<ProjectDevFullAnalysis> {
  const documentContext = await getFormattedContext(project);
  const context = buildDevProjectContext(project);

  const prompt = `${documentContext}
Você é um arquiteto de software sênior. Analise o projeto Dev abaixo.

STACK CONFIGURADA:
${formatDevStackForPrompt(project.settings?.devStack)}

CONTEXTO (JSON):
${context}

INSTRUÇÕES:
1. Resumo executivo do estado de implementação.
2. Alinhamento da stack configurada com tarefas, documentos e regras.
3. Backlog técnico de implementação priorizado.
4. Notas de arquitetura e organização de código sugerida.
5. Pontos fortes, fracos, riscos e recomendações acionáveis.
6. Português brasileiro; baseie-se apenas nos dados fornecidos.
`;

  const response = await callGeminiWithRetry({
    model: GEMINI_DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: devProjectAnalysisSchema,
    },
  });

  const parsed = parseAiJsonText<Record<string, unknown>>(response.text);
  if (!parsed) {
    throw new Error('Resposta da IA inválida (análise Dev do projeto).');
  }

  return {
    summary: String(parsed.summary ?? ''),
    stackAlignment: String(parsed.stackAlignment ?? ''),
    implementationBacklog: String(parsed.implementationBacklog ?? ''),
    architectureNotes: String(parsed.architectureNotes ?? ''),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.filter((x): x is string => typeof x === 'string')
      : [],
    weaknesses: Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.filter((x): x is string => typeof x === 'string')
      : [],
    risks: Array.isArray(parsed.risks)
      ? parsed.risks.filter((x): x is string => typeof x === 'string')
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((x): x is string => typeof x === 'string')
      : [],
    generatedAt: new Date().toISOString(),
  };
}

export function appendDevProjectAnalysis(
  project: Project,
  analysis: ProjectDevFullAnalysis
): Project {
  const list = project.devProjectFullAnalyses ?? [];
  const next = [analysis, ...list].slice(0, MAX_ANALYSES_STORED);
  return { ...project, devProjectFullAnalyses: next };
}

export async function generateAndAppendDevProjectAnalysis(
  project: Project
): Promise<{ project: Project; analysis: ProjectDevFullAnalysis }> {
  try {
    const analysis = await generateProjectDevFullAnalysis(project);
    return { project: appendDevProjectAnalysis(project, analysis), analysis };
  } catch (error) {
    logger.error('Erro ao gerar análise Dev do projeto', 'projectDevFullAnalysisService', error);
    throw error;
  }
}
