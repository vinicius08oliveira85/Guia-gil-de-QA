import { JiraTask, TestCase } from '../types';

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

/**
 * Calcula o status da fase de testes baseado nos testCases
 * Retorna 'Concluído' se todos os testes foram executados (nenhum 'Not Run')
 * Retorna 'Pendente' se há testes pendentes ou se não há testes
 * 
 * @param testCases - Array de casos de teste
 * @returns 'Concluído' ou 'Pendente'
 */
export const getTestPhaseStatus = (testCases: TestCase[] | undefined): 'Concluído' | 'Pendente' => {
    if (!testCases || testCases.length === 0) {
        return 'Pendente';
    }
    const allTestsRun = testCases.every(tc => tc.status !== 'Not Run');
    return allTestsRun ? 'Concluído' : 'Pendente';
};

