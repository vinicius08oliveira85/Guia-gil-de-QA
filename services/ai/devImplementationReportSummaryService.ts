import { callGeminiWithRetry } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { logger } from '../../utils/logger';

const MAX_REPORT_LENGTH = 15_000;

function truncateReport(reportText: string): string {
  if (reportText.length <= MAX_REPORT_LENGTH) return reportText;
  return reportText.slice(0, MAX_REPORT_LENGTH) + '\n\n[... texto truncado para análise ...]';
}

/** Resumo executivo do registro de implementação Dev com IA. */
export async function summarizeDevImplementationReport(reportText: string): Promise<string> {
  if (!reportText.trim()) return '';

  const prompt = `Resuma o seguinte registro de implementação de software de forma concisa.

Requisitos:
- Mantenha identificador da tarefa, título, passos concluídos vs pendentes e validações.
- Use ✅ para concluído e ○ para pendente quando listar passos.
- Inclua evidências e observações relevantes se existirem.
- Linguagem objetiva, poucas linhas.
- Preserve data de conclusão.

REGISTRO ORIGINAL:
---
${truncateReport(reportText)}
---

Retorne apenas o texto resumido, sem introduções.`;

  try {
    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    logger.error(
      'Erro ao resumir registro de implementação Dev',
      'devImplementationReportSummaryService',
      error
    );
    throw error;
  }
}

/** Narrativa em linguagem de negócio para PO / stakeholders. */
export async function summarizeDevImplementationReportForPo(reportText: string): Promise<string> {
  if (!reportText.trim()) return '';

  const prompt = `Transforme o registro de implementação abaixo em narrativa clara para Product Owner.

Requisitos:
- Linguagem de negócio, sem jargão técnico excessivo.
- Explique O QUE foi entregue, COMO foi validado e se há pendências.
- Parágrafo inicial com contexto + fechamento com recomendação (liberar, revisar ou aguardar).
- Preserve identificador da tarefa, título e data.
- Não invente informações.

REGISTRO ORIGINAL:
---
${truncateReport(reportText)}
---

Retorne apenas a narrativa, sem meta-comentários.`;

  try {
    const response = await callGeminiWithRetry({
      model: GEMINI_DEFAULT_MODEL,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    logger.error(
      'Erro ao gerar narrativa PO do registro Dev',
      'devImplementationReportSummaryService',
      error
    );
    throw error;
  }
}
