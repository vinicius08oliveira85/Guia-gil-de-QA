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
 * Calcula o status da fase de testes baseado nos testCases ou nas subtarefas (para Epic/História)
 * 
 * Para Epic/História:
 * - Retorna 'Concluído' se todas as subtarefas retornam 'Concluído'
 * - Retorna 'Pendente' se não há subtarefas ou se alguma subtarefa retorna 'Pendente'
 * 
 * Para Tarefa/Bug:
 * - Retorna 'Concluído' se todos os testes foram executados (nenhum 'Not Run')
 * - Retorna 'Pendente' se há testes pendentes ou se não há testes
 * 
 * @param task - Tarefa para calcular o status
 * @param allTasks - Lista completa de tarefas do projeto (necessária para encontrar subtarefas de Epic/História)
 * @returns 'Concluído' ou 'Pendente'
 */
export const getTestPhaseStatus = (task: JiraTask, allTasks: JiraTask[] = []): 'Concluído' | 'Pendente' => {
    // Para Epic e História, verificar status das subtarefas
    if (task.type === 'Epic' || task.type === 'História') {
        const subtasks = allTasks.filter(t => t.parentId === task.id);
        
        // Se não há subtarefas, retornar 'Pendente' (conforme requisito)
        if (subtasks.length === 0) {
            return 'Pendente';
        }
        
        // Verificar se todas as subtarefas retornam 'Concluído' recursivamente
        const allSubtasksCompleted = subtasks.every(subtask => 
            getTestPhaseStatus(subtask, allTasks) === 'Concluído'
        );
        
        return allSubtasksCompleted ? 'Concluído' : 'Pendente';
    }
    
    // Para Tarefa e Bug, usar lógica baseada em testCases
    const testCases = task.testCases || [];
    
    if (!testCases || testCases.length === 0) {
        return 'Pendente';
    }
    
    const allTestsRun = testCases.every(tc => tc.status !== 'Not Run');
    return allTestsRun ? 'Concluído' : 'Pendente';
};

