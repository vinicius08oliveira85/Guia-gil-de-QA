import { Type } from '@google/genai';
import type {
  CursorAgentAction,
  JiraTask,
  StrategyCursorAgentTestPrompt,
  TaskIAAnalysis,
  TestStrategy,
} from '../../types';
import { normalizeCursorAgentAction } from '../../utils/cursorAgentUi';
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
    cursorAgentTestPrompts: {
      type: Type.ARRAY,
      description:
        'Um prompt completo por ferramenta selecionada, para o Agente do Cursor criar código ou collection de teste.',
      items: {
        type: Type.OBJECT,
        properties: {
          tool: {
            type: Type.STRING,
            description: 'Nome exato da ferramenta (deve coincidir com a lista selecionada).',
          },
          action: {
            type: Type.STRING,
            description: 'Sempre "create" para este fluxo (criar artefato de teste).',
          },
          prompt: {
            type: Type.STRING,
            description:
              'Prompt auto-suficiente em português para colar no Agente do Cursor e criar o artefato.',
          },
        },
        required: ['tool', 'prompt'],
      },
    },
  },
  required: ['howToExecute', 'cursorAgentTestPrompts'],
};

export interface GenerateStrategyHowToExecuteInput {
  task: Pick<JiraTask, 'id' | 'title' | 'description' | 'type' | 'iaAnalysis'>;
  strategy: TestStrategy;
  tools: string[];
}

export interface GenerateStrategyHowToExecuteResult {
  howToExecute: string[];
  cursorAgentTestPrompts: StrategyCursorAgentTestPrompt[];
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

/**
 * Normaliza prompts do Agent por ferramenta, garantindo 1 item por tool pedida.
 */
export function normalizeCursorAgentTestPrompts(
  raw: unknown,
  tools: string[]
): StrategyCursorAgentTestPrompt[] {
  const byTool = new Map<string, StrategyCursorAgentTestPrompt>();

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const tool = typeof record.tool === 'string' ? record.tool.trim() : '';
      const prompt = typeof record.prompt === 'string' ? record.prompt.trim() : '';
      if (!tool || !prompt) continue;
      const action: CursorAgentAction = normalizeCursorAgentAction(record.action);
      byTool.set(tool.toLowerCase(), { tool, prompt, action: action || 'create' });
    }
  }

  return tools.map(tool => {
    const existing = byTool.get(tool.toLowerCase());
    if (existing) {
      return { ...existing, tool, action: existing.action ?? 'create' };
    }
    return {
      tool,
      action: 'create' as const,
      prompt: [
        `Crie um artefato de teste automatizado para a ferramenta "${tool}".`,
        '',
        'Objetivo: criar código ou collection pronto para executar o cenário desta estratégia de QA.',
        'Use placeholders claros para URLs, tokens e ambientes (ex.: {{BASE_URL}}, {{TOKEN}}).',
        'Não invente credenciais. Siga as convenções do repositório e limite o escopo a esta ferramenta.',
        'Ao terminar, liste os arquivos criados e como executar o teste.',
      ].join('\n'),
    };
  });
}

/** Extrai JSON bruto de respostas que venham com fences markdown. */
function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

/**
 * Gera (ou regenera) o passo a passo "Como executar" e prompts do Agente do Cursor
 * (código/collection) — um prompt por ferramenta selecionada.
 */
export async function generateStrategyHowToExecute(
  input: GenerateStrategyHowToExecuteInput
): Promise<GenerateStrategyHowToExecuteResult> {
  const tools = input.tools.map(t => t.trim()).filter(Boolean);
  if (tools.length === 0) {
    throw new Error('Selecione ao menos uma ferramenta antes de gerar os passos.');
  }

  const { task, strategy } = input;
  const description = stripHtml(task.description || '').slice(0, 2500);

  const prompt = `Você é um QA sênior especializado em automação. Responda em português brasileiro.

Objetivo duplo:
1) Gerar um passo a passo PRÁTICO (howToExecute) para o QA executar a estratégia manualmente.
2) Gerar cursorAgentTestPrompts: EXATAMENTE um prompt por ferramenta selecionada, para o Agente do Cursor CRIAR artefato de teste (código ou collection), não apenas um roteiro textual.

Regras do howToExecute:
- Cada passo concreto, imperativo e executável na ferramenta.
- Cubra preparação, execução e verificação.
- Entre 4 e 10 passos. Sem markdown. Sem introdução.
- Use placeholders ({{BASE_URL}}, {{TOKEN}}). Não invente URLs/credenciais reais.

Regras de cursorAgentTestPrompts:
- Array com exatamente ${tools.length} item(ns), um para cada ferramenta nesta ordem: ${tools.map(t => `"${t}"`).join(', ')}.
- Campo tool: nome idêntico ao da lista.
- Campo action: sempre "create".
- Campo prompt: texto completo, auto-suficiente, pronto para colar no chat do Agente do Cursor.
  * Pedir CRIAÇÃO de artefato concreto (ex.: collection Postman exportável, script Insomnia/Newman, SQL de validação no DBeaver, query Kibana/Elastic, Playwright/cypress se couber).
  * Incluir: contexto da tarefa, tipo de estratégia, ferramentas, critérios de conclusão e restrições.
  * Formatar com Objetivo, Requisitos, Passos numerados (1. 2. …) e Restrições com bullets.
  * O agente não terá outro contexto além deste prompt.

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
      cursorAgentTestPrompts?: unknown;
    };
    const steps = normalizeHowToExecuteSteps(parsed.howToExecute ?? parsed.steps);
    if (steps.length === 0) {
      throw new Error('A IA não retornou passos válidos. Tente novamente.');
    }

    return {
      howToExecute: steps,
      cursorAgentTestPrompts: normalizeCursorAgentTestPrompts(
        parsed.cursorAgentTestPrompts,
        tools
      ),
    };
  } catch (error) {
    logger.error(
      'Erro ao gerar passo a passo da estratégia de teste',
      'strategyHowToExecuteService',
      error
    );
    throw error;
  }
}
