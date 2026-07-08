import { JiraTask, TestCase } from '../types';
import {
  getTestCaseActionSummary,
  getTestCaseContextLine,
  getTestCaseListTitle,
  getTestCasePoSummary,
  parseTestCaseActionSteps,
  stripLeadingStepIndex,
} from './testCaseActionDisplay';

export type TestReportFormat = 'text' | 'markdown';
export type TestReportMode = 'structured' | 'concise' | 'po';

export interface GenerateTestReportOptions {
  format?: TestReportFormat;
  /** Mantido por compatibilidade; o registro simplificado não detalha ferramentas. */
  includeTools?: boolean;
  /** Saída compacta: resumo direto sem blocos longos. */
  concise?: boolean;
  /** Modo de audiência: structured (QA), concise, po (Product Owner). */
  mode?: TestReportMode;
}

type ExecutedStatus = Exclude<TestCase['status'], 'Not Run'>;

function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
}

function collapseOneLine(value: string): string {
  return value.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function clampText(value: string, maxLength = 180): string {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeBase = lastSpace > 48 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeBase.trim()}…`;
}

function getStatusMeta(status: ExecutedStatus): { label: string; marker: string; icon: string } {
  switch (status) {
    case 'Passed':
      return { label: 'Aprovado', marker: '[APROVADO ✅]', icon: '✅' };
    case 'Failed':
      return { label: 'Reprovado', marker: '[REPROVADO ❌]', icon: '❌' };
    case 'Blocked':
      return { label: 'Bloqueado', marker: '[BLOQUEADO ⚠️]', icon: '⚠️' };
  }
}

function getCaseHeadline(testCase: TestCase, index: number): string {
  const listTitle = getTestCaseListTitle(testCase, { truncate: false }).trim();
  if (listTitle && listTitle !== 'Caso de teste') {
    return collapseOneLine(listTitle);
  }

  const expected = collapseOneLine(testCase.expectedResult || '');
  if (expected && expected !== '—') {
    return expected;
  }

  return `Caso de teste ${index + 1}`;
}

function getObservedSummary(testCase: TestCase): string | null {
  const observed = collapseOneLine(testCase.observedResult || '');
  if (!observed) {
    return null;
  }
  return clampText(observed, 220);
}

function getObservedFull(testCase: TestCase): string | null {
  const observed = (testCase.observedResult || '').trim();
  return observed || null;
}

function buildExecutionCounts(allTestCases: TestCase[]) {
  return {
    total: allTestCases.length,
    approved: allTestCases.filter(tc => tc.status === 'Passed').length,
    failed: allTestCases.filter(tc => tc.status === 'Failed').length,
    blocked: allTestCases.filter(tc => tc.status === 'Blocked').length,
    notRun: allTestCases.filter(tc => tc.status === 'Not Run').length,
  };
}

function getCoverageSummary(task: JiraTask): string | null {
  const strategyNames = (task.testStrategy || [])
    .map(strategy => collapseOneLine(strategy.testType || ''))
    .filter(Boolean);

  if (strategyNames.length === 0) {
    return null;
  }

  return clampText(strategyNames.join(', '), 160);
}

function getTaskDescriptionSummary(task: JiraTask): string | null {
  const raw = (task.description || '').trim();
  if (!raw) {
    return null;
  }
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) {
    return null;
  }
  return clampText(plain, 320);
}

function getBddScopeSummary(task: JiraTask): string | null {
  const scenarios = task.bddScenarios || [];
  if (scenarios.length === 0) {
    return null;
  }
  const titles = scenarios
    .map(s => collapseOneLine(s.title || ''))
    .filter(Boolean)
    .slice(0, 5);
  if (titles.length === 0) {
    return null;
  }
  const suffix = scenarios.length > titles.length ? ` (+${scenarios.length - titles.length} cenário(s))` : '';
  return `${titles.join('; ')}${suffix}`;
}

function isAttentionStatus(status: TestCase['status']): boolean {
  return status === 'Failed' || status === 'Blocked';
}

function formatActionSteps(testCase: TestCase): string[] {
  return parseTestCaseActionSteps(testCase.action || '').map(step => stripLeadingStepIndex(step));
}

function resolveReportMode(options: GenerateTestReportOptions): TestReportMode {
  if (options.mode) {
    return options.mode;
  }
  if (options.concise) {
    return 'concise';
  }
  return 'structured';
}

function buildTaskHeaderLines(task: JiraTask, counts: ReturnType<typeof buildExecutionCounts>): string[] {
  const lines: string[] = [];
  const description = getTaskDescriptionSummary(task);
  const bdd = getBddScopeSummary(task);
  const coverage = getCoverageSummary(task);

  lines.push(`TASK: ${task.id}`);
  lines.push('');
  lines.push(`Título: ${task.title ?? '-'}`);

  if (description) {
    lines.push(`História / contexto: ${description}`);
  }

  if (bdd) {
    lines.push(`Cenários BDD relacionados: ${bdd}`);
  }

  lines.push(
    `Escopo desta execução: ${counts.approved} aprovado(s), ${counts.failed} reprovado(s), ${counts.blocked} bloqueado(s) de ${counts.total} caso(s) mapeado(s).`
  );

  if (coverage) {
    lines.push(`Cobertura validada: ${coverage}`);
  }

  lines.push('');
  return lines;
}

function appendStructuredCaseDetails(
  lines: string[],
  testCase: TestCase,
  index: number,
  statusMeta: ReturnType<typeof getStatusMeta>,
  verbose: boolean
): void {
  lines.push(`${index + 1}. ${statusMeta.marker} ${getCaseHeadline(testCase, index)}`);

  const showFullDetail = verbose || isAttentionStatus(testCase.status);

  if (showFullDetail) {
    const expected = getTestCasePoSummary(testCase);
    if (expected && expected !== getCaseHeadline(testCase, index)) {
      lines.push(`   Resultado esperado: ${collapseOneLine(expected)}`);
    } else if (expected) {
      lines.push(`   Resultado esperado: ${collapseOneLine(expected)}`);
    }

    const actionSummary = getTestCaseActionSummary(testCase, 5);
    if (actionSummary) {
      lines.push(`   Ação necessária: ${actionSummary}`);
    }

    const context = getTestCaseContextLine(testCase);
    if (context) {
      lines.push(`   Parâmetros / contexto: ${context}`);
    }
  }

  const observed = showFullDetail ? getObservedFull(testCase) : getObservedSummary(testCase);
  if (observed) {
    lines.push(`   Resultado obtido: ${observed}`);
  } else if (testCase.status === 'Passed') {
    lines.push('   Resultado obtido: Conforme esperado.');
  }

  lines.push(`   Status final: ${statusMeta.label}`);
  lines.push('');
}

function appendPoCaseBlock(
  lines: string[],
  testCase: TestCase,
  index: number,
  statusMeta: ReturnType<typeof getStatusMeta>
): void {
  const title = getCaseHeadline(testCase, index);
  lines.push(`CASO ${index + 1} — ${statusMeta.label} ${statusMeta.icon}`);
  lines.push(`O que foi validado: ${getTestCasePoSummary(testCase)}`);

  const steps = formatActionSteps(testCase);
  if (steps.length > 0) {
    lines.push('Como foi testado:');
    steps.forEach((step, stepIndex) => {
      lines.push(`  ${stepIndex + 1}. ${step}`);
    });
  } else {
    const actionSummary = getTestCaseActionSummary(testCase);
    if (actionSummary) {
      lines.push(`Como foi testado: ${actionSummary}`);
    }
  }

  const context = getTestCaseContextLine(testCase);
  if (context) {
    lines.push(`Dados / contexto: ${context}`);
  }

  const observed = getObservedFull(testCase);
  if (observed) {
    lines.push(`Resultado obtido: ${observed}`);
  } else if (testCase.status === 'Passed') {
    lines.push('Resultado obtido: Conforme esperado.');
  }

  lines.push(`Status: ${statusMeta.label}`);
  lines.push('');
}

function appendMarkdownCaseBlock(
  lines: string[],
  testCase: TestCase,
  index: number,
  statusMeta: ReturnType<typeof getStatusMeta>,
  verbose: boolean
): void {
  const headline = getCaseHeadline(testCase, index);
  lines.push(`### ${index + 1}. ${headline}`);
  lines.push('');
  lines.push(`**Status:** ${statusMeta.label} ${statusMeta.icon}`);
  lines.push('');

  const showFullDetail = verbose || isAttentionStatus(testCase.status);

  if (showFullDetail) {
    lines.push(`**Resultado esperado:** ${getTestCasePoSummary(testCase)}`);
    lines.push('');

    const steps = formatActionSteps(testCase);
    if (steps.length > 0) {
      lines.push('**Como foi testado:**');
      steps.forEach(step => {
        lines.push(`- ${step}`);
      });
      lines.push('');
    }

    const context = getTestCaseContextLine(testCase);
    if (context) {
      lines.push(`**Dados / contexto:** ${context}`);
      lines.push('');
    }
  }

  const observed = getObservedFull(testCase);
  if (observed) {
    lines.push(`**Resultado obtido:** ${observed}`);
  } else if (testCase.status === 'Passed') {
    lines.push('**Resultado obtido:** Conforme esperado.');
  }
  lines.push('');
}

