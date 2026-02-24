import { JiraTask } from '../types';

/**
 * Categorias de status do Jira para agrupamento e análise
 */
export type JiraStatusCategory =
  | 'Concluído'
  | 'Validado'
  | 'Em Andamento'
  | 'Pendente'
  | 'Bloqueado'
  | 'Outros';

/**
 * Categoriza um status do Jira em uma das categorias predefinidas
 *
 * @param jiraStatus - Nome do status do Jira (ex: "VALIDAÇÃO", "EM ANDAMENTO", "CONCLUÍDO")
 * @returns Categoria do status
 */
export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => {
  if (!jiraStatus) return 'Pendente';

  const status = jiraStatus.toLowerCase().trim();

  // Concluído: Status que indicam conclusão
  if (
    status.includes('done') ||
    status.includes('resolved') ||
    status.includes('closed') ||
    status.includes('concluído') ||
    status.includes('concluido') ||
    status.includes('finalizado') ||
    status.includes('finalized') ||
    status.includes('completo') ||
    status.includes('complete') ||
    status.includes('fechado') ||
    status.includes('encerrado')
  ) {
    return 'Concluído';
  }

  // Validado: Status que indicam que foi entregue pelo Dev para testes
  if (
    status.includes('validação') ||
    status.includes('validacao') ||
    status.includes('validado') ||
    status.includes('validation') ||
    status.includes('pronto para teste') ||
    status.includes('pronto para testar') ||
    status.includes('aguardando teste') ||
    status.includes('em teste') ||
    status.includes('teste') ||
    status.includes('qa') ||
    status.includes('qualidade')
  ) {
    return 'Validado';
  }

  // Em Andamento: Status que indicam trabalho em progresso
  if (
    status.includes('progress') ||
    status.includes('andamento') ||
    status.includes('em desenvolvimento') ||
    status.includes('development') ||
    status.includes('desenvolvendo') ||
    status.includes('trabalhando') ||
    status.includes('working') ||
    status.includes('em execução') ||
    status.includes('executando')
  ) {
    return 'Em Andamento';
  }

  // Bloqueado: Status que indicam bloqueio
  if (
    status.includes('blocked') ||
    status.includes('bloqueado') ||
    status.includes('bloqueio') ||
    status.includes('impedido') ||
    status.includes('impedimento')
  ) {
    return 'Bloqueado';
  }

  // Pendente: Status que indicam pendência
  if (
    status.includes('todo') ||
    status.includes('backlog') ||
    status.includes('pendente') ||
    status.includes('pending') ||
    status.includes('aguardando') ||
    status.includes('waiting') ||
    status.includes('a fazer') ||
    status.includes('para fazer')
  ) {
    return 'Pendente';
  }

  // Outros: Status não categorizados
  return 'Outros';
};

/**
 * Obtém a categoria de uma tarefa baseado no seu jiraStatus
 *
 * @param task - Tarefa do Jira
 * @returns Categoria do status da tarefa
 */
export const getTaskStatusCategory = (task: JiraTask): JiraStatusCategory => {
  return categorizeJiraStatus(task.jiraStatus);
};

/**
 * Agrupa tarefas por categoria de status
 *
 * @param tasks - Array de tarefas
 * @returns Map com tarefas agrupadas por categoria
 */
export const groupTasksByStatusCategory = (
  tasks: JiraTask[]
): Map<JiraStatusCategory, JiraTask[]> => {
  const grouped = new Map<JiraStatusCategory, JiraTask[]>();

  // Inicializar todas as categorias
  const categories: JiraStatusCategory[] = [
    'Concluído',
    'Validado',
    'Em Andamento',
    'Pendente',
    'Bloqueado',
    'Outros',
  ];
  categories.forEach(cat => grouped.set(cat, []));

  tasks.forEach(task => {
    const category = getTaskStatusCategory(task);
    const current = grouped.get(category) || [];
    grouped.set(category, [...current, task]);
  });

  return grouped;
};

/**
 * Conta tarefas por categoria de status
 *
 * @param tasks - Array de tarefas
 * @returns Objeto com contagem por categoria
 */
export const countTasksByStatusCategory = (
  tasks: JiraTask[]
): Record<JiraStatusCategory, number> => {
  const counts: Record<JiraStatusCategory, number> = {
    Concluído: 0,
    Validado: 0,
    'Em Andamento': 0,
    Pendente: 0,
    Bloqueado: 0,
    Outros: 0,
  };

  tasks.forEach(task => {
    const category = getTaskStatusCategory(task);
    counts[category]++;
  });

  return counts;
};

/**
 * Distribui tarefas por status do Jira (não categorizado)
 *
 * @param tasks - Array de tarefas
 * @returns Map com tarefas agrupadas por status do Jira
 */
export const groupTasksByJiraStatus = (tasks: JiraTask[]): Map<string, JiraTask[]> => {
  const grouped = new Map<string, JiraTask[]>();

  tasks.forEach(task => {
    const status = task.jiraStatus || task.status || 'Sem Status';
    const current = grouped.get(status) || [];
    grouped.set(status, [...current, task]);
  });

  return grouped;
};

/**
 * Conta tarefas por status do Jira
 *
 * @param tasks - Array de tarefas
 * @returns Objeto com contagem por status do Jira
 */
export const countTasksByJiraStatus = (tasks: JiraTask[]): Record<string, number> => {
  const counts: Record<string, number> = {};

  tasks.forEach(task => {
    const status = task.jiraStatus || task.status || 'Sem Status';
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
};
