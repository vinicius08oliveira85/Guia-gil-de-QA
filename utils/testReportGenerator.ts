import { JiraTask } from '../types';
import { normalizeExecutedStrategy } from './testCaseMigration';

export type TestReportFormat = 'text' | 'markdown';

interface GenerateTestReportOptions {
  format?: TestReportFormat;
}

/**
 * Gera um registro resumido dos testes realizados para uma Task
 * Formato texto simples, fácil de copiar e colar em outras plataformas
 */
export function generateTestReport(
  task: JiraTask,
  generatedAt: Date = new Date(),
  options: GenerateTestReportOptions = {}
): string {
  const format: TestReportFormat = options.format ?? 'text';
  const lines: string[] = [];
  const strategies = task.testStrategy ?? [];
  const executedStrategies = task.executedStrategies ?? [];
  const testCases = task.testCases ?? [];
  const strategyTools = task.strategyTools ?? {};
  const headerStatus = task.jiraStatus ?? task.status;
  const generationDateLabel = `${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString('pt-BR')}`;
  const createdAt = task.createdAt ? new Date(task.createdAt) : undefined;
  const completedAt = task.completedAt ? new Date(task.completedAt) : undefined;
  const toolsFromTask = task.toolsUsed ?? [];
  const toolsFromStrategies = executedStrategies
    .map((strategyIndex) => strategyTools[strategyIndex] ?? [])
    .flat();
  const toolsFromStrategyDefinitions = strategies
    .map((strategy) => strategy.tools)
    .filter((tool): tool is string => Boolean(tool));
  const aggregatedTools = Array.from(
    new Set([...toolsFromTask, ...toolsFromStrategies, ...toolsFromStrategyDefinitions])
  ).filter(Boolean);
  const formatTitle = (title: string) => (format === 'markdown' ? `## ${title}` : title.toUpperCase() + ':');
  const listPrefix = format === 'markdown' ? '- ' : '• ';
  const paragraphSeparator = format === 'markdown' ? '\n\n' : '\n';
  
  const formatDate = (date?: Date) =>
    date ? `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}` : 'N/A';

  const pushSection = (title: string, sectionLines: string[], skipIfEmpty = false) => {
    if (skipIfEmpty && sectionLines.length === 0) {
      return;
    }
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push(formatTitle(title));
    if (format === 'markdown') {
      lines.push('');
    }
    lines.push(...sectionLines.filter(Boolean));
  };
  
  // Cabeçalho contextual
  const headerLines = [
    `${format === 'markdown' ? '**Task:**' : 'TASK:'} ${task.id}`,
    `${format === 'markdown' ? '**Título:**' : 'Título:'} ${task.title}`,
    `${format === 'markdown' ? '**Status:**' : 'Status:'} ${headerStatus}`,
    task.type ? `${format === 'markdown' ? '**Tipo:**' : 'Tipo:'} ${task.type}` : '',
    task.priority ? `${format === 'markdown' ? '**Prioridade:**' : 'Prioridade:'} ${task.priority}` : '',
    task.owner ? `${format === 'markdown' ? '**Owner:**' : 'Owner:'} ${task.owner}` : '',
    task.assignee ? `${format === 'markdown' ? '**Responsável QA:**' : 'Responsável QA:'} ${task.assignee}` : '',
    createdAt ? `${format === 'markdown' ? '**Criado em:**' : 'Criado em:'} ${formatDate(createdAt)}` : '',
    completedAt ? `${format === 'markdown' ? '**Concluído em:**' : 'Concluído em:'} ${formatDate(completedAt)}` : '',
    `${format === 'markdown' ? '**Relatório gerado:**' : 'Relatório gerado:'} ${generationDateLabel}`
  ].filter(Boolean);
  pushSection('Contexto da Task', headerLines);
  
  // Estratégias Realizadas (apenas as marcadas como executadas)
  const strategiesSection: string[] = [];
  if (strategies.length > 0 && executedStrategies.length > 0) {
    executedStrategies.forEach((strategyIndex, execIndex) => {
      const strategy = strategies[strategyIndex];
      if (!strategy) {
        return;
      }

      const prefix =
        format === 'markdown' ? `${execIndex + 1}. **${strategy.testType}:** ${strategy.description}` : `${execIndex + 1}. ${strategy.testType}: ${strategy.description}`;

      const extraLines: string[] = [];
      const tools = strategyTools[strategyIndex] || [];
      if (tools.length > 0) {
        extraLines.push(`${listPrefix}Ferramentas: ${tools.join(', ')}`);
      } else if (strategy.tools) {
        extraLines.push(`${listPrefix}Ferramentas: ${strategy.tools}`);
      }
      if (strategy.howToExecute && strategy.howToExecute.length > 0) {
        extraLines.push(`${listPrefix}Checkpoints: ${strategy.howToExecute.join('; ')}`);
      }

      strategiesSection.push(prefix);
      strategiesSection.push(...extraLines.map((line) => (format === 'markdown' ? `   ${line}` : `   ${line}`)));
      strategiesSection.push('');
    });
    if (strategiesSection[strategiesSection.length - 1] === '') {
      strategiesSection.pop();
    }
  }

  // Casos de Teste
  let passedTests = 0;
  let failedTests = 0;
  let notRunTests = 0;

  const testCasesSection: string[] = [];
  if (testCases.length > 0) {
    testCases.forEach((testCase, index) => {
      const status =
        testCase.status === 'Passed' ? 'Aprovado' :
        testCase.status === 'Failed' ? 'Reprovado' :
        'Não Executado';
      
      const statusEmoji =
        testCase.status === 'Passed' ? '✅' :
        testCase.status === 'Failed' ? '❌' :
        '⏸️';

      const caseHeader =
        format === 'markdown'
          ? `${index + 1}. ${statusEmoji} **${testCase.description}** — ${status}`
          : `${index + 1}. ${testCase.description} - Status: ${statusEmoji} ${status}`;
      testCasesSection.push(caseHeader);
      
      const executedTestStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      if (executedTestStrategies.length > 0) {
        testCasesSection.push(`   ${listPrefix}Estratégias: ${executedTestStrategies.join(', ')}`);
      }
      
      if (testCase.testEnvironment) {
        testCasesSection.push(`   ${listPrefix}Ambiente: ${testCase.testEnvironment}`);
      }

      if (testCase.status === 'Failed' && testCase.observedResult) {
        testCasesSection.push(`   ${listPrefix}Resultado Encontrado: ${testCase.observedResult}`);
      } else if (testCase.observedResult) {
        testCasesSection.push(`   ${listPrefix}Observações: ${testCase.observedResult}`);
      }
      
      if (testCase.isAutomated) {
        testCasesSection.push(`   ${listPrefix}Automatizado: Sim`);
      }

      if (testCase.steps && testCase.steps.length > 0 && format === 'markdown') {
        testCasesSection.push('   - Passos principais:');
        testCase.steps.slice(0, 3).forEach((step) => {
          testCasesSection.push(`     - ${step}`);
        });
        if (testCase.steps.length > 3) {
          testCasesSection.push('     - ...');
        }
      }

      if (format === 'markdown') {
        testCasesSection.push('');
      } else {
        testCasesSection.push('');
      }

      if (testCase.status === 'Passed') {
        passedTests++;
      } else if (testCase.status === 'Failed') {
        failedTests++;
      } else if (testCase.status === 'Not Run') {
        notRunTests++;
      }
    });

    if (testCasesSection.length > 0) {
      while (testCasesSection[testCasesSection.length - 1] === '') {
        testCasesSection.pop();
      }
    }
  }

  const totalTests = testCases.length;
  const executedTests = totalTests - notRunTests;
  const executionRate = totalTests > 0 ? Math.round((executedTests / totalTests) * 100) : 0;
  const successRate = executedTests > 0 ? Math.round((passedTests / executedTests) * 100) : 0;

  const summarySection = [
    `${listPrefix}Total de casos: ${totalTests}`,
    `${listPrefix}Executados: ${executedTests} (${executionRate}%)`,
    `${listPrefix}Aprovados: ${passedTests} (${successRate}%)`,
    `${listPrefix}Reprovados: ${failedTests}`,
    `${listPrefix}Não executados: ${notRunTests}`,
    aggregatedTools.length > 0 ? `${listPrefix}Ferramentas: ${aggregatedTools.join(', ')}` : ''
  ].filter(Boolean);

  const observationsSection =
    task.description && task.description.trim().length > 0
      ? [`${task.description.trim()}`]
      : [];

  pushSection('Resumo Executivo', summarySection);
  pushSection('Estratégias Executadas', strategiesSection, true);
  pushSection('Casos de Teste', testCasesSection, true);
  pushSection('Observações Relevantes', observationsSection, true);

  const footerLines = [
    `${listPrefix}Responsável pelo registro: ${task.assignee ?? 'Não informado'}`,
    `${listPrefix}Gerado automaticamente pelo QA Agile Guide`
  ];
  pushSection('Metadados', footerLines);

  const content = lines.join(format === 'markdown' ? '\n' : '\n');

  if (format === 'markdown') {
    // Ajuda a separar seções no markdown
    return content.replace(/\n{3,}/g, '\n\n').trim();
  }

  return content.trim();
}

