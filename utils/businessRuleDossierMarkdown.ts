import type { BusinessRuleAnalysis, BusinessRuleFunctionalityItem } from '../types';

const STATUS_LABELS: Record<NonNullable<BusinessRuleFunctionalityItem['implementationStatus']>, string> = {
  implementado: 'Implementado',
  parcial: 'Parcialmente implementado',
  pendente: 'Pendente',
  legado: 'Legado / descontinuado',
};

function renderFunctionality(f: BusinessRuleFunctionalityItem): string[] {
  const lines: string[] = [`### ${f.name}`, ''];

  if (f.taskIds.length > 0) {
    lines.push(`**Tasks:** ${f.taskIds.join(', ')}`);
  }
  if (f.implementationStatus) {
    lines.push(`**Status:** ${STATUS_LABELS[f.implementationStatus]}`);
  }
  if (f.description.trim()) {
    lines.push('', `**Resumo:** ${f.description.trim()}`);
  }

  lines.push('', '**O que foi implementado:**', f.implemented.trim(), '');
  lines.push('**Resultado esperado:**', f.expectedResult.trim(), '');

  return lines;
}

export function buildDossierMarkdown(
  ruleTitle: string,
  analysis: Omit<BusinessRuleAnalysis, 'markdown' | 'version' | 'generatedAt'>
): string {
  const lines: string[] = [
    `# Dossiê: ${ruleTitle}`,
    '',
    '## Resumo executivo',
    analysis.executiveSummary,
    '',
    '## Como era',
    analysis.asWas,
    '',
    '## Como está',
    analysis.asIs,
    '',
    '## Como será',
    analysis.toBe,
    '',
  ];

  if (analysis.components.length > 0) {
    lines.push('## Componentes', '');
    for (const c of analysis.components) {
      lines.push(`### ${c.name}`, '');
      if (c.taskIds.length > 0) {
        lines.push(`**Tasks:** ${c.taskIds.join(', ')}`, '');
      }
      lines.push(c.description.trim(), '');
    }
  }

  if (analysis.functionalities.length > 0) {
    lines.push('## Funcionalidades', '');
    lines.push(
      'Detalhamento por funcionalidade: implementação atual e resultado esperado para o usuário/negócio.',
      ''
    );
    for (const f of analysis.functionalities) {
      lines.push(...renderFunctionality(f));
    }
  }

  if (analysis.integrations.length > 0) {
    lines.push('## Integrações', '');
    lines.push('| Sistema | Tipo | Evidência | Tasks |');
    lines.push('| --- | --- | --- | --- |');
    for (const i of analysis.integrations) {
      lines.push(
        `| ${i.system} | ${i.type} | ${i.evidence.replace(/\|/g, '/')} | ${i.taskIds.join(', ')} |`
      );
    }
    lines.push('');
  }

  if (analysis.traceability.length > 0) {
    lines.push('## Rastreabilidade', '');
    lines.push('| Task | Seção | Confiança |');
    lines.push('| --- | --- | --- |');
    for (const t of analysis.traceability) {
      lines.push(`| ${t.taskId} | ${t.section} | ${t.confidence} |`);
    }
  }

  return lines.join('\n').trim();
}
