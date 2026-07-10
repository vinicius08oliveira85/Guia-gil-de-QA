import type { ProjectDevFullAnalysis } from '../types';

/** Formata a análise Dev mais recente do projeto para prompts de guia por tarefa. */
export function formatLatestDevProjectAnalysisForPrompt(
  analyses: ProjectDevFullAnalysis[] | undefined | null
): string {
  if (!analyses?.length) {
    return '(nenhuma análise Dev do projeto gerada ainda — use apenas stack e contexto da tarefa)';
  }

  const latest = [...analyses].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )[0];
  const lines = [
    `Resumo executivo: ${latest.summary}`,
    `Alinhamento com a stack: ${latest.stackAlignment}`,
    `Backlog de implementação: ${latest.implementationBacklog}`,
    `Notas de arquitetura: ${latest.architectureNotes}`,
  ];

  if (latest.strengths?.length) {
    lines.push(`Pontos fortes: ${latest.strengths.join('; ')}`);
  }
  if (latest.weaknesses?.length) {
    lines.push(`Pontos fracos: ${latest.weaknesses.join('; ')}`);
  }
  if (latest.risks?.length) {
    lines.push(`Riscos: ${latest.risks.join('; ')}`);
  }
  if (latest.recommendations?.length) {
    lines.push(`Recomendações: ${latest.recommendations.join('; ')}`);
  }

  return lines.join('\n');
}

/** Fingerprint curto da análise Dev mais recente (invalidação de cache de guia). */
export function devProjectAnalysisFingerprint(
  analyses: ProjectDevFullAnalysis[] | undefined | null
): string {
  if (!analyses?.length) return '';
  const latest = [...analyses].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )[0];
  return `${latest.generatedAt}|${latest.summary.length}|${latest.implementationBacklog.length}`;
}
