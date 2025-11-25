import { JiraTask } from '../types';
import { normalizeExecutedStrategy } from './testCaseMigration';

export type TestReportFormat = 'text' | 'markdown';

interface GenerateTestReportOptions {
  format?: TestReportFormat;
}

const sectionTitle = (format: TestReportFormat, title: string) =>
  format === 'markdown' ? `## ${title}` : `${title.toUpperCase()}:`;

const boldLabel = (format: TestReportFormat, label: string) =>
  format === 'markdown' ? `**${label}**` : label.toUpperCase();

/**
 * Gera um registro enxuto contendo apenas os testes executados
 * e as ferramentas utilizadas.
 */
export function generateTestReport(
  task: JiraTask,
  generatedAt: Date = new Date(),
  options: GenerateTestReportOptions = {}
): string {
  const format: TestReportFormat = options.format ?? 'text';
  const lines: string[] = [];
  const executedTestCases = (task.testCases || []).filter(tc => tc.status !== 'Not Run');
  const executedStrategyIndexes = new Set(task.executedStrategies || []);
  const strategyTools = task.strategyTools || {};

  const collectedTools = new Set<string>();
  const registerTools = (tools?: string[] | string) => {
    if (!tools) return;
    const list = Array.isArray(tools) ? tools : tools.split(',').map(t => t.trim());
    list.filter(Boolean).forEach(tool => collectedTools.add(tool));
  };

  registerTools(task.toolsUsed);
  executedStrategyIndexes.forEach(index => {
    registerTools(strategyTools[index]);
    const strategy = task.testStrategy?.[index];
    if (strategy?.tools) {
      registerTools(strategy.tools);
    }
  });
  executedTestCases.forEach(testCase => registerTools(testCase.toolsUsed));

  const headingLines = [
    `${boldLabel(format, 'Task')}: ${task.id}`,
    `${boldLabel(format, 'Título')}: ${task.title}`,
    `${boldLabel(format, 'Status')}: ${task.jiraStatus ?? task.status}`
  ];

  lines.push(...headingLines, '');
  lines.push(sectionTitle(format, 'Testes executados'));
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusLabel = testCase.status === 'Passed' ? 'Aprovado' : 'Reprovado';
      const prefix =
        format === 'markdown'
          ? `${index + 1}. **${testCase.description}** (${statusLabel})`
          : `${index + 1}. ${testCase.description} - ${statusLabel}`;
      lines.push(prefix);

      const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      if (executedStrategies.length > 0) {
        lines.push(format === 'markdown'
          ? `   - O que foi testado: ${executedStrategies.join(', ')}`
          : `   • O que foi testado: ${executedStrategies.join(', ')}`);
      }

      const tools =
        testCase.toolsUsed && testCase.toolsUsed.length > 0
          ? testCase.toolsUsed.join(', ')
          : null;
      lines.push(format === 'markdown'
        ? `   - Ferramenta: ${tools ?? 'Não informado'}`
        : `   • Ferramenta: ${tools ?? 'Não informado'}`);
      lines.push('');
    });
  }

  const toolSummary =
    collectedTools.size > 0
      ? Array.from(collectedTools).join(', ')
      : 'Não informado';

  lines.push(sectionTitle(format, 'Ferramentas utilizadas'));
  lines.push('');
  lines.push(toolSummary, '');

  lines.push(`${boldLabel(format, 'Gerado em')}: ${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString('pt-BR')}`);
  lines.push(`${boldLabel(format, 'Fonte')}: QA Agile Guide`);

  const content = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return content;
}

