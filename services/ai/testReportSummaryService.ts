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
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    logger.error('Erro ao resumir relatório de testes com IA', 'testReportSummaryService', error);
    throw error;
  }
}

/**
 * Gera narrativa em linguagem de negócio para apresentação ao Product Owner.
 */
export async function summarizeTestReportForPo(reportText: string): Promise<string> {
  if (!reportText || !reportText.trim()) {
    return '';
  }

  const truncated =
    reportText.length > MAX_REPORT_LENGTH
      ? reportText.slice(0, MAX_REPORT_LENGTH) + '\n\n[... texto truncado para análise ...]'
      : reportText;

  const prompt = `Transforme o registro de testes abaixo em uma narrativa clara para um Product Owner (PO).

Requisitos:
- Linguagem de negócio, sem jargão técnico de QA.
- Explique O QUE foi validado, POR QUE importa para a entrega e QUAL foi o resultado.
- Destaque reprovações e bloqueios como pontos que exigem decisão ou acompanhamento.
- Para casos aprovados, agrupe por tema quando possível (não liste um por um se forem similares).
- Inclua um parágrafo inicial com contexto da história/tarefa e um fechamento com recomendação (liberar, revisar ou aguardar).
- Use parágrafos curtos e bullets apenas para exceções.
- Preserve identificador da tarefa, título e data de conclusão.
- Não invente informações que não estejam no registro.

REGISTRO ORIGINAL:
---
${truncated}
---

Retorne apenas a narrativa para o PO, sem introduções meta.`;

  try {
    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    logger.error('Erro ao gerar narrativa PO com IA', 'testReportSummaryService', error);
    throw error;
  }
}
