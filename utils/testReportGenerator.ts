import { JiraTask } from '../types';
import { normalizeExecutedStrategy } from './testCaseMigration';

/**
 * Gera um registro resumido dos testes realizados para uma Task
 * Formato texto simples, fácil de copiar e colar em outras plataformas
 */
export function generateTestReport(task: JiraTask, generatedAt: Date = new Date()): string {
  const lines: string[] = [];
  
  // Cabeçalho
  lines.push(`TASK: ${task.id}`);
  lines.push(`Título: ${task.title}`);
  lines.push('');
  
  // Estratégias Realizadas (apenas as marcadas como executadas)
  const executedStrategies = task.executedStrategies || [];
  if (task.testStrategy && task.testStrategy.length > 0 && executedStrategies.length > 0) {
    lines.push('ESTRATÉGIAS REALIZADAS:');
    executedStrategies.forEach((strategyIndex) => {
      const strategy = task.testStrategy![strategyIndex];
      if (strategy) {
        lines.push(`${executedStrategies.indexOf(strategyIndex) + 1}. ${strategy.testType}: ${strategy.description}`);
        
        // Ferramentas Utilizadas nesta estratégia
        const tools = task.strategyTools?.[strategyIndex] || [];
        if (tools.length > 0) {
          lines.push(`   Ferramentas Utilizadas: ${tools.join(', ')}`);
        }
      }
    });
    lines.push('');
  }
  
  // Casos de Teste
  if (task.testCases && task.testCases.length > 0) {
    lines.push('CASOS DE TESTE:');
    lines.push('');
    task.testCases.forEach((testCase, index) => {
      const statusText = 
        testCase.status === 'Passed' ? 'Aprovado' :
        testCase.status === 'Failed' ? 'Reprovado' :
        'Não Executado';
      
      // Status destacado
      const statusEmoji = 
        testCase.status === 'Passed' ? '✅' :
        testCase.status === 'Failed' ? '❌' :
        '⏸️';
      
      lines.push(`${index + 1}. ${testCase.description} - Status: ${statusEmoji} ${statusText}`);
      
      // Testes Executados
      const executedTestStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      if (executedTestStrategies.length > 0) {
        lines.push(`   Testes Executados: ${executedTestStrategies.join(', ')}`);
      }
      
      // Resultado observado (se falhou)
      if (testCase.status === 'Failed' && testCase.observedResult) {
        lines.push(`   Resultado Observado: ${testCase.observedResult}`);
      }
      
      // Automação
      if (testCase.isAutomated) {
        lines.push(`   Automatizado: Sim`);
      }
      
      lines.push(''); // Linha em branco entre casos de teste
    });
  }
  
  // Resumo
  const totalTests = task.testCases?.length || 0;
  const passedTests = task.testCases?.filter(tc => tc.status === 'Passed').length || 0;
  const failedTests = task.testCases?.filter(tc => tc.status === 'Failed').length || 0;
  const notRunTests = task.testCases?.filter(tc => tc.status === 'Not Run').length || 0;
  
  lines.push('RESUMO:');
  lines.push(`Total de Casos de Teste: ${totalTests}`);
  lines.push(`Aprovados: ${passedTests}`);
  lines.push(`Reprovados: ${failedTests}`);
  lines.push(`Não Executados: ${notRunTests}`);
  
  const completedDate = generatedAt;
  lines.push(`Concluído em: ${completedDate.toLocaleDateString('pt-BR')} às ${completedDate.toLocaleTimeString('pt-BR')}`);
  
  return lines.join('\n');
}

