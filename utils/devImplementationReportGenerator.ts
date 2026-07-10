import type { DevImplementationRecord, JiraTask, Project } from '../types';
import { CURSOR_IMPLEMENTATION_TOOL_LABEL } from './cursorAgentUi';
import { formatDevStackSummary } from './devStackFormat';
import { normalizeDevStackConfig } from './devStackPresets';
import {
  parseTaskDescriptionForReport,
  splitStepDescriptionLines,
} from './devReportTextStructure';

export type DevImplementationReportFormat = 'text' | 'markdown';
export type DevImplementationReportMode = 'structured' | 'concise' | 'po';

export interface GenerateDevImplementationReportOptions {
  format?: DevImplementationReportFormat;
  mode?: DevImplementationReportMode;
  /** Registro em edição (antes de persistir) ou já salvo na tarefa. */
  record?: DevImplementationRecord;
  project?: Project | null;
  generatedAt?: Date;
}

const SUGGESTED_TESTS_RESULT_LABELS: Record<
  NonNullable<DevImplementationRecord['suggestedTestsResult']>,
  string
> = {
  passed: 'Executados com sucesso',
  partial: 'Parcialmente executados',
  pending: 'Pendentes',
  not_run: 'Não executados',
};

function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

function collapseOneLine(value: string): string {
  return value.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getTaskDescriptionSummary(task: JiraTask): string | null {
  const raw = (task.description || '').trim();
  if (!raw) return null;
  const { contextParagraphs } = parseTaskDescriptionForReport(raw);
  if (contextParagraphs.length > 0) {
    return contextParagraphs.join(' ');
  }
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain || null;
}

function appendTaskContextLines(
  lines: string[],
  task: JiraTask,
  isMarkdown: boolean
): void {
  const raw = (task.description || '').trim();
  if (!raw) return;

  const { contextParagraphs, acceptanceCriteria } = parseTaskDescriptionForReport(raw);

  if (contextParagraphs.length > 0) {
    if (isMarkdown) {
      lines.push('## Contexto', '');
      contextParagraphs.forEach(p => lines.push(p, ''));
    } else {
      lines.push('CONTEXTO', '');
      contextParagraphs.forEach(p => lines.push(p, ''));
    }
  }

  if (acceptanceCriteria.length > 0) {
    if (isMarkdown) {
      lines.push('## Critérios de aceite', '');
      acceptanceCriteria.forEach(item => lines.push(`- [ ] ${item}`));
      lines.push('');
    } else {
      lines.push('CRITÉRIOS DE ACEITE', '');
      acceptanceCriteria.forEach(item => lines.push(`- [ ] ${item}`));
      lines.push('');
    }
  }
}

function resolveRecord(
  task: JiraTask,
  record?: DevImplementationRecord
): DevImplementationRecord | undefined {
  return record ?? task.devImplementationRecord;
}

function buildStepLines(
  task: JiraTask,
  record: DevImplementationRecord | undefined,
  mode: DevImplementationReportMode,
  format: DevImplementationReportFormat
): string[] {
  const guidance = task.devGuidance;
  if (!guidance?.implementationSteps.length) {
    return mode === 'concise' ? [] : ['(Guia Dev sem passos estruturados.)', ''];
  }

  const completedOrders = new Set(record?.completedStepOrders ?? []);
  const lines: string[] = [];
  const sorted = [...guidance.implementationSteps].sort((a, b) => a.order - b.order);
  const doneCount = sorted.filter(s => completedOrders.has(s.order)).length;

  if (format === 'markdown') {
    lines.push(`## Passos de implementação (${doneCount}/${sorted.length} concluídos)`, '');
  } else {
    lines.push(`PASSOS DE IMPLEMENTAÇÃO (${doneCount}/${sorted.length} concluídos)`, '');
  }

  for (const step of sorted) {
    const done = completedOrders.has(step.order);
    const marker = done ? '[CONCLUÍDO ✓]' : '[PENDENTE ○]';

    if (format === 'markdown') {
      lines.push(`### ${step.order}. ${step.title} ${done ? '✓' : ''}`, '');
      lines.push(step.description.trim(), '');
      if (step.filesOrModules?.length) {
        lines.push('**Arquivos/módulos:**', '');
        step.filesOrModules.forEach(f => lines.push(`- \`${f}\``));
        lines.push('');
      }
      if (mode === 'structured' && step.validationChecklist?.length) {
        lines.push('**Validações:**', '');
        for (const item of step.validationChecklist) {
          const checked = record?.completedValidations?.includes(item);
          lines.push(`- [${checked ? 'x' : ' '}] ${item}`);
        }
        lines.push('');
      }
    } else {
      lines.push(`${step.order}. ${marker} ${step.title}`);
      if (mode === 'structured') {
        const descriptionLines = splitStepDescriptionLines(step.description);
        if (descriptionLines.length > 0) {
          lines.push('   Descrição:');
          descriptionLines.forEach(line => lines.push(`   ${line}`));
        }
        if (step.filesOrModules?.length) {
          lines.push(`   Arquivos: ${step.filesOrModules.join(', ')}`);
        }
        if (step.validationChecklist?.length) {
          lines.push('   Validações:');
          for (const item of step.validationChecklist) {
            const checked = record?.completedValidations?.includes(item);
            lines.push(`   - [${checked ? 'x' : ' '}] ${item}`);
          }
        }
        lines.push('');
      }
    }
  }

  if (format !== 'markdown') lines.push('');
  return lines;
}

/**
 * Gera registro de implementação Dev (espelho do registro de testes QA).
 */
export function generateDevImplementationReport(
  task: JiraTask,
  options: GenerateDevImplementationReportOptions = {}
): string {
  const format = options.format ?? 'text';
  const mode = options.mode ?? 'structured';
  const generatedAt = options.generatedAt ?? new Date();
  const record = resolveRecord(task, options.record);
  const guidance = task.devGuidance;
  const isMarkdown = format === 'markdown';

  if (mode === 'po') {
    const poLines = buildPoReportLines(task, record, generatedAt);
    if (isMarkdown) {
      return (
        [
          `# Registro de Implementação — ${task.title}`,
          '',
          `**Tarefa:** ${task.id}`,
          '',
          ...poLines,
          '',
          '*Registro gerado pelo Guia Agile — Projeto Dev*',
          '',
        ].join('\n').trimEnd() + '\n'
      );
    }
    return poLines.join('\n').trimEnd() + '\n';
  }

  const lines: string[] = [];

  if (isMarkdown) {
    lines.push(`# Registro de Implementação — ${task.title}`, '');
    lines.push(`**Tarefa:** ${task.id}`, '');
    lines.push(`**Gerado em:** ${formatDateTime(generatedAt)}`, '');
    lines.push(`**Ferramenta:** ${CURSOR_IMPLEMENTATION_TOOL_LABEL}`, '');
  } else {
    lines.push('REGISTRO DE IMPLEMENTAÇÃO DEV');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(`Tarefa: ${task.id}`);
    lines.push(`Título: ${task.title ?? '-'}`);
    lines.push(`Gerado em: ${formatDateTime(generatedAt)}`);
    lines.push(`Ferramenta: ${CURSOR_IMPLEMENTATION_TOOL_LABEL}`);
    lines.push('');
  }

  appendTaskContextLines(lines, task, isMarkdown);

  const stack = options.project?.settings?.devStack;
  if (stack) {
    const summary = formatDevStackSummary(normalizeDevStackConfig(stack));
    lines.push(isMarkdown ? `**Stack:** ${summary}` : `Stack: ${summary}`);
    lines.push('');
  }

  if (task.status === 'Done' || task.completedAt) {
    const when = task.completedAt ?? record?.completedAt;
    lines.push(
      isMarkdown
        ? `**Status:** Concluída${when ? ` (${when})` : ''}`
        : `Status: Concluída${when ? ` (${when})` : ''}`
    );
  } else if (record?.completedAt) {
    lines.push(
      isMarkdown
        ? `**Implementação registrada em:** ${record.completedAt}`
        : `Implementação registrada em: ${record.completedAt}`
    );
  }

  lines.push('');

  if (guidance?.overview?.trim()) {
    if (isMarkdown) {
      lines.push('## Visão geral do guia', '', guidance.overview.trim(), '');
    } else if (mode === 'structured') {
      lines.push('VISÃO GERAL DO GUIA', '', guidance.overview.trim(), '');
    }
  }

  lines.push(...buildStepLines(task, record, mode, format));

  if (record?.suggestedTestsResult && guidance?.suggestedTests?.length) {
    const label = SUGGESTED_TESTS_RESULT_LABELS[record.suggestedTestsResult];
    if (isMarkdown) {
      lines.push(`## Testes sugeridos`, '', `**Resultado:** ${label}`, '');
      guidance.suggestedTests.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    } else {
      lines.push(`Testes sugeridos — ${label}`);
      guidance.suggestedTests.forEach(t => lines.push(`  • ${t}`));
      lines.push('');
    }
  } else if (mode === 'structured' && guidance?.suggestedTests?.length) {
    if (isMarkdown) {
      lines.push('## Testes sugeridos', '');
      guidance.suggestedTests.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    } else {
      lines.push('TESTES SUGERIDOS');
      guidance.suggestedTests.forEach(t => lines.push(`  • ${t}`));
      lines.push('');
    }
  }

  if (record?.evidenceLinks?.length) {
    if (isMarkdown) {
      lines.push('## Evidências / links', '');
      record.evidenceLinks.forEach(link => lines.push(`- ${link}`));
      lines.push('');
    } else {
      lines.push('EVIDÊNCIAS / LINKS', '');
      record.evidenceLinks.forEach(link => lines.push(`  • ${link}`));
      lines.push('');
    }
  }

  if (record?.notes?.trim()) {
    if (isMarkdown) {
      lines.push('## Observações do desenvolvedor', '', record.notes.trim(), '');
    } else {
      lines.push('OBSERVAÇÕES DO DESENVOLVEDOR', '', record.notes.trim(), '');
    }
  }

  if (isMarkdown) {
    lines.push('---', '', '*Registro gerado pelo Guia Agile — Projeto Dev*', '');
  } else {
    lines.push('—', 'Registro gerado pelo Guia Agile — Projeto Dev');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function buildImplementationCounts(task: JiraTask, record?: DevImplementationRecord) {
  const steps = task.devGuidance?.implementationSteps ?? [];
  const completedOrders = new Set(record?.completedStepOrders ?? []);
  const total = steps.length;
  const completed = steps.filter(s => completedOrders.has(s.order)).length;
  return {
    total,
    completed,
    pending: Math.max(total - completed, 0),
  };
}

/** Resumo executivo curto (atalho de cópia). */
export function generateDevImplementationExecutiveSummary(
  task: JiraTask,
  options: Omit<GenerateDevImplementationReportOptions, 'format' | 'mode'> = {}
): string {
  const generatedAt = options.generatedAt ?? new Date();
  const record = resolveRecord(task, options.record);
  const counts = buildImplementationCounts(task, record);
  const lines: string[] = [];

  lines.push(`Resumo executivo da implementação ${task.id}`);
  lines.push(`Título: ${task.title ?? '-'}`);
  lines.push(
    `Status: ${counts.completed}/${counts.total} passo(s) concluído(s)${counts.pending ? `, ${counts.pending} pendente(s)` : ''}.`
  );

  if (record?.suggestedTestsResult && task.devGuidance?.suggestedTests?.length) {
    lines.push(
      `Testes sugeridos: ${SUGGESTED_TESTS_RESULT_LABELS[record.suggestedTestsResult]}.`
    );
  }

  if (record?.evidenceLinks?.length) {
    lines.push(`Evidências: ${record.evidenceLinks.length} link(s) anexado(s).`);
  }

  if (record?.notes?.trim()) {
    lines.push(`Observação: ${collapseOneLine(record.notes)}`);
  }

  lines.push('');
  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

/** Somente passos concluídos/pendentes (atalho de cópia). */
export function generateDevImplementationStepsOnlyReport(
  task: JiraTask,
  options: Omit<GenerateDevImplementationReportOptions, 'format' | 'mode'> = {}
): string {
  const generatedAt = options.generatedAt ?? new Date();
  const record = resolveRecord(task, options.record);
  const guidance = task.devGuidance;
  const lines: string[] = [];

  lines.push(`PASSOS DE IMPLEMENTAÇÃO | ${task.id} | ${task.title ?? '-'}`);
  lines.push('');

  if (!guidance?.implementationSteps.length) {
    lines.push('Nenhum passo estruturado no guia Dev.');
  } else {
    const completedOrders = new Set(record?.completedStepOrders ?? []);
    [...guidance.implementationSteps]
      .sort((a, b) => a.order - b.order)
      .forEach(step => {
        const done = completedOrders.has(step.order);
        lines.push(
          `${step.order}. ${done ? '✅ Concluído' : '○ Pendente'}: ${step.title}`
        );
      });
  }

  lines.push('');
  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

function buildPoReportLines(
  task: JiraTask,
  record: DevImplementationRecord | undefined,
  generatedAt: Date
): string[] {
  const counts = buildImplementationCounts(task, record);
  const lines: string[] = [
    `Entrega de implementação — ${task.id}`,
    '',
    `História: ${task.title ?? '-'}`,
  ];

  const description = getTaskDescriptionSummary(task);
  if (description) {
    lines.push(`Contexto: ${description}`);
  }
  lines.push(
    `Resultado: ${counts.completed} de ${counts.total} passos do guia de implementação foram concluídos.`
  );

  if (record?.suggestedTestsResult && task.devGuidance?.suggestedTests?.length) {
    lines.push(
      `Validação técnica: ${SUGGESTED_TESTS_RESULT_LABELS[record.suggestedTestsResult]}.`
    );
  }

  if (record?.notes?.trim()) {
    lines.push('');
    lines.push('Observações do desenvolvedor:');
    lines.push(record.notes.trim());
  }

  if (record?.evidenceLinks?.length) {
    lines.push('');
    lines.push('Evidências:');
    record.evidenceLinks.forEach(link => lines.push(`- ${link}`));
  }

  lines.push('');
  lines.push(`Registro gerado em ${formatDateTime(generatedAt)}.`);
  return lines;
}

export const DEV_IMPLEMENTATION_REPORT_MODE_LABELS = {
  structured: 'Texto estruturado',
  concise: 'Resumido',
  po: 'Para o PO',
  markdown: 'Markdown',
} as const;
