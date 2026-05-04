import { Project } from '../types';

export interface Suggestion {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'high' | 'medium' | 'low';
}

/**
 * Gera sugestões automáticas baseadas no estado do projeto
 */
export const generateSuggestions = (project: Project): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  const tasks = project.tasks || [];

  // Sugestão: Criar primeira tarefa
  if (tasks.length === 0) {
    suggestions.push({
      id: 'suggestion-1',
      type: 'tip',
      title: 'Comece criando sua primeira tarefa',
      message:
        'Adicione uma tarefa para começar a organizar seu trabalho de QA. Use o wizard para aprender passo a passo!',
      priority: 'high',
    });
    return suggestions; // Retornar cedo se não há tarefas
  }

  // Sugestão: Tarefas sem BDD
  const tasksWithoutBDD = tasks.filter(
    t => t.status !== 'Done' && (!t.bddScenarios || t.bddScenarios.length === 0) && t.type !== 'Bug'
  );
  if (tasksWithoutBDD.length > 0) {
    suggestions.push({
      id: 'suggestion-2',
      type: 'info',
      title: `${tasksWithoutBDD.length} tarefa(s) sem cenários BDD`,
      message:
        'Cenários BDD ajudam a definir o comportamento esperado. Considere criar cenários BDD para suas tarefas em andamento.',
      priority: 'medium',
    });
  }

  // Sugestão: Tarefas sem casos de teste
  const tasksWithoutTests = tasks.filter(
    t => t.status !== 'Done' && (!t.testCases || t.testCases.length === 0) && t.type !== 'Bug'
  );
  if (tasksWithoutTests.length > 0) {
    suggestions.push({
      id: 'suggestion-3',
      type: 'warning',
      title: `${tasksWithoutTests.length} tarefa(s) sem casos de teste`,
      message:
        'Casos de teste são essenciais para validar funcionalidades. Gere casos de teste para suas tarefas.',
      priority: 'high',
    });
  }

  // Sugestão: Testes não executados
  const allTestCases = tasks.flatMap(t => t.testCases || []);
  const unexecutedTests = allTestCases.filter(tc => tc.status === 'Not Run');
  if (unexecutedTests.length > 0) {
    suggestions.push({
      id: 'suggestion-4',
      type: 'info',
      title: `${unexecutedTests.length} caso(s) de teste não executado(s)`,
      message:
        'Execute seus casos de teste para validar as funcionalidades e identificar problemas.',
      priority: 'medium',
    });
  }

  // Sugestão: Bugs críticos abertos
  const criticalBugs = tasks.filter(
    t => t.type === 'Bug' && t.status !== 'Done' && t.severity === 'Crítico'
  );
  if (criticalBugs.length > 0) {
    suggestions.push({
      id: 'suggestion-5',
      type: 'warning',
      title: `${criticalBugs.length} bug(s) crítico(s) aberto(s)`,
      message:
        'Bugs críticos devem ser corrigidos com prioridade. Revise e corrija esses bugs urgentemente.',
      priority: 'high',
    });
  }

  // Sugestão: Tarefas concluídas sem testes passando
  const doneTasksWithoutPassingTests = tasks.filter(
    t =>
      t.status === 'Done' &&
      t.testCases &&
      t.testCases.length > 0 &&
      !t.testCases.some(tc => tc.status === 'Passed')
  );
  if (doneTasksWithoutPassingTests.length > 0) {
    suggestions.push({
      id: 'suggestion-6',
      type: 'warning',
      title: `${doneTasksWithoutPassingTests.length} tarefa(s) concluída(s) sem testes passando`,
      message:
        'Tarefas concluídas devem ter pelo menos alguns testes passando. Revise essas tarefas.',
      priority: 'medium',
    });
  }

  // Sugestão: Projeto sem documentos
  if (project.documents.length === 0) {
    suggestions.push({
      id: 'suggestion-7',
      type: 'tip',
      title: 'Adicione documentos ao projeto',
      message:
        'Documentos como requisitos, especificações e diagramas ajudam a entender melhor o projeto.',
      priority: 'low',
    });
  }

  // Ordenar por prioridade (high primeiro)
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};
