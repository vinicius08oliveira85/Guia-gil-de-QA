import { Project, JiraTask, PhaseName } from '../types';

export interface JiraConfig {
    url: string;
    email: string;
    apiToken: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    fields: {
        summary: string;
        description?: string;
        issuetype: {
            name: string;
        };
        status: {
            name: string;
        };
        priority?: {
            name: string;
        };
        assignee?: {
            displayName: string;
            emailAddress: string;
        };
        reporter?: {
            displayName: string;
        };
        created: string;
        updated: string;
        resolutiondate?: string;
        labels?: string[];
        parent?: {
            key: string;
        };
        subtasks?: Array<{ key: string }>;
    };
    renderedFields?: {
        comment?: {
            comments: Array<{
                id: string;
                author: {
                    displayName: string;
                    emailAddress: string;
                };
                body: string;
                created: string;
                updated?: string;
            }>;
        };
    };
}

export interface JiraProject {
    id: string;
    key: string;
    name: string;
    description?: string;
}

const JIRA_CONFIG_KEY = 'jira_config';

export const saveJiraConfig = (config: JiraConfig): void => {
    localStorage.setItem(JIRA_CONFIG_KEY, JSON.stringify(config));
};

export const getJiraConfig = (): JiraConfig | null => {
    const stored = localStorage.getItem(JIRA_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const deleteJiraConfig = (): void => {
    localStorage.removeItem(JIRA_CONFIG_KEY);
};

const getAuthHeader = (config: JiraConfig): string => {
    const credentials = btoa(`${config.email}:${config.apiToken}`);
    return `Basic ${credentials}`;
};

const jiraApiCall = async <T>(
    config: JiraConfig,
    endpoint: string,
    options: { method?: string; body?: any; timeout?: number } = {}
): Promise<T> => {
    const timeout = options.timeout || 30000; // 30 segundos por padrão
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const requestBody = {
            url: config.url,
            email: config.email,
            apiToken: config.apiToken,
            endpoint,
            method: options.method || 'GET',
            body: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
        };
        
        console.log('Fazendo requisição ao proxy Jira:', { endpoint, method: requestBody.method });
        
        const response = await fetch('/api/jira-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('Resposta do proxy:', { status: response.status, ok: response.ok });

        if (!response.ok) {
            let errorData: { error?: string };
            try {
                errorData = await response.json();
                console.error('Erro do proxy:', errorData);
            } catch {
                const errorText = await response.text();
                console.error('Erro do proxy (texto):', errorText);
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || `Jira API Error (${response.status})`);
        }

        const data = await response.json();
        console.log('Dados recebidos do proxy:', data);
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('Timeout na requisição');
            throw new Error(`Timeout: A requisição demorou mais de ${timeout / 1000} segundos. Verifique sua conexão ou tente novamente.`);
        }
        console.error('Erro na requisição:', error);
        throw error;
    }
};

export const testJiraConnection = async (config: JiraConfig): Promise<boolean> => {
    try {
        // Usar endpoint /myself que ainda está disponível
        await jiraApiCall(config, 'myself');
        return true;
    } catch (error) {
        console.error('Jira connection test failed:', error);
        return false;
    }
};

export const getJiraProjects = async (config: JiraConfig): Promise<JiraProject[]> => {
    console.log('Buscando projetos do Jira...', { url: config.url, endpoint: 'project?maxResults=100' });
    
    try {
        const response = await jiraApiCall<{ values?: JiraProject[] }>(
            config, 
            'project?maxResults=100',
            { timeout: 20000 } // 20 segundos para listar projetos
        );
        
        console.log('Resposta do Jira:', response);
        
        if (!response) {
            console.error('Resposta vazia do Jira');
            throw new Error('Resposta vazia do servidor Jira');
        }
        
        if (Array.isArray(response.values)) {
            console.log(`Encontrados ${response.values.length} projetos`);
            return response.values;
        }
        
        // Tentar outras estruturas de resposta possíveis
        if (Array.isArray(response)) {
            console.log(`Encontrados ${response.length} projetos (formato alternativo)`);
            return response;
        }
        
        console.warn('Formato de resposta inesperado:', response);
        return [];
    } catch (error) {
        console.error('Erro em getJiraProjects:', error);
        throw error;
    }
};

export const getJiraIssues = async (
    config: JiraConfig,
    projectKey: string,
    maxResults: number = 100
): Promise<JiraIssue[]> => {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    // Usar a nova API /rest/api/3/search/jql conforme recomendado pelo Jira
    const response = await jiraApiCall<{ issues: JiraIssue[] }>(
        config,
        `search/jql?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&expand=renderedFields&fields=summary,description,issuetype,status,priority,assignee,reporter,created,updated,resolutiondate,labels,parent,subtasks`
    );
    return response.issues || [];
};

const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => {
    if (!jiraStatus) return 'To Do';
    const status = jiraStatus.toLowerCase();
    if (status.includes('done') || status.includes('resolved') || status.includes('closed')) {
        return 'Done';
    }
    if (status.includes('progress') || status.includes('in progress')) {
        return 'In Progress';
    }
    return 'To Do';
};

const mapJiraTypeToTaskType = (jiraType: string | undefined | null): 'Epic' | 'História' | 'Tarefa' | 'Bug' => {
    if (!jiraType) return 'Tarefa';
    const type = jiraType.toLowerCase();
    if (type.includes('epic')) return 'Epic';
    if (type.includes('story') || type.includes('história')) return 'História';
    if (type.includes('bug') || type.includes('defect')) return 'Bug';
    return 'Tarefa';
};

const mapJiraPriorityToTaskPriority = (jiraPriority?: string): 'Baixa' | 'Média' | 'Alta' | 'Urgente' => {
    if (!jiraPriority) return 'Média';
    const priority = jiraPriority.toLowerCase();
    if (priority.includes('highest') || priority.includes('urgent')) return 'Urgente';
    if (priority.includes('high')) return 'Alta';
    if (priority.includes('low') || priority.includes('lowest')) return 'Baixa';
    return 'Média';
};

const mapJiraSeverity = (labels?: string[]): 'Crítico' | 'Alto' | 'Médio' | 'Baixo' => {
    if (!labels || !Array.isArray(labels)) return 'Médio';
    const severityLabels = labels.filter(l => 
        l && typeof l === 'string' && (
            l.toLowerCase().includes('severity') || 
            l.toLowerCase().includes('severidade') ||
            l.toLowerCase().includes('critical') ||
            l.toLowerCase().includes('high') ||
            l.toLowerCase().includes('medium') ||
            l.toLowerCase().includes('low')
        )
    );
    
    if (severityLabels.length === 0) return 'Médio';
    
    const severity = severityLabels[0]?.toLowerCase() || '';
    if (severity.includes('critical') || severity.includes('crítico')) return 'Crítico';
    if (severity.includes('high') || severity.includes('alto')) return 'Alto';
    if (severity.includes('low') || severity.includes('baixo')) return 'Baixo';
    return 'Médio';
};

export const importJiraProject = async (
    config: JiraConfig,
    jiraProjectKey: string
): Promise<Project> => {
    // Buscar projeto do Jira
    const jiraProjects = await getJiraProjects(config);
    const jiraProject = jiraProjects.find(p => p.key === jiraProjectKey);
    
    if (!jiraProject) {
        throw new Error(`Projeto ${jiraProjectKey} não encontrado no Jira`);
    }

    // Buscar issues do projeto
    const jiraIssues = await getJiraIssues(config, jiraProjectKey, 500);

    // Mapear issues para tarefas
    const tasks: JiraTask[] = jiraIssues.map(issue => {
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';
        
        const task: JiraTask = {
            id: issue.key || `jira-${Date.now()}-${Math.random()}`,
            title: issue.fields?.summary || 'Sem título',
            description: issue.fields?.description || '',
            status: mapJiraStatusToTaskStatus(issue.fields?.status?.name),
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate,
            tags: issue.fields?.labels || [],
            testCases: [],
            bddScenarios: [],
            comments: issue.renderedFields?.comment?.comments?.map(comment => ({
                id: comment.id,
                author: comment.author?.displayName || 'Desconhecido',
                content: comment.body || '',
                createdAt: comment.created,
                updatedAt: comment.updated,
            })) || [],
        };

        if (isBug) {
            task.severity = mapJiraSeverity(issue.fields.labels);
        }

        if (issue.fields.parent) {
            task.parentId = issue.fields.parent.key;
        }

        // Mapear assignee
        if (issue.fields.assignee) {
            const email = issue.fields.assignee.emailAddress.toLowerCase();
            if (email.includes('qa') || email.includes('test')) {
                task.assignee = 'QA';
            } else if (email.includes('dev') || email.includes('developer')) {
                task.assignee = 'Dev';
            } else {
                task.assignee = 'Product';
            }
        }

        // Mapear attachments (se disponíveis na API)
        // Nota: Attachments precisam ser buscados separadamente ou estar no expand
        // Por enquanto, deixamos vazio pois requer configuração adicional da API

        return task;
    });

    // Organizar hierarquia (Epics e subtarefas)
    const epics = tasks.filter(t => t.type === 'Epic');
    const tasksWithChildren = tasks.map(task => {
        if (task.type === 'Epic') {
            const children = tasks.filter(t => t.parentId === task.id);
            return { ...task, children };
        }
        return task;
    });

    // Criar projeto local
    const project: Project = {
        id: `jira-${jiraProject.id}-${Date.now()}`,
        name: jiraProject.name,
        description: jiraProject.description || `Projeto importado do Jira: ${jiraProjectKey}`,
        documents: [],
        tasks: tasks,
        phases: [],
        tags: [],
    };

    return project;
};

export const syncJiraProject = async (
    config: JiraConfig,
    project: Project,
    jiraProjectKey: string
): Promise<Project> => {
    // Buscar issues atualizadas desde a última sincronização
    const jiraIssues = await getJiraIssues(config, jiraProjectKey, 500);
    
    // Atualizar tarefas existentes e adicionar novas
    const existingTaskKeys = new Set(project.tasks.map(t => t.id));
    const updatedTasks = [...project.tasks];

    jiraIssues.forEach(issue => {
        const existingIndex = updatedTasks.findIndex(t => t.id === issue.key);
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';

        const task: JiraTask = {
            id: issue.key || `jira-${Date.now()}-${Math.random()}`,
            title: issue.fields?.summary || 'Sem título',
            description: issue.fields?.description || '',
            status: mapJiraStatusToTaskStatus(issue.fields?.status?.name),
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate,
            tags: issue.fields?.labels || [],
            testCases: existingIndex >= 0 ? updatedTasks[existingIndex].testCases : [],
            bddScenarios: existingIndex >= 0 ? updatedTasks[existingIndex].bddScenarios : [],
            comments: issue.renderedFields?.comment?.comments?.map(comment => ({
                id: comment.id,
                author: comment.author?.displayName || 'Desconhecido',
                content: comment.body || '',
                createdAt: comment.created,
                updatedAt: comment.updated,
            })) || [],
        };

        if (isBug) {
            task.severity = mapJiraSeverity(issue.fields.labels);
        }

        if (issue.fields?.parent?.key) {
            task.parentId = issue.fields.parent.key;
        }

        // Mapear assignee
        if (issue.fields?.assignee?.emailAddress) {
            const email = issue.fields.assignee.emailAddress.toLowerCase();
            if (email.includes('qa') || email.includes('test')) {
                task.assignee = 'QA';
            } else if (email.includes('dev') || email.includes('developer')) {
                task.assignee = 'Dev';
            } else {
                task.assignee = 'Product';
            }
        } else {
            task.assignee = existingIndex >= 0 ? updatedTasks[existingIndex].assignee : 'Product';
        }

        if (existingIndex >= 0) {
            updatedTasks[existingIndex] = task;
        } else {
            updatedTasks.push(task);
        }
    });

    return {
        ...project,
        tasks: updatedTasks,
    };
};

