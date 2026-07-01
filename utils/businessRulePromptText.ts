import type { BusinessRule } from '../types';

function formatTaskSheetsForPrompt(rule: BusinessRule): string {
  const sheets = rule.analysis?.taskSheets ?? [];
  if (sheets.length === 0) return '';

  const blocks = sheets.map(s => {
    return [
      `- ${s.taskId}: ${s.taskTitle}`,
      `  Implementado: ${s.implemented}`,
      `  Legado: ${s.legacyBefore}`,
      `  Melhoria: ${s.improvedAfter}`,
      `  Função: ${s.purpose}`,
      `  Integrações: ${s.integratedSystems}`,
      `  Resultado esperado: ${s.expectedResult}`,
    ].join('\n');
  });

  return `Fichas técnicas por task:\n${blocks.join('\n\n')}`;
}

function formatFunctionalitiesForPrompt(rule: BusinessRule): string {
  const items = rule.analysis?.functionalities ?? [];
  if (items.length === 0) return '';

  const blocks = items.map(f => {
    const tasks = f.taskIds.length > 0 ? `Tasks: ${f.taskIds.join(', ')}` : '';
    const status = f.implementationStatus ? `Status: ${f.implementationStatus}` : '';
    return [
      `- ${f.name}`,
      f.description ? `  Resumo: ${f.description}` : '',
      `  Implementado: ${f.implemented}`,
      `  Resultado esperado: ${f.expectedResult}`,
      tasks,
      status,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return `Funcionalidades:\n${blocks.join('\n\n')}`;
}

/** Texto usado em prompts de IA a partir do dossiê ou descrição legada. */
export function getBusinessRulePromptText(rule: BusinessRule): string {
  if (rule.analysis) {
    const parts = [
      rule.analysis.executiveSummary,
      rule.analysis.asIs ? `Como está: ${rule.analysis.asIs}` : '',
      rule.analysis.toBe ? `Como será: ${rule.analysis.toBe}` : '',
      formatTaskSheetsForPrompt(rule),
      formatFunctionalitiesForPrompt(rule),
    ].filter(Boolean);
    return parts.join('\n\n');
  }
  return rule.description?.trim() ?? '';
}
