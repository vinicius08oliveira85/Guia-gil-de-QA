import { callGeminiWithRetry } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { logger } from '../../utils/logger';

/** Limite de caracteres do relatório enviado à IA (evita payload excessivo e stack overflow no cliente). */
const MAX_REPORT_LENGTH = 15_000;

/**
 * Gera uma versão resumida do registro de testes usando IA.
 * Mantém: identificador da tarefa, título, casos executados com status e resultado encontrado.
 * Não inclui ferramentas de teste.
 */
export async function summarizeTestReport(reportText: string): Promise<string> {
  if (!reportText || !reportText.trim()) {
    return '';
  }

  const truncated =
    reportText.length > MAX_REPORT_LENGTH
      ? reportText.slice(0, MAX_REPORT_LENGTH) + '\n\n[... texto truncado para análise ...]'
      : reportText;

  const prompt = `Resuma o seguinte registro de testes de forma concisa.

Requisitos:
- Mantenha: identificador da tarefa, título, lista de casos executados com status (Aprovado/Reprovado) e resultado encontrado quando houver.
- Para cada status, use o ícone correspondente: ✅ antes de "Aprovado" e ❌ antes de "Reprovado" (ex.: "✅ Aprovado", "❌ Reprovado"). Nunca escreva só "Aprovado" ou "Reprovado" sem o ícone.
- Não inclua ferramentas de teste.
- Use linguagem objetiva e poucas linhas.
- Preserve a estrutura essencial (tarefa, casos, resumo numérico e data de conclusão).

REGISTRO ORIGINAL:
---
${truncated}
---

Retorne apenas o texto resumido, sem introduções ou explicações.`;

  try {
    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: prompt
    });
    return response.text.trim();
  } catch (error) {
    logger.error('Erro ao resumir relatório de testes com IA', 'testReportSummaryService', error);
    throw error;
  }
}
