import { JiraTask } from '../types';
import { normalizeExecutedStrategy } from './testCaseMigration';

/**
 * Gera um registro resumido dos testes realizados para uma Task
 * Formato texto simples, fácil de copiar e colar em outras plataformas
 */
export function generateTestReport(task: JiraTask, generatedAt: Date = new Date()): string {
  const lines: string[] = [];
  const strategies = task.testStrategy ?? [];
  const executedStrategies = task.executedStrategies ?? [];
  const testCases = task.testCases ?? [];
  const strategyTools = task.strategyTools ?? {};
  
  // Cabeçalho
  lines.push(`TASK: ${task.id}`);
  lines.push(`Título: ${task.title}`);
  lines.push('');
  
  // Estratégias Realizadas (apenas as marcadas como executadas)
  if (strategies.length > 0 && executedStrategies.length > 0) {
    lines.push('ESTRATÉGIAS REALIZADAS:');
    executedStrategies.forEach((strategyIndex, execIndex) => {
      const strategy = strategies[strategyIndex];
      if (!strategy) {
        return;
      }
      
      lines.push(`${execIndex + 1}. ${strategy.testType}: ${strategy.description}`);
      
      // Ferramentas Utilizadas nesta estratégia
      const tools = strategyTools[strategyIndex] || [];
      if (tools.length > 0) {
        lines.push(`   Ferramentas Utilizadas: ${tools.join(', ')}`);
      }
    });
    lines.push('');
  }
  
  // Casos de Teste
  let passedTests = 0;
  let failedTests = 0;
  let notRunTests = 0;
  
  if (testCases.length > 0) {
    lines.push('CASOS DE TESTE:');
    lines.push('');
    testCases.forEach((testCase, index) => {
      const status =
        testCase.status === 'Passed' ? 'Aprovado' :
        testCase.status === 'Failed' ? 'Reprovado' :
        'Não Executado';
      
      const statusEmoji =
        testCase.status === 'Passed' ? '✅' :
        testCase.status === 'Failed' ? '❌' :
        '⏸️';
      
      lines.push(`${index + 1}. ${testCase.description} - Status: ${statusEmoji} ${status}`);
      
      // Testes Executados
      const executedTestStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      if (executedTestStrategies.length > 0) {
        lines.push(`   Testes Executados: ${executedTestStrategies.join(', ')}`);
      }
      
      // Resultado encontrado (se falhou)
      if (testCase.status === 'Failed' && testCase.observedResult) {
        lines.push(`   Resultado Encontrado: ${testCase.observedResult}`);
      }
      
      // Automação
      if (testCase.isAutomated) {
        lines.push('   Automatizado: Sim');
      }
      
      // Contabiliza status para o resumo
      if (testCase.status === 'Passed') {
        passedTests++;
      } else if (testCase.status === 'Failed') {
        failedTests++;
      } else if (testCase.status === 'Not Run') {
        notRunTests++;
      }
      
      lines.push(''); // Linha em branco entre casos de teste
    });
  }
  
  // Resumo
  const totalTests = testCases.length;
  lines.push('RESUMO:');
  lines.push(`Total de Casos de Teste: ${totalTests}`);
  lines.push(`Aprovados: ${passedTests}`);
  lines.push(`Reprovados: ${failedTests}`);
  lines.push(`Não Executados: ${notRunTests}`);
  
  const completedDate = generatedAt;
  lines.push(`Concluído em: ${completedDate.toLocaleDateString('pt-BR')} às ${completedDate.toLocaleTimeString('pt-BR')}`);
  
  return lines.join('\n');
}

