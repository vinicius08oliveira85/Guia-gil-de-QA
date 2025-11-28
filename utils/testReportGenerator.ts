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
  const lines: string[] = [];
  const allTestCases = task.testCases || [];
  const executedTestCases = allTestCases.filter(
    tc => tc.status !== 'Not Run'
  );

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

    // Coletar estratégias únicas dos casos executados
    const strategyMap = new Map<string, {
      testType: string;
      description: string;
      tools: Set<string>;
    }>();

    executedTestCases.forEach(testCase => {
      const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      
      executedStrategies.forEach(strategyName => {
        if (!strategyMap.has(strategyName)) {
          // Buscar estratégia em task.testStrategy pelo testType
          const strategyIndex = task.testStrategy?.findIndex(s => s.testType === strategyName);
          const strategy = strategyIndex !== undefined && strategyIndex >= 0 
            ? task.testStrategy![strategyIndex] 
            : undefined;
          
          // Coletar ferramentas: priorizar task.strategyTools[índice], depois testCase.toolsUsed, depois strategy.tools
          const toolsSet = new Set<string>();
          
          // 1. Prioridade: Ferramentas da estratégia em task.strategyTools
          if (strategyIndex !== undefined && strategyIndex >= 0 && task.strategyTools?.[strategyIndex]) {
            task.strategyTools[strategyIndex].forEach(tool => toolsSet.add(tool));
          }
          
          // 2. Ferramentas do testCase
          if (testCase.toolsUsed && testCase.toolsUsed.length > 0) {
            testCase.toolsUsed.forEach(tool => toolsSet.add(tool));
          }
          
          // 3. Ferramentas sugeridas da estratégia (se não houver outras)
          if (toolsSet.size === 0 && strategy?.tools) {
            strategy.tools.split(',').forEach(tool => {
              const trimmed = tool.trim();
              if (trimmed) toolsSet.add(trimmed);
            });
          }

          strategyMap.set(strategyName, {
            testType: strategyName,
            description: strategy?.description || strategyName,
            tools: toolsSet
          });
        } else {
          // Adicionar ferramentas deste caso de teste à estratégia existente
          const existing = strategyMap.get(strategyName)!;
          
          // Buscar índice da estratégia para verificar task.strategyTools
          const strategyIndex = task.testStrategy?.findIndex(s => s.testType === strategyName);
          if (strategyIndex !== undefined && strategyIndex >= 0 && task.strategyTools?.[strategyIndex]) {
            task.strategyTools[strategyIndex].forEach(tool => existing.tools.add(tool));
          }
          
          if (testCase.toolsUsed && testCase.toolsUsed.length > 0) {
            testCase.toolsUsed.forEach(tool => existing.tools.add(tool));
          }
        }
      });
    });

    // Ordenar estratégias e formatar
    const sortedStrategies = Array.from(strategyMap.values()).sort((a, b) => 
      a.testType.localeCompare(b.testType)
    );

    sortedStrategies.forEach((strategy, index) => {
      const toolsList = Array.from(strategy.tools).join(', ') || 'Não informado';
      lines.push(`${index + 1}. ${strategy.testType}: ${strategy.description}`);
      lines.push('');
      lines.push(`   Ferramentas Utilizadas: ${toolsList}`);
      lines.push('');
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
      
      // Obter testType do executedStrategy (primeiro se houver múltiplos)
      const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      const testType = executedStrategies.length > 0 ? executedStrategies[0] : 'Não especificado';

      lines.push(`${index + 1}. ${description} - Status: ${statusEmoji} ${statusLabel}`);
      lines.push('');
      lines.push(`   Testes Executados: ${testType}`);
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

