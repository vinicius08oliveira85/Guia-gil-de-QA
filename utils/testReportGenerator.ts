import { JiraTask, TestCase } from '../types';
import { normalizeExecutedStrategy } from './testCaseMigration';

export type TestReportFormat = 'text' | 'markdown';

export interface GenerateTestReportOptions {
  format?: TestReportFormat;
  /** Exibir "Ferramentas Utilizadas" nas estratégias. Default: false. */
  includeTools?: boolean;
  /** Saída compacta: menos linhas em branco, casos em uma linha cada. Default: false. */
  concise?: boolean;
}

/**
 * Formata data no formato dd/MM/yyyy às HH:mm:ss
 */
function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
}

/**
 * Gera um registro de testes realizados seguindo o modelo padronizado
 */
export function generateTestReport(
  task: JiraTask,
  generatedAt: Date = new Date(),
  options: GenerateTestReportOptions = {}
): string {
  const format: TestReportFormat = options.format ?? 'text';
  const includeTools = options.includeTools ?? false;
  const concise = options.concise ?? false;
  const lines: string[] = [];
  const allTestCases = task.testCases || [];
  const executedTestCases = allTestCases.filter(
    tc => tc.status !== 'Not Run'
  );

  if (concise) {
    return generateConciseReport(task, executedTestCases, allTestCases, generatedAt);
  }

  // Cabeçalho
  lines.push(`TASK: ${task.id}`);
  lines.push('');
  lines.push(`Título: ${task.title ?? '-'}`);
  lines.push('');
  lines.push('');

  // Seção ESTRATÉGIAS REALIZADAS
  if (executedTestCases.length > 0) {
    lines.push('ESTRATÉGIAS REALIZADAS:');
    lines.push('');

    const strategyMap = buildStrategyMap(task, executedTestCases, includeTools);
    const sortedStrategies = Array.from(strategyMap.values()).sort((a, b) =>
      a.testType.localeCompare(b.testType)
    );

    sortedStrategies.forEach((strategy, index) => {
      lines.push(`${index + 1}. ${strategy.testType}: ${strategy.description}`);
      lines.push('');
      if (includeTools) {
        const toolsList = Array.from(strategy.tools).join(', ') || 'Não informado';
        lines.push(`   Ferramentas Utilizadas: ${toolsList}`);
        lines.push('');
      }
      lines.push('');
    });
  } else {
    lines.push('ESTRATÉGIAS REALIZADAS:');
    lines.push('');
    lines.push('Nenhuma estratégia executada até o momento.');
    lines.push('');
    lines.push('');
  }

  // Seção CASOS DE TESTE
  lines.push('CASOS DE TESTE:');
  lines.push('');
  lines.push('');

  if (executedTestCases.length === 0) {
    lines.push('Nenhum teste executado até o momento.');
    lines.push('');
  } else {
    executedTestCases.forEach((testCase, index) => {
      const statusEmoji = testCase.status === 'Passed' ? '✅' : '❌';
      const statusLabel = testCase.status === 'Passed' ? 'Aprovado' : 'Reprovado';
      const description = testCase.description || `Teste ${index + 1}`;

      const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      const testType = executedStrategies.length > 0 ? executedStrategies[0] : 'Não especificado';

      lines.push(`${index + 1}. ${description} - Status: ${statusEmoji} ${statusLabel}`);
      lines.push('');
      lines.push(`   Testes Executados: ${testType}`);

      if (testCase.observedResult && testCase.observedResult.trim()) {
        if (format === 'markdown') {
          lines.push('');
          lines.push(`   **Resultado Encontrado:** <span style="color: red;">${testCase.observedResult}</span>`);
        } else {
          lines.push('');
          lines.push(`   RESULTADO ENCONTRADO: ${testCase.observedResult}`);
        }
      }

      lines.push('');
      lines.push('');
    });
  }

  // Seção RESUMO
  lines.push('RESUMO:');
  lines.push('');

  const totalTestCases = allTestCases.length;
  const approved = allTestCases.filter(tc => tc.status === 'Passed').length;
  const failed = allTestCases.filter(tc => tc.status === 'Failed').length;
  const notRun = allTestCases.filter(tc => tc.status === 'Not Run').length;

  lines.push(`Total de Casos de Teste: ${totalTestCases}`);
  lines.push(`Aprovados: ${approved}`);
  lines.push(`Reprovados: ${failed}`);
  lines.push(`Não Executados: ${notRun}`);
  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);

  return lines.join('\n');
}

