import type { DevImplementationRecord, JiraTask, Project } from '../types';
import { CURSOR_IMPLEMENTATION_TOOL_LABEL } from './cursorAgentUi';
import { formatDevStackSummary } from './devStackFormat';
import { normalizeDevStackConfig } from './devStackPresets';

export type DevImplementationReportFormat = 'text' | 'markdown';
export type DevImplementationReportMode = 'structured' | 'concise';

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
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain || null;
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
        lines.push(`   ${collapseOneLine(step.description)}`);
        if (step.filesOrModules?.length) {
          lines.push(`   Arquivos: ${step.filesOrModules.join(', ')}`);
        }
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
  }

  const description = getTaskDescriptionSummary(task);
  if (description) {
    lines.push(
      isMarkdown ? `**Contexto:** ${description}` : `Contexto: ${description}`
    );
  }

  const stack = options.project?.settings?.devStack;
  if (stack) {
    const summary = formatDevStackSummary(normalizeDevStackConfig(stack));
    lines.push(isMarkdown ? `**Stack:** ${summary}` : `Stack: ${summary}`);
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
      lines.push('VISÃO GERAL DO GUIA', guidance.overview.trim(), '');
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
      lines.push('EVIDÊNCIAS / LINKS');
      record.evidenceLinks.forEach(link => lines.push(`  • ${link}`));
      lines.push('');
    }
  }

  if (record?.notes?.trim()) {
    if (isMarkdown) {
      lines.push('## Observações do desenvolvedor', '', record.notes.trim(), '');
    } else {
      lines.push('OBSERVAÇÕES DO DESENVOLVEDOR', record.notes.trim(), '');
    }
  }

  if (isMarkdown) {
    lines.push('---', '', '*Registro gerado pelo Guia Agile — Projeto Dev*', '');
  } else {
    lines.push('—', 'Registro gerado pelo Guia Agile — Projeto Dev');
  }

  return lines.join('\n').trimEnd() + '\n';
}

export const DEV_IMPLEMENTATION_REPORT_MODE_LABELS = {
  structured: 'Completo',
  concise: 'Resumido',
} as const;