export function generateTestReport(
  task: JiraTask,
  generatedAt: Date = new Date(),
  options: GenerateTestReportOptions = {}
): string {
  const mode = resolveReportMode(options);
  const format = options.format ?? 'text';
  const allTestCases = task.testCases || [];
  const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run');

  if (format === 'markdown') {
    return generateMarkdownReport(task, executedTestCases, allTestCases, generatedAt, mode);
  }

  if (mode === 'concise') {
    return generateConciseReport(task, executedTestCases, allTestCases, generatedAt);
  }

  if (mode === 'po') {
    return generatePoReport(task, executedTestCases, allTestCases, generatedAt);
  }

  return generateStructuredReport(task, executedTestCases, allTestCases, generatedAt);
}

function generateStructuredReport(
  task: JiraTask,
  executedTestCases: TestCase[],
  allTestCases: TestCase[],
  generatedAt: Date
): string {
  const lines: string[] = [];
  const counts = buildExecutionCounts(allTestCases);

  lines.push(...buildTaskHeaderLines(task, counts));
  lines.push('SÍNTESE DA EXECUÇÃO:');
  lines.push('');
  lines.push(`Total de casos mapeados: ${counts.total}`);
  lines.push(`Executados: ${executedTestCases.length}`);
  lines.push(`Aprovados: ${counts.approved}`);
  lines.push(`Reprovados: ${counts.failed}`);
  lines.push(`Bloqueados: ${counts.blocked}`);
  lines.push(`Não executados: ${counts.notRun}`);
  lines.push('');
  lines.push('RESULTADOS DOS TESTES:');
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    const attention = executedTestCases.filter(tc => isAttentionStatus(tc.status));
    const passed = executedTestCases.filter(tc => tc.status === 'Passed');

    if (attention.length > 0) {
      lines.push('PONTOS DE ATENÇÃO (detalhados):');
      lines.push('');
      attention.forEach((testCase, index) => {
        const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
        appendStructuredCaseDetails(lines, testCase, index, statusMeta, true);
      });
    }

    if (passed.length > 0) {
      if (attention.length > 0) {
        lines.push('CASOS APROVADOS (resumo):');
        lines.push('');
      }
      passed.forEach((testCase, index) => {
        const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
        appendStructuredCaseDetails(lines, testCase, index, statusMeta, false);
      });
    }
  }

  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

