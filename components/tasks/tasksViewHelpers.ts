import { Project, JiraTask, TaskTestStatus } from '../../types';
import { getDisplayStatus } from '../../utils/taskHelpers';
import { calculateTaskTestStatus } from '../../services/taskTestStatusService';

export const TASK_ID_REGEX = /^([A-Z]+)-(\d+)/i;

/** Monta texto de contexto dos anexos da tarefa para enriquecer prompts de IA. */
export function buildAttachmentsContextForTask(task: JiraTask): string {
    const names: string[] = [];
    (task.attachments || []).forEach((a) => names.push(a.name));
    (task.jiraAttachments || []).forEach((a) => names.push(a.filename));
    if (names.length === 0) return '';
    return `A tarefa possui os seguintes anexos (podem conter requisitos, especificações ou evidências relevantes): ${names.join(', ')}.`;
}

export const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => {
    if (!jiraStatus) return 'To Do';
    const status = jiraStatus.toLowerCase();
    if (status.includes('done') || status.includes('resolved') || status.includes('closed') ||
        status.includes('concluído') || status.includes('concluido') || status.includes('finalizado') ||
        status.includes('resolvido') || status.includes('fechado')) return 'Done';
    if (status.includes('progress') || status.includes('in progress') ||
        status.includes('em andamento') || status.includes('andamento') ||
        status.includes('em desenvolvimento') || status.includes('desenvolvimento')) return 'In Progress';
    return 'To Do';
};

export const getStatusFilterOptions = (project: Project): string[] => {
    const jiraStatuses = project?.settings?.jiraStatuses;
    if (jiraStatuses && jiraStatuses.length > 0) return jiraStatuses.map(s => typeof s === 'string' ? s : s.name);
    return ['A Fazer', 'Em Andamento', 'Concluído'];
};

export const PT_STATUS_TO_CATEGORY: Record<string, 'To Do' | 'In Progress' | 'Done'> = {
    'A Fazer': 'To Do',
    'Em Andamento': 'In Progress',
    'Concluído': 'Done',
};

export const taskMatchesStatusName = (task: JiraTask, statusName: string, project: Project): boolean => {
    const display = getDisplayStatus(task);
    if (display === statusName) return true;
    const jiraStatuses = project?.settings?.jiraStatuses;
    if (jiraStatuses && jiraStatuses.length > 0) {
        const category = mapJiraStatusToTaskStatus(statusName);
        return !task.jiraStatus && task.status === category;
    }
    const category = PT_STATUS_TO_CATEGORY[statusName];
    return category !== undefined && task.status === category;
};

export const mapJiraPriorityToTaskPriority = (jiraPriority: string | undefined | null): 'Baixa' | 'Média' | 'Alta' | 'Urgente' => {
    if (!jiraPriority) return 'Média';
    const p = jiraPriority.toLowerCase();
    if (p.includes('highest') || p.includes('urgent')) return 'Urgente';
    if (p.includes('high')) return 'Alta';
    if (p.includes('low') || p.includes('lowest')) return 'Baixa';
    return 'Média';
};

export const getPriorityFilterOptions = (project: Project): string[] => {
    const jiraPriorities = project?.settings?.jiraPriorities;
    if (jiraPriorities && jiraPriorities.length > 0) return jiraPriorities.map(p => typeof p === 'string' ? p : p.name);
    return ['Baixa', 'Média', 'Alta', 'Urgente'];
};

export const taskMatchesPriorityName = (task: JiraTask, priorityName: string, project: Project): boolean => {
    if (task.jiraPriority === priorityName) return true;
    const jiraPriorities = project?.settings?.jiraPriorities;
    if (jiraPriorities && jiraPriorities.length > 0) {
        const category = mapJiraPriorityToTaskPriority(priorityName);
        return !task.jiraPriority && (task.priority || 'Média') === category;
    }
    return (task.priority || 'Sem Prioridade') === priorityName;
};

export const getEffectiveTestStatus = (task: JiraTask, allTasks: JiraTask[]): TaskTestStatus => {
    return task.testStatus ?? calculateTaskTestStatus(task, allTasks);
};

export const TEST_STATUS_FILTER_OPTIONS: { value: TaskTestStatus; label: string }[] = [
    { value: 'testar', label: 'Testar' },
    { value: 'testando', label: 'Testando' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'teste_concluido', label: 'Teste Concluído' },
];

export const parseTaskId = (taskId: string) => {
    if (!taskId) return { prefix: '', number: Number.MAX_SAFE_INTEGER };
    const match = taskId.match(TASK_ID_REGEX);
    if (match) return { prefix: match[1].toUpperCase(), number: parseInt(match[2], 10) };
    return { prefix: taskId.toUpperCase(), number: Number.MAX_SAFE_INTEGER };
};

export const compareTasksById = (a: JiraTask, b: JiraTask) => {
    const parsedA = parseTaskId(a.id);
    const parsedB = parseTaskId(b.id);
    if (parsedA.prefix !== parsedB.prefix) return parsedA.prefix.localeCompare(parsedB.prefix);
    if (parsedA.number !== parsedB.number) return parsedA.number - parsedB.number;
    return a.title.localeCompare(b.title);
};

export type TaskSortBy = 'id' | 'status' | 'priority' | 'createdAt' | 'title';
export type TaskGroupBy = 'none' | 'status' | 'priority' | 'type';

export const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'Blocked': 1, 'In Progress': 2, 'Done': 3 };
export const PRIORITY_ORDER: Record<string, number> = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };

export function getTaskComparator(sortBy: TaskSortBy): (a: JiraTask, b: JiraTask) => number {
    return (a, b) => {
        switch (sortBy) {
            case 'id': return compareTasksById(a, b);
            case 'status': {
                const orderA = STATUS_ORDER[a.status] ?? 99;
                const orderB = STATUS_ORDER[b.status] ?? 99;
                if (orderA !== orderB) return orderA - orderB;
                return compareTasksById(a, b);
            }
            case 'priority': {
                const orderA = PRIORITY_ORDER[a.priority ?? ''] ?? 99;
                const orderB = PRIORITY_ORDER[b.priority ?? ''] ?? 99;
                if (orderA !== orderB) return orderA - orderB;
                return compareTasksById(a, b);
            }
            case 'createdAt': {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (dateB !== dateA) return dateB - dateA;
                return compareTasksById(a, b);
            }
            case 'title': {
                const cmp = (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
                if (cmp !== 0) return cmp;
                return compareTasksById(a, b);
            }
            default:
                return compareTasksById(a, b);
        }
    };
}
