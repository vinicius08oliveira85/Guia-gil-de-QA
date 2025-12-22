import { JiraTask } from '../types';

/**
 * Retorna o status de exibição da tarefa.
 * Sempre retorna o nome exato do Jira (jiraStatus) quando disponível,
 * caso contrário retorna o status mapeado interno.
 * 
 * @param task - Tarefa do Jira
 * @returns Nome do status para exibição (sempre o nome do Jira quando disponível)
 */
export const getDisplayStatus = (task: JiraTask): string => {
    return task.jiraStatus || task.status;
};

