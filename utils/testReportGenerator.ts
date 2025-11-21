import { JiraTask } from '../types';
import { normalizeExecutedStrategy } from './testCaseMigration';

/**
 * Gera um registro resumido dos testes realizados para uma Task
 * Formato texto simples, fácil de copiar e colar em outras plataformas
 */
export function generateTestReport(task: JiraTask): string {
  const lines: string[] = [];
  
  // Cabeçalho
  lines.push(`TASK: ${task.id}`);
  lines.push(`Título: ${task.title}`);
  lines.push('');
  
  // Estratégias Realizadas
  if (task.testStrategy && task.testStrategy.length > 0) {
    lines.push('ESTRATÉGIAS REALIZADAS:');
    task.testStrategy.forEach((strategy, index) => {
      lines.push(`${index + 1}. ${strategy.testType}: ${strategy.description}`);
      if (strategy.tools) {
        lines.push(`   Ferramentas sugeridas: ${strategy.tools}`);
      }
    });
    lines.push('');
  }
  
  // Casos de Teste
  if (task.testCases && task.testCases.length > 0) {
    lines.push('CASOS DE TESTE:');
    task.testCases.forEach((testCase, index) => {
      const statusText = 
        testCase.status === 'Passed' ? 'Aprovado' :
        testCase.status === 'Failed' ? 'Reprovado' :
        'Não Executado';
      
      lines.push(`${index + 1}. ${testCase.description} - Status: ${statusText}`);
      
      // Testes Executados
      const executedStrategies = normalizeExecutedStrategy(testCase.executedStrategy);
      if (executedStrategies.length > 0) {
        lines.push(`   Testes Executados: ${executedStrategies.join(', ')}`);
      }
      
      // Ferramentas do caso de teste
      if (testCase.toolsUsed && testCase.toolsUsed.length > 0) {
        lines.push(`   Ferramentas: ${testCase.toolsUsed.join(', ')}`);
      }
      
      // Resultado observado (se falhou)
      if (testCase.status === 'Failed' && testCase.observedResult) {
        lines.push(`   Resultado Observado: ${testCase.observedResult}`);
      }
      
      // Automação
      if (testCase.isAutomated) {
        lines.push(`   Automatizado: Sim`);
      }
    });
    lines.push('');
  }
  
  // Ferramentas Utilizadas (Geral da Task)
  if (task.toolsUsed && task.toolsUsed.length > 0) {
    lines.push('FERRAMENTAS UTILIZADAS (Geral):');
    task.toolsUsed.forEach(tool => {
      lines.push(`- ${tool}`);
    });
    lines.push('');
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
  
  if (task.completedAt) {
    const completedDate = new Date(task.completedAt);
    lines.push(`Concluído em: ${completedDate.toLocaleDateString('pt-BR')} às ${completedDate.toLocaleTimeString('pt-BR')}`);
  }
  
  return lines.join('\n');
}

