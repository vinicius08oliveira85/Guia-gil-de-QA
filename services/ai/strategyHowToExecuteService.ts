import { Type } from '@google/genai';
import type { JiraTask, TaskIAAnalysis, TestStrategy } from '../../types';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { logger } from '../../utils/logger';

const howToExecuteSchema = {
  type: Type.OBJECT,
  properties: {
    howToExecute: {
      type: Type.ARRAY,
      description: 'Passos numeráveis, curtos e acionáveis para executar o teste nas ferramentas escolhidas.',
      items: { type: Type.STRING },
    },
  },
  required: ['howToExecute'],
};

export interface GenerateStrategyHowToExecuteInput {
  task: Pick<JiraTask, 'id' | 'title' | 'description' | 'type' | 'iaAnalysis'>;
  strategy: TestStrategy;
  tools: string[];
}

function buildAnalysisBlock(analysis: TaskIAAnalysis | undefined): string {
  if (!analysis) {
    return 'Análise IA da tarefa: (não disponível — use apenas a estratégia e o contexto da tarefa).';
  }

  const problems = (analysis.detectedProblems || []).slice(0, 6);
  const missing = (analysis.missingItems || []).slice(0, 6);
  const improvements = (analysis.qaImprovements || []).slice(0, 6);

  return [
    'Análise IA da tarefa:',
    `- Resumo: ${analysis.summary || '—'}`,
    `- Risco: ${analysis.riskLevel} (${analysis.riskScore}/100)`,
    problems.length ? `- Problemas detectados:\n${problems.map(p => `  • ${p}`).join('\n')}` : null,
    missing.length ? `- Itens faltantes:\n${missing.map(m => `  • ${m}`).join('\n')}` : null,
    improvements.length
      ? `- Melhorias QA sugeridas:\n${improvements.map(i => `  • ${i}`).join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Normaliza resposta da IA em lista de passos utilizáveis. */
export function normalizeHowToExecuteSteps(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(step => (typeof step === 'string' ? step.trim() : String(step ?? '').trim()))
    .filter(Boolean)
    .slice(0, 12);
}

/** Extrai JSON bruto de respostas que venham com fences markdown. */
function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

/**
 * Gera (ou regenera) o passo a passo "Como executar" de uma estratégia
 * alinhado às ferramentas selecionadas e à análise da tarefa.
 */
export async function generateStrategyHowToExecute(
  input: GenerateStrategyHowToExecuteInput
): Promise<string[]> {
  const tools = input.tools.map(t => t.trim()).filter(Boolean);
  if (tools.length === 0) {
    throw new Error('Selecione ao menos uma ferramenta antes de gerar os passos.');
  }

  const { task, strategy } = input;
  const description = stripHtml(task.description || '').slice(0, 2500);

  const prompt = `Você é um QA sênior. Responda em português brasileiro.

Objetivo: gerar um passo a passo PRÁTICO para executar a estratégia de teste abaixo,
usando EXCLUSIVAMENTE as ferramentas selecionadas pelo QA.

Regras:
- Cada passo deve ser concreto, imperativo e executável na ferramenta (ex.: "No Postman, criar request GET…").
- Mencione a ferramenta no passo quando fizer sentido.
- Cubra preparação, execução e verificação do resultado.
- Use a análise IA quando disponível para focar riscos e validações relevantes.
- Não invente URLs/credenciais/ambientes — use placeholders claros (ex.: {{BASE_URL}}, {{TOKEN}}).
- Entre 4 e 10 passos. Sem markdown. Sem introdução.

Tarefa: ${task.id} — ${task.title}
Tipo: ${task.type}
Descrição (resumo): ${description || '—'}

Estratégia:
- Tipo: ${strategy.testType}
- Objetivo: ${strategy.description}
- Ferramentas sugeridas na estratégia: ${strategy.tools || '—'}

Ferramentas selecionadas pelo QA: ${tools.join(', ')}

${buildAnalysisBlock(task.iaAnalysis)}
`.trim();

  try {
    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: howToExecuteSchema,
      },
    });

    const payload = extractJsonPayload(response.text || '');
    const parsed = JSON.parse(payload) as {
      howToExecute?: unknown;
      steps?: unknown;
    };
    const steps = normalizeHowToExecuteSteps(parsed.howToExecute ?? parsed.steps);
    if (steps.length === 0) {
      throw new Error('A IA não retornou passos válidos. Tente novamente.');
    }
    return steps;
  } catch (error) {
    logger.error(
      'Erro ao gerar passo a passo da estratégia de teste',
      'strategyHowToExecuteService',
      error
    );
    throw error;
  }
}
