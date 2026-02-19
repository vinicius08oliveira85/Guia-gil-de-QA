import { JiraTask, TestCase } from '../types';

/** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */
const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => {
    if (!jiraStatus) return 'To Do';
    const s = jiraStatus.toLowerCase();
    if (s.includes('done') || s.includes('resolved') || s.includes('closed') ||
        s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') ||
        s.includes('resolvido') || s.includes('fechado')) return 'Done';
    if (s.includes('progress') || s.includes('in progress') ||
        s.includes('em andamento') || s.includes('andamento') ||
        s.includes('em desenvolvimento') || s.includes('desenvolvimento')) return 'In Progress';
    return 'To Do';
};

const STATUS_TO_PT: Record<string, string> = {
    'To Do': 'A Fazer',
    'In Progress': 'Em Andamento',
    'Done': 'Concluído',
};

type ProjectWithJiraStatuses = { settings?: { jiraStatuses?: Array<{ name: string; color?: string } | string> } } | null | undefined;

type ProjectWithJiraPriorities = { settings?: { jiraPriorities?: Array<{ name: string } | string> } } | null | undefined;

/** Mapeia nome de prioridade do Jira para TaskPriority. Mesma lógica do jiraService. */
const mapJiraPriorityToTaskPriority = (jiraPriority: string | undefined | null): 'Baixa' | 'Média' | 'Alta' | 'Urgente' => {
    if (!jiraPriority) return 'Média';
    const p = jiraPriority.toLowerCase();
    if (p.includes('highest') || p.includes('urgent')) return 'Urgente';
    if (p.includes('high')) return 'Alta';
    if (p.includes('low') || p.includes('lowest')) return 'Baixa';
    return 'Média';
};

const PRIORITY_TO_PT: Record<string, string> = {
    'Urgente': 'Urgente',
    'Alta': 'Alta',
    'Média': 'Média',
    'Baixa': 'Baixa',
};

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
 * Retorna o rótulo de status para exibição na UI: nome do Jira quando disponível,
 * senão primeiro status do projeto que corresponda à categoria, ou rótulo em português (A Fazer / Em Andamento / Concluído).
 *
 * @param task - Tarefa do Jira
 * @param project - Projeto (opcional), para usar jiraStatuses
 */
export const getDisplayStatusLabel = (task: JiraTask, project?: ProjectWithJiraStatuses): string => {
    if (task.jiraStatus) return task.jiraStatus;
    const internal = task.status;
    const jiraStatuses = project?.settings?.jiraStatuses;
    if (jiraStatuses?.length) {
        const first = jiraStatuses.find(s => {
            const name = typeof s === 'string' ? s : s.name;
            return mapJiraStatusToTaskStatus(name) === internal;
        });
        if (first) return typeof first === 'string' ? first : first.name;
    }
    return STATUS_TO_PT[internal] ?? internal;
};

/**
 * Retorna o rótulo de prioridade para exibição na UI: nome do Jira (jiraPriority) quando disponível,
 * senão primeiro nome em project.settings.jiraPriorities que corresponda à categoria da tarefa,
 * ou rótulo em português (Urgente, Alta, Média, Baixa).
 *
 * @param task - Tarefa do Jira
 * @param project - Projeto (opcional), para usar jiraPriorities
 */
export const getDisplayPriorityLabel = (task: JiraTask, project?: ProjectWithJiraPriorities): string => {
    if (task.jiraPriority) return task.jiraPriority;
    const internal = task.priority || 'Média';
    const jiraPriorities = project?.settings?.jiraPriorities;
    if (jiraPriorities?.length) {
        const first = jiraPriorities.find(s => {
            const name = typeof s === 'string' ? s : s.name;
            return mapJiraPriorityToTaskPriority(name) === internal;
        });
        if (first) return typeof first === 'string' ? first : first.name;
    }
    return PRIORITY_TO_PT[internal] ?? internal;
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

