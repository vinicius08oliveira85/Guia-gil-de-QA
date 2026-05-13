import { JiraTask, TestCase } from '../types';
import { getTestCaseListTitle } from './testCaseActionDisplay';

export type TestReportFormat = 'text';

export interface GenerateTestReportOptions {
  format?: TestReportFormat;
  /** Mantido por compatibilidade; o registro simplificado não detalha ferramentas. */
  includeTools?: boolean;
  /** Saída compacta: resumo direto sem blocos longos. */
  concise?: boolean;
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

function getStatusMeta(status: ExecutedStatus): { label: string; marker: string } {
  switch (status) {
    case 'Passed':
      return { label: 'Aprovado', marker: '[APROVADO]' };
    case 'Failed':
      return { label: 'Reprovado', marker: '[REPROVADO]' };
    case 'Blocked':
      return { label: 'Bloqueado', marker: '[BLOQUEADO]' };
  }
}

function getCaseHeadline(testCase: TestCase, index: number): string {
  const listTitle = getTestCaseListTitle(testCase).trim();
  if (listTitle && listTitle !== 'Caso de teste') {
    return clampText(listTitle);
  }

  const expected = collapseOneLine(testCase.expectedResult || '');
  if (expected && expected !== '—') {
    return clampText(expected);
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

export function generateTestReport(
  task: JiraTask,
  generatedAt: Date = new Date(),
  options: GenerateTestReportOptions = {}
): string {
  const concise = options.concise ?? false;
  const allTestCases = task.testCases || [];
  const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run');

  if (concise) {
    return generateConciseReport(task, executedTestCases, allTestCases, generatedAt);
  }

  const lines: string[] = [];
  const counts = buildExecutionCounts(allTestCases);
  const coverage = getCoverageSummary(task);

  lines.push(`TASK: ${task.id}`);
  lines.push('');
  lines.push(`Título: ${task.title ?? '-'}`);
  lines.push('');
  lines.push('SÍNTESE DA EXECUÇÃO:');
  lines.push('');
  lines.push(`Total de casos mapeados: ${counts.total}`);
  lines.push(`Executados: ${executedTestCases.length}`);
  lines.push(`Aprovados: ${counts.approved}`);
  lines.push(`Reprovados: ${counts.failed}`);
  lines.push(`Bloqueados: ${counts.blocked}`);
  lines.push(`Não executados: ${counts.notRun}`);
  if (coverage) {
    lines.push(`Cobertura validada: ${coverage}`);
  }
  lines.push('');
  lines.push('RESULTADOS DOS TESTES:');
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusMeta = getStatusMeta(testCase.status as ExecutedStatus);
      lines.push(`${index + 1}. ${statusMeta.marker} ${getCaseHeadline(testCase, index)}`);

      const observed = getObservedSummary(testCase);
      if (observed) {
        lines.push(`   Observação: ${observed}`);
      }

      lines.push(`   Status final: ${statusMeta.label}`);
      lines.push('');
    });
  }

  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
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
      lines.push(`${index + 1}. ${statusMeta.label}: ${getCaseHeadline(testCase, index)}${suffix}`);
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
      lines.push(`- ${statusMeta.label}: ${getCaseHeadline(testCase, index)}${suffix}`);
    });
  }

  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}