function generatePoReport(
  task: JiraTask,
  executedTestCases: TestCase[],
  allTestCases: TestCase[],
  generatedAt: Date
): string {
  const lines: string[] = [];
  const counts = buildExecutionCounts(allTestCases);

  lines.push(`RELATÓRIO DE VALIDAÇÃO PARA PO | ${task.id}`);
  lines.push('');
  lines.push(...buildTaskHeaderLines(task, counts).filter(line => line !== ''));
  lines.push('RESUMO EXECUTIVO:');
  lines.push(
    `${counts.approved} aprovado(s) · ${counts.failed} reprovado(s) · ${counts.blocked} bloqueado(s) · ${counts.notRun} não executado(s)`
  );
  lines.push('');
  lines.push('DETALHAMENTO DOS CASOS EXECUTADOS:');
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
      appendPoCaseBlock(lines, testCase, index, statusMeta);
    });
  }

  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

function generateMarkdownReport(
  task: JiraTask,
  executedTestCases: TestCase[],
  allTestCases: TestCase[],
  generatedAt: Date,
  mode: TestReportMode
): string {
  const lines: string[] = [];
  const counts = buildExecutionCounts(allTestCases);
  const verbose = mode === 'po';

  lines.push(`# Registro de Testes — ${task.id}`);
  lines.push('');
  lines.push(`**Título:** ${task.title ?? '-'}`);
  lines.push('');

  const description = getTaskDescriptionSummary(task);
  if (description) {
    lines.push(`**História / contexto:** ${description}`);
    lines.push('');
  }

  const bdd = getBddScopeSummary(task);
  if (bdd) {
    lines.push(`**Cenários BDD:** ${bdd}`);
    lines.push('');
  }

  lines.push('## Síntese da execução');
  lines.push('');
  lines.push(`| Métrica | Quantidade |`);
  lines.push(`| --- | ---: |`);
  lines.push(`| Total mapeados | ${counts.total} |`);
  lines.push(`| Executados | ${executedTestCases.length} |`);
  lines.push(`| Aprovados | ${counts.approved} |`);
  lines.push(`| Reprovados | ${counts.failed} |`);
  lines.push(`| Bloqueados | ${counts.blocked} |`);
  lines.push(`| Não executados | ${counts.notRun} |`);
  lines.push('');
  lines.push('## Resultados dos testes');
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('_Nenhum teste executado até o momento._');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
      appendMarkdownCaseBlock(lines, testCase, index, statusMeta, verbose);
    });
  }

  lines.push(`_Concluído em: ${formatDateTime(generatedAt)}_`);
  return lines.join('\n');
}

