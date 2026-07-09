import type { DevGuidanceArtifact, JiraTask } from '../types';

/** Converte o guia Dev em Markdown para cópia/exportação. */
export function devGuidanceToMarkdown(task: Pick<JiraTask, 'title' | 'id'>, guidance: DevGuidanceArtifact): string {
  const lines: string[] = [
    `# Guia de implementação — ${task.title}`,
    '',
    `**Tarefa:** ${task.id}`,
    '',
    '## Visão geral',
    '',
    guidance.overview.trim(),
    '',
  ];

  if (guidance.prerequisites.length > 0) {
    lines.push('## Pré-requisitos', '');
    guidance.prerequisites.forEach(item => lines.push(`- ${item}`));
    lines.push('');
  }

  if (guidance.implementationSteps.length > 0) {
    lines.push('## Passos de implementação', '');
    for (const step of [...guidance.implementationSteps].sort((a, b) => a.order - b.order)) {
      lines.push(`### ${step.order}. ${step.title}`, '', step.description.trim(), '');
      if (step.filesOrModules?.length) {
        lines.push('**Módulos/arquivos sugeridos:**', '');
        step.filesOrModules.forEach(f => lines.push(`- \`${f}\``));
        lines.push('');
      }
      if (step.codeHints?.trim()) {
        lines.push('**Dicas de código:**', '', '```', step.codeHints.trim(), '```', '');
      }
      if (step.validationChecklist?.length) {
        lines.push('**Validação:**', '');
        step.validationChecklist.forEach(c => lines.push(`- [ ] ${c}`));
        lines.push('');
      }
    }
  }

  if (guidance.dataModel?.trim()) {
    lines.push('## Modelo de dados', '', guidance.dataModel.trim(), '');
  }
  if (guidance.apiContracts?.trim()) {
    lines.push('## Contratos de API', '', guidance.apiContracts.trim(), '');
  }
  if (guidance.risksAndEdgeCases?.length) {
    lines.push('## Riscos e edge cases', '');
    guidance.risksAndEdgeCases.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }
  if (guidance.suggestedTests?.length) {
    lines.push('## Testes sugeridos (para o dev escrever)', '');
    guidance.suggestedTests.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}
