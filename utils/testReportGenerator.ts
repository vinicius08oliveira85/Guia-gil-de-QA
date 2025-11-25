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
  const executedTestCases = (task.testCases || []).filter(
    tc => tc.status !== 'Not Run'
  );

  lines.push(`${boldLabel(format, 'Task')}: ${task.id}`);
  lines.push(`${boldLabel(format, 'Título')}: ${task.title ?? '-'}`);
  lines.push('');

  lines.push(sectionTitle(format, 'Testes executados'));
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusLabel = testCase.status === 'Passed' ? 'Aprovado' : 'Reprovado';
      const description = testCase.description || `Teste ${index + 1}`;
      const prefix =
        format === 'markdown'
          ? `${index + 1}. **${description}** (${statusLabel})`
          : `${index + 1}. ${description} - ${statusLabel}`;
      lines.push(prefix);

      const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      if (executedStrategies.length > 0) {
        lines.push(
          format === 'markdown'
            ? `   - O que foi testado: ${executedStrategies.join(', ')}`
            : `   • O que foi testado: ${executedStrategies.join(', ')}`
        );
      }

      const tools =
        testCase.toolsUsed && testCase.toolsUsed.length > 0
          ? testCase.toolsUsed.join(', ')
          : null;
      lines.push(
        format === 'markdown'
          ? `   - Ferramenta: ${tools ?? 'Não informado'}`
          : `   • Ferramenta: ${tools ?? 'Não informado'}`
      );
      lines.push('');
    });
  }

  lines.push(
    `${boldLabel(format, 'Gerado em')}: ${generatedAt.toLocaleDateString(
      'pt-BR'
    )} às ${generatedAt.toLocaleTimeString('pt-BR')}`
  );

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

