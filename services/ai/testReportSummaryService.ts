import { callGeminiWithRetry } from './geminiApiWrapper';
import { logger } from '../../utils/logger';

/**
 * Gera uma versão resumida do registro de testes usando IA.
 * Mantém: identificador da tarefa, título, casos executados com status e resultado encontrado.
 * Não inclui ferramentas de teste.
 */
export async function summarizeTestReport(reportText: string): Promise<string> {
  if (!reportText || !reportText.trim()) {
    return '';
  }

  const prompt = `Resuma o seguinte registro de testes de forma concisa.

Requisitos:
- Mantenha: identificador da tarefa, título, lista de casos executados com status (Aprovado/Reprovado) e resultado encontrado quando houver.
- Para cada status, use o ícone correspondente: ✅ antes de "Aprovado" e ❌ antes de "Reprovado" (ex.: "✅ Aprovado", "❌ Reprovado"). Nunca escreva só "Aprovado" ou "Reprovado" sem o ícone.
- Não inclua ferramentas de teste.
- Use linguagem objetiva e poucas linhas.
- Preserve a estrutura essencial (tarefa, casos, resumo numérico e data de conclusão).

REGISTRO ORIGINAL:
---
${reportText}
---

Retorne apenas o texto resumido, sem introduções ou explicações.`;

  try {
    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text.trim();
  } catch (error) {
    logger.error('Erro ao resumir relatório de testes com IA', 'testReportSummaryService', error);
    throw error;
  }
}
