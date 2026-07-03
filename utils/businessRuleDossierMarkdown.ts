import type {
  BusinessRuleAnalysis,
  BusinessRuleFunctionalityItem,
  BusinessRuleTaskSheet,
} from '../types';

const STATUS_LABELS: Record<NonNullable<BusinessRuleFunctionalityItem['implementationStatus']>, string> = {
  implementado: 'Implementado',
  parcial: 'Parcialmente implementado',
  pendente: 'Pendente',
  legado: 'Legado / descontinuado',
};

function renderTaskSheet(sheet: BusinessRuleTaskSheet): string[] {
  const title = sheet.taskTitle.trim();
  const header = title ? `${sheet.taskId} — ${title}` : sheet.taskId;

  return [
    `### ${header}`,
    '',
    `Identificação Jira: **${sheet.taskId}**`,
    '',
    '#### O que foi implementado',
    '',
    sheet.implemented.trim(),
    '',
    '#### Legado vs melhoria',
    '',
    '**Antes (legado):**',
    '',
    sheet.legacyBefore.trim(),
    '',
    '**Depois (melhoria):**',
    '',
    sheet.improvedAfter.trim(),
    '',
    '#### Função e integrações',
    '',
    `- **Função:** ${sheet.purpose.trim()}`,
    `- **Sistemas / módulos:** ${sheet.integratedSystems.trim()}`,
    '',
    '#### Resultado esperado',
    '',
    sheet.expectedResult.trim(),
    '',
    '---',
    '',
  ];
}

function renderFunctionality(f: BusinessRuleFunctionalityItem): string[] {
  const lines: string[] = [`### ${f.name}`, ''];

  if (f.taskIds.length > 0) {
    lines.push(`**Tasks:** ${f.taskIds.join(', ')}`);
  }
  if (f.implementationStatus) {
    lines.push(`**Status:** ${STATUS_LABELS[f.implementationStatus]}`);
  }
  if (f.description.trim()) {
    lines.push('', f.description.trim());
  }

  lines.push('', '#### O que foi implementado', '', f.implemented.trim(), '');
  lines.push('#### Resultado esperado', '', f.expectedResult.trim(), '');

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

  if (analysis.taskSheets.length > 0) {
    lines.push('## Fichas técnicas por task', '');
    lines.push(
      'Detalhamento individual de cada task vinculada: implementação, legado vs melhoria, integrações e resultado esperado.',
      ''
    );
    for (const sheet of analysis.taskSheets) {
      lines.push(...renderTaskSheet(sheet));
    }
  }

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
      'Visão consolidada por funcionalidade de negócio (pode agrupar mais de uma task).',
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