type StrategyEntry = { testType: string; description: string; tools: Set<string> };

function buildStrategyMap(
  task: JiraTask,
  executedTestCases: TestCase[],
  includeTools: boolean
): Map<string, StrategyEntry> {
  const strategyMap = new Map<string, StrategyEntry>();

  executedTestCases.forEach(testCase => {
    const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);

    executedStrategies.forEach(strategyName => {
      if (!strategyMap.has(strategyName)) {
        const strategyIndex = task.testStrategy?.findIndex(s => s.testType === strategyName);
        const strategy = strategyIndex !== undefined && strategyIndex >= 0
          ? task.testStrategy![strategyIndex]
          : undefined;

        const toolsSet = new Set<string>();
        if (includeTools) {
          if (strategyIndex !== undefined && strategyIndex >= 0 && task.strategyTools?.[strategyIndex]) {
            task.strategyTools[strategyIndex].forEach(tool => toolsSet.add(tool));
          }
          if (testCase.toolsUsed?.length) {
            testCase.toolsUsed.forEach(tool => toolsSet.add(tool));
          }
          if (toolsSet.size === 0 && strategy?.tools) {
            strategy.tools.split(',').forEach(tool => {
              const t = tool.trim();
              if (t) toolsSet.add(t);
            });
          }
        }

        strategyMap.set(strategyName, {
          testType: strategyName,
          description: strategy?.description || strategyName,
          tools: toolsSet
        });
      } else if (includeTools) {
        const existing = strategyMap.get(strategyName)!;
        const strategyIndex = task.testStrategy?.findIndex(s => s.testType === strategyName);
        if (strategyIndex !== undefined && strategyIndex >= 0 && task.strategyTools?.[strategyIndex]) {
          task.strategyTools[strategyIndex].forEach(tool => existing.tools.add(tool));
        }
        if (testCase.toolsUsed?.length) {
          testCase.toolsUsed.forEach(tool => existing.tools.add(tool));
        }
      }
    });
  });

  return strategyMap;
}

function generateConciseReport(
  task: JiraTask,
  executedTestCases: TestCase[],
  allTestCases: TestCase[],
  generatedAt: Date
): string {
  const lines: string[] = [];
  lines.push(`TASK: ${task.id} | Título: ${task.title ?? '-'}`);
  lines.push('');

  if (executedTestCases.length > 0) {
    const strategyNames = new Set<string>();
    executedTestCases.forEach(tc => {
      normalizeExecutedStrategy(tc.executedStrategy).forEach(s => strategyNames.add(s));
    });
    lines.push('Estratégias: ' + Array.from(strategyNames).sort().join(', '));
    lines.push('');
    lines.push('Casos de teste:');
    executedTestCases.forEach((tc, index) => {
      const status = tc.status === 'Passed' ? 'Aprovado' : 'Reprovado';
      const desc = tc.description || `Teste ${index + 1}`;
      const result = tc.observedResult?.trim() ? ` [${tc.observedResult}]` : '';
      lines.push(`${index + 1}. ${desc} – ${status}${result}`);
    });
  } else {
    lines.push('Nenhum teste executado até o momento.');
  }

  lines.push('');
  const total = allTestCases.length;
  const approved = allTestCases.filter(tc => tc.status === 'Passed').length;
  const failed = allTestCases.filter(tc => tc.status === 'Failed').length;
  const notRun = allTestCases.filter(tc => tc.status === 'Not Run').length;
  lines.push(`Resumo: ${total} total | Aprovados: ${approved} | Reprovados: ${failed} | Não executados: ${notRun}`);
  lines.push(`Concluído em: ${formatDateTime(generatedAt)}`);
  return lines.join('\n');
}