export function generateTestResultsOnlyReport(
  task: JiraTask,
  generatedAt: Date = new Date()
): string {
  const executedTestCases = (task.testCases || []).filter(tc => tc.status !== 'Not Run');
  const lines: string[] = [];

  lines.push(`RESULTADOS EXECUTADOS | ${task.id} | ${task.title ?? '-'}`);
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
      const observed = getObservedSummary(testCase);
      const suffix = observed ? ` | Observação: ${observed}` : '';
      lines.push(
        `${index + 1}. ${statusMeta.label} ${statusMeta.icon}: ${getCaseHeadline(testCase, index)}${suffix}`
      );
    });
  }

  lines.push('');
  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

export function generateTestExecutiveSummary(
  task: JiraTask,
  generatedAt: Date = new Date()
): string {
  const allTestCases = task.testCases || [];
  const counts = buildExecutionCounts(allTestCases);
  const coverage = getCoverageSummary(task);
  const lines: string[] = [];

  lines.push(`Resumo executivo da validação ${task.id}`);
  lines.push(`Título: ${task.title ?? '-'}`);
  lines.push(
    `Status consolidado: ${counts.approved} aprovado(s), ${counts.failed} reprovado(s), ${counts.blocked} bloqueado(s) e ${counts.notRun} não executado(s).`
  );

  if (coverage) {
    lines.push(`Cobertura validada: ${coverage}.`);
  }

  const failedOrBlocked = allTestCases.filter(
    testCase => testCase.status === 'Failed' || testCase.status === 'Blocked'
  );
  if (failedOrBlocked.length > 0) {
    lines.push('');
    lines.push('Pontos de atenção:');
    failedOrBlocked.slice(0, 3).forEach((testCase, index) => {
      const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
      const observed = getObservedSummary(testCase);
      const suffix = observed ? ` (${observed})` : '';
      lines.push(`- ${statusMeta.label}: ${getCaseHeadline(testCase, index)}${suffix}`);
    });
  }

  lines.push('');
  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

function generateConciseReport(
  task: JiraTask,
  executedTestCases: TestCase[],
  allTestCases: TestCase[],
  generatedAt: Date
): string {
  const counts = buildExecutionCounts(allTestCases);
  const lines: string[] = [];

  lines.push(`TASK: ${task.id} | ${task.title ?? '-'}`);
  lines.push(
    `Resumo: ${counts.approved} aprovado(s) | ${counts.failed} reprovado(s) | ${counts.blocked} bloqueado(s) | ${counts.notRun} não executado(s)`
  );
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
      const observed = getObservedSummary(testCase);
      const suffix = observed ? ` | Observação: ${observed}` : '';
      lines.push(`- ${statusMeta.label} ${statusMeta.icon}: ${getCaseHeadline(testCase, index)}${suffix}`);
    });
  }

  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

/** Rótulos exibidos no modal para cada modo de relatório. */
export const TEST_REPORT_MODE_LABELS: Record<TestReportMode | 'markdown', string> = {
  structured: 'Texto estruturado',
  concise: 'Resumido',
  po: 'Para o PO',
  markdown: 'Markdown',
};
