import { Project, JiraTask, PhaseName, Comment } from '../types';
import { parseJiraDescription } from '../utils/jiraDescriptionParser';
import { getCache, setCache, clearCache } from '../utils/apiCache';
import { getJiraStatusColor } from '../utils/jiraStatusColors';

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
            statusCategory?: {
                key: string;
                colorName: string;
            };
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
            emailAddress?: string;
        };
        created: string;
        updated: string;
        resolutiondate?: string;
        labels?: string[];
        parent?: {
            key: string;
        };
        subtasks?: Array<{ key: string }>;
        comment?: {
            comments: Array<{
                id: string;
                author: {
                    displayName: string;
                    emailAddress?: string;
                };
                body: string;
                created: string;
                updated?: string;
            }>;
        };
        // Campos adicionais padrão
        duedate?: string;
        timetracking?: {
            originalEstimate?: string;
            remainingEstimate?: string;
            timeSpent?: string;
        };
        components?: Array<{
            id: string;
            name: string;
        }>;
        fixVersions?: Array<{
            id: string;
            name: string;
        }>;
        environment?: string;
        watches?: {
            watchCount: number;
            isWatching: boolean;
        };
        issuelinks?: Array<{
            id: string;
            type: {
                name: string;
            };
            outwardIssue?: {
                key: string;
            };
            inwardIssue?: {
                key: string;
            };
        }>;
        attachment?: Array<{
            id: string;
            filename: string;
            size: number;
            created: string;
            author: {
                displayName: string;
            };
        }>;
        // Suporte a campos customizados
        [key: string]: any;
    };
    renderedFields?: {
        description?: string; // Descrição renderizada em HTML
        comment?: {
            comments: Array<{
                id: string;
                author: {
                    displayName: string;
                    emailAddress?: string;
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
    const timeout = options.timeout || 60000; // 60 segundos por padrão (aumentado para projetos grandes)
    
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

export const getJiraProjects = async (config: JiraConfig, useCache: boolean = true): Promise<JiraProject[]> => {
    const cacheKey = `jira_projects_${config.url}`;
    
    // Tentar cache primeiro
    if (useCache) {
        const cached = getCache<JiraProject[]>(cacheKey);
        if (cached) {
            console.log('✅ Usando projetos do cache');
            return cached;
        }
    }
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
        
        let projects: JiraProject[] = [];
        
        if (Array.isArray(response.values)) {
            console.log(`Encontrados ${response.values.length} projetos`);
            projects = response.values;
        } else if (Array.isArray(response)) {
            console.log(`Encontrados ${response.length} projetos (formato alternativo)`);
            projects = response;
        } else {
            console.warn('Formato de resposta inesperado:', response);
            projects = [];
        }
        
        // Salvar no cache (5 minutos)
        if (projects && projects.length > 0) {
            setCache(cacheKey, projects, 5 * 60 * 1000);
        }
        
        return projects;
    } catch (error) {
        console.error('Erro em getJiraProjects:', error);
        // Limpar cache em caso de erro
        clearCache(cacheKey);
        throw error;
    }
};

export const getJiraStatuses = async (config: JiraConfig, projectKey: string): Promise<Array<{ name: string; color: string }>> => {
    const cacheKey = `jira_statuses_${config.url}_${projectKey}`;
    
    // Tentar cache primeiro
    const cached = getCache<Array<{ name: string; color: string }>>(cacheKey);
    if (cached) {
        console.log('✅ Usando status do Jira do cache');
        return cached;
    }

    try {
        // Buscar status do projeto via API
        const response = await jiraApiCall<Array<{
            id: string;
            name: string;
            statuses: Array<{ 
                id: string; 
                name: string;
                statusCategory?: {
                    key: string;
                    colorName: string;
                };
            }>;
        }>>(
            config,
            `project/${projectKey}/statuses`,
            { timeout: 20000 }
        );

        // Extrair todos os status únicos com suas cores
        const statusMap = new Map<string, string>();
        if (Array.isArray(response)) {
            response.forEach(statusCategory => {
                if (statusCategory.statuses && Array.isArray(statusCategory.statuses)) {
                    statusCategory.statuses.forEach(status => {
                        if (status.name) {
                            const color = getJiraStatusColor(status.name, status.statusCategory);
                            statusMap.set(status.name, color);
                        }
                    });
                }
            });
        }

        const statuses = Array.from(statusMap.entries()).map(([name, color]) => ({ name, color }));
        
        // Se não conseguir via API de status, extrair dos issues
        if (statuses.length === 0) {
            console.log('⚠️ Não foi possível buscar status via API, extraindo das issues...');
            const issues = await getJiraIssues(config, projectKey, 100); // Buscar apenas 100 para extrair status
            issues.forEach(issue => {
                if (issue.fields?.status?.name) {
                    const statusName = issue.fields.status.name;
                    if (!statusMap.has(statusName)) {
                        const color = getJiraStatusColor(statusName, issue.fields.status.statusCategory);
                        statusMap.set(statusName, color);
                    }
                }
            });
            return Array.from(statusMap.entries()).map(([name, color]) => ({ name, color }));
        }

        // Salvar no cache (10 minutos)
        if (statuses.length > 0) {
            setCache(cacheKey, statuses, 10 * 60 * 1000);
        }

        return statuses;
    } catch (error) {
        console.error('Erro ao buscar status do Jira:', error);
        // Fallback: extrair dos issues
        try {
            const issues = await getJiraIssues(config, projectKey, 100);
            const statusMap = new Map<string, string>();
            issues.forEach(issue => {
                if (issue.fields?.status?.name) {
                    const statusName = issue.fields.status.name;
                    if (!statusMap.has(statusName)) {
                        const color = getJiraStatusColor(statusName, issue.fields.status.statusCategory);
                        statusMap.set(statusName, color);
                    }
                }
            });
            return Array.from(statusMap.entries()).map(([name, color]) => ({ name, color }));
        } catch (fallbackError) {
            console.error('Erro no fallback de status:', fallbackError);
            return [];
        }
    }
};

export const getJiraIssues = async (
    config: JiraConfig,
    projectKey: string,
    maxResults?: number, // Opcional: se não especificado, busca TODAS as issues
    onProgress?: (current: number, total?: number) => void
): Promise<JiraIssue[]> => {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const pageSize = 100; // Jira limita a 100 por página
    const CONCURRENT_REQUESTS = 4;
    const allIssues: JiraIssue[] = [];
    let totalGoal = maxResults;

    const pushIssues = (issues: JiraIssue[], totalHint?: number) => {
        if (!issues.length) {
            return;
        }

        if (!totalGoal && (totalHint || maxResults)) {
            totalGoal = maxResults ?? totalHint;
        }

        let itemsToAdd = issues;
        if (maxResults !== undefined) {
            const remainingSlots = maxResults - allIssues.length;
            if (remainingSlots <= 0) {
                return;
            }
            itemsToAdd = issues.slice(0, remainingSlots);
        }

        allIssues.push(...itemsToAdd);
        onProgress?.(allIssues.length, totalGoal);
    };

    type JiraSearchResponse = {
        issues?: JiraIssue[];
        total?: number;
        startAt?: number;
        maxResults?: number;
        nextPageToken?: string;
        isLast?: boolean;
    };

    const buildSearchEndpoint = (params: Record<string, string | number | undefined>) => {
        const search = new URLSearchParams();
        search.set('jql', jql);
        search.set('maxResults', String(pageSize));
        search.set('expand', 'renderedFields,comment,attachment');
        // Buscar todos os campos usando *all ou removendo o parâmetro fields
        // Usando *all para buscar todos os campos padrão e customizados
        search.set('fields', '*all');
        if (typeof params.startAt === 'number') {
            search.set('startAt', String(params.startAt));
        }
        if (typeof params.nextPageToken === 'string') {
            search.set('nextPageToken', params.nextPageToken);
        }
        return `search/jql?${search.toString()}`;
    };

    const fetchPage = async (params: { startAt?: number; nextPageToken?: string }, label?: string) => {
        const endpoint = buildSearchEndpoint(params);
        const response = await jiraApiCall<JiraSearchResponse>(
            config,
            endpoint,
            { timeout: 60000 }
        );
        if (label) {
            console.log(`📦 ${label}: Recebidas ${(response.issues || []).length} issues`);
        }
        return response;
    };

    console.log(`🔍 Buscando TODAS as issues do projeto ${projectKey}...`);
    const firstResponse = await fetchPage({ startAt: 0 }, 'Página 1');
    pushIssues(firstResponse.issues || [], firstResponse.total);

    if (maxResults !== undefined && allIssues.length >= maxResults) {
        return allIssues;
    }

    const supportsRandomAccess = typeof firstResponse.startAt === 'number' && typeof firstResponse.total === 'number';
    const hasTokens = typeof firstResponse.nextPageToken === 'string';

    const shouldContinue = () =>
        maxResults === undefined || allIssues.length < maxResults;

    if (hasTokens) {
        let nextToken = firstResponse.nextPageToken;
        let pageIndex = 2;
        while (nextToken && shouldContinue()) {
            const response = await fetchPage({ nextPageToken: nextToken }, `Página ${pageIndex}`);
            const issues = response.issues || [];
            if (issues.length === 0) {
                console.log('⚠️ Nenhuma issue retornada nesta página. Parando paginação.');
                break;
            }
            pushIssues(issues, response.total);
            nextToken = response.nextPageToken;
            pageIndex += 1;
        }
    } else if (supportsRandomAccess) {
        const totalAvailable = firstResponse.total || 0;
        const totalToFetch = maxResults !== undefined
            ? Math.min(maxResults, totalAvailable)
            : totalAvailable;
        const startIndices: number[] = [];
        for (
            let start = (firstResponse.startAt || 0) + (firstResponse.issues?.length || 0);
            start < totalToFetch;
            start += pageSize
        ) {
            startIndices.push(start);
        }

        outer:
        for (let i = 0; i < startIndices.length; i += CONCURRENT_REQUESTS) {
            const chunkStarts = startIndices.slice(i, i + CONCURRENT_REQUESTS);
            const responses = await Promise.all(
                chunkStarts.map((start) => fetchPage({ startAt: start }, `Página ${(start / pageSize) + 1}`))
            );
            for (const response of responses) {
                const issues = response.issues || [];
                pushIssues(issues, response.total);
                if (!shouldContinue()) {
                    break outer;
                }
            }
        }
    } else {
        let nextStartAt = (firstResponse.startAt || 0) + (firstResponse.issues?.length || 0);
        let pageIndex = 2;
        while (shouldContinue()) {
            const response = await fetchPage({ startAt: nextStartAt }, `Página ${pageIndex}`);
            const issues = response.issues || [];
            if (issues.length === 0) {
                console.log('⚠️ Nenhuma issue retornada nesta página. Parando paginação.');
                break;
            }
            pushIssues(issues, response.total);
            nextStartAt += issues.length;
            pageIndex += 1;

            if (issues.length < pageSize) {
                break;
            }

            if (maxResults === undefined && allIssues.length >= 50000) {
                console.warn(`⚠️ Limite de segurança de 50000 issues atingido para o projeto ${projectKey}.`);
                break;
            }
        }
    }

    // Contar por tipo (verificar o nome exato do tipo no Jira)
    const epics = allIssues.filter(i => {
        const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
        return typeName.includes('epic') || typeName === 'épico' || typeName === 'epico';
    }).length;
    
    const stories = allIssues.filter(i => {
        const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
        return typeName.includes('story') || typeName.includes('história') || typeName.includes('historia') || typeName === 'user story';
    }).length;
    
    const tasks = allIssues.filter(i => {
        const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
        return typeName.includes('task') || typeName.includes('tarefa') || (typeName !== 'epic' && typeName !== 'bug' && typeName !== 'story' && typeName !== 'história');
    }).length;
    
    const bugs = allIssues.filter(i => {
        const typeName = i.fields?.issuetype?.name?.toLowerCase() || '';
        return typeName.includes('bug') || typeName === 'erro' || typeName === 'defeito';
    }).length;
    
    const uniqueTypes = [...new Set(allIssues.map(i => i.fields?.issuetype?.name).filter(Boolean))];
    console.log(`   📋 Tipos encontrados no Jira:`, uniqueTypes.slice(0, 10));
    
    console.log(`✅ Total de issues buscadas: ${allIssues.length} para o projeto ${projectKey}`);
    console.log(`   📊 Breakdown: ${epics} Epics, ${stories} Histórias, ${tasks} Tarefas, ${bugs} Bugs`);
    
    return allIssues;
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

/**
 * Busca comentários de uma issue específica do Jira
 * Fallback caso os comentários não venham no expand
 */
const getJiraIssueComments = async (
    config: JiraConfig,
    issueKey: string
): Promise<Comment[]> => {
    try {
        const endpoint = `issue/${issueKey}/comment`;
        const response = await jiraApiCall<{
            comments?: Array<{
                id: string;
                author: {
                    displayName: string;
                    emailAddress?: string;
                };
                body: string;
                created: string;
                updated?: string;
            }>;
        }>(config, endpoint, { timeout: 30000 });
        
        if (!response.comments || response.comments.length === 0) {
            return [];
        }
        
        return response.comments.map(comment => ({
            id: comment.id,
            author: comment.author?.displayName || 'Desconhecido',
            content: parseJiraDescription(comment.body) || '',
            createdAt: comment.created,
            updatedAt: comment.updated,
            fromJira: true,
        }));
    } catch (error) {
        console.warn(`Erro ao buscar comentários da issue ${issueKey}:`, error);
        return [];
    }
};

/**
 * Faz merge de comentários do Jira com comentários existentes
 * Evita duplicatas e atualiza comentários existentes
 */
const mergeComments = (existingComments: Comment[], jiraComments: Comment[]): Comment[] => {
    const commentsMap = new Map<string, Comment>();
    
    // Adicionar comentários existentes primeiro
    existingComments.forEach(comment => {
        commentsMap.set(comment.id, comment);
    });
    
    // Atualizar ou adicionar comentários do Jira
    jiraComments.forEach(jiraComment => {
        const existing = commentsMap.get(jiraComment.id);
        if (existing) {
            // Se o comentário foi atualizado no Jira (updatedAt diferente), atualizar
            if (jiraComment.updatedAt && (!existing.updatedAt || jiraComment.updatedAt > existing.updatedAt)) {
                commentsMap.set(jiraComment.id, jiraComment);
            }
        } else {
            // Novo comentário do Jira
            commentsMap.set(jiraComment.id, jiraComment);
        }
    });
    
    // Ordenar por data de criação (mais antigos primeiro)
    return Array.from(commentsMap.values()).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
};

/**
 * Extrai comentários de uma issue do Jira, tentando múltiplas fontes
 */
const extractJiraComments = async (
    config: JiraConfig,
    issue: JiraIssue
): Promise<Comment[]> => {
    let jiraComments: Comment[] = [];
    
    // Tentar primeiro pelos renderedFields (mais eficiente)
    if (issue.renderedFields?.comment?.comments && issue.renderedFields.comment.comments.length > 0) {
        jiraComments = issue.renderedFields.comment.comments.map(comment => ({
            id: comment.id,
            author: comment.author?.displayName || 'Desconhecido',
            content: parseJiraDescription(comment.body) || '',
            createdAt: comment.created,
            updatedAt: comment.updated,
            fromJira: true,
        }));
    } else if (issue.fields?.comment?.comments && issue.fields.comment.comments.length > 0) {
        // Tentar pelos fields diretos
        jiraComments = issue.fields.comment.comments.map((comment: any) => ({
            id: comment.id,
            author: comment.author?.displayName || 'Desconhecido',
            content: parseJiraDescription(comment.body) || '',
            createdAt: comment.created,
            updatedAt: comment.updated,
            fromJira: true,
        }));
    } else {
        // Fallback: buscar comentários separadamente
        jiraComments = await getJiraIssueComments(config, issue.key);
    }
    
    return jiraComments;
};

export const importJiraProject = async (
    config: JiraConfig,
    jiraProjectKey: string,
    onProgress?: (current: number, total?: number) => void
): Promise<Project> => {
    // Buscar projeto do Jira
    const jiraProjects = await getJiraProjects(config);
    const jiraProject = jiraProjects.find(p => p.key === jiraProjectKey);
    
    if (!jiraProject) {
        throw new Error(`Projeto ${jiraProjectKey} não encontrado no Jira`);
    }

    // Buscar status do Jira
    const jiraStatuses = await getJiraStatuses(config, jiraProjectKey);

    // Buscar TODAS as issues do projeto (sem limite)
    const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress);

    // Mapear issues para tarefas
    const tasks: JiraTask[] = await Promise.all(jiraIssues.map(async (issue, index) => {
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';
        
        // Converter descrição do formato ADF para texto
        // Tentar também renderedFields.description se disponível (formato HTML renderizado)
        let description = '';
        if (issue.renderedFields?.description) {
            // Se temos descrição renderizada (HTML), usar ela
            description = parseJiraDescription(issue.renderedFields.description);
        } else if (issue.fields?.description) {
            // Caso contrário, usar a descrição raw (ADF)
            description = parseJiraDescription(issue.fields.description);
        }
        
        // Log para debug das primeiras tarefas
        if (index < 3) {
            console.log(`📝 Tarefa ${issue.key}:`, {
                title: issue.fields?.summary,
                type: taskType,
                hasDescription: !!description,
                descriptionLength: description.length,
                descriptionPreview: description.substring(0, 100)
            });
        }
        
        // Buscar comentários do Jira
        const jiraComments = await extractJiraComments(config, issue);
        
        const jiraStatusName = issue.fields?.status?.name || '';
        const task: JiraTask = {
            id: issue.key || `jira-${Date.now()}-${Math.random()}`,
            title: issue.fields?.summary || 'Sem título',
            description: description || '',
            status: mapJiraStatusToTaskStatus(jiraStatusName),
            jiraStatus: jiraStatusName, // Armazenar status original do Jira
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate,
            tags: issue.fields?.labels || [],
            testCases: [],
            bddScenarios: [],
            comments: jiraComments,
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
            task.assignee = 'Product';
        }

        // Mapear campos adicionais do Jira
        if (issue.fields?.duedate) {
            task.dueDate = issue.fields.duedate;
        }

        if (issue.fields?.timetracking) {
            task.timeTracking = {
                originalEstimate: issue.fields.timetracking.originalEstimate,
                remainingEstimate: issue.fields.timetracking.remainingEstimate,
                timeSpent: issue.fields.timetracking.timeSpent,
            };
        }

        if (issue.fields?.components && issue.fields.components.length > 0) {
            task.components = issue.fields.components.map((comp: any) => ({
                id: comp.id,
                name: comp.name,
            }));
        }

        if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
            task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
                id: version.id,
                name: version.name,
            }));
        }

        if (issue.fields?.environment) {
            task.environment = issue.fields.environment;
        }

        if (issue.fields?.reporter) {
            task.reporter = {
                displayName: issue.fields.reporter.displayName,
                emailAddress: issue.fields.reporter.emailAddress,
            };
        }

        if (issue.fields?.watches) {
            task.watchers = {
                watchCount: issue.fields.watches.watchCount || 0,
                isWatching: issue.fields.watches.isWatching || false,
            };
        }

        if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
            task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
                id: link.id,
                type: link.type?.name || '',
                relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
                direction: link.outwardIssue ? 'outward' : 'inward',
            }));
        }

        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        }

        // Mapear campos customizados (todos os campos que não são padrão)
        const standardFields = [
            'summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter',
            'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment',
            'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches',
            'issuelinks', 'attachment'
        ];
        const customFields: { [key: string]: any } = {};
        Object.keys(issue.fields).forEach((key) => {
            if (!standardFields.includes(key) && !key.startsWith('_')) {
                customFields[key] = issue.fields[key];
            }
        });
        if (Object.keys(customFields).length > 0) {
            task.jiraCustomFields = customFields;
        }

        // Mapear attachments (se disponíveis na API)
        // Nota: Attachments precisam ser buscados separadamente ou estar no expand
        // Por enquanto, deixamos vazio pois requer configuração adicional da API

        return task;
    }));

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
        settings: {
            jiraStatuses: jiraStatuses,
            jiraProjectKey: jiraProjectKey,
        },
    };

    return project;
};

export const syncJiraProject = async (
    config: JiraConfig,
    project: Project,
    jiraProjectKey: string
): Promise<Project> => {
    // Buscar TODAS as issues atualizadas desde a última sincronização (sem limite)
    const jiraIssues = await getJiraIssues(config, jiraProjectKey);
    
    // Atualizar tarefas existentes e adicionar novas
    const existingTaskKeys = new Set(project.tasks.map(t => t.id));
    const updatedTasks = [...project.tasks];

    for (const issue of jiraIssues) {
        const existingIndex = updatedTasks.findIndex(t => t.id === issue.key);
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';

        // Converter descrição do formato ADF para texto
        // Tentar também renderedFields.description se disponível (formato HTML renderizado)
        let description = '';
        if (issue.renderedFields?.description) {
            // Se temos descrição renderizada (HTML), usar ela
            description = parseJiraDescription(issue.renderedFields.description);
        } else if (issue.fields?.description) {
            // Caso contrário, usar a descrição raw (ADF)
            description = parseJiraDescription(issue.fields.description);
        }
        
        // Buscar comentários do Jira
        const jiraComments = await extractJiraComments(config, issue);
        
        // Fazer merge com comentários existentes
        const existingComments = existingIndex >= 0 ? (updatedTasks[existingIndex].comments || []) : [];
        const mergedComments = mergeComments(existingComments, jiraComments);
        
        const task: JiraTask = {
            id: issue.key || `jira-${Date.now()}-${Math.random()}`,
            title: issue.fields?.summary || 'Sem título',
            description: description || '',
            status: mapJiraStatusToTaskStatus(issue.fields?.status?.name),
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate,
            tags: issue.fields?.labels || [],
            testCases: existingIndex >= 0 ? updatedTasks[existingIndex].testCases : [],
            bddScenarios: existingIndex >= 0 ? updatedTasks[existingIndex].bddScenarios : [],
            comments: mergedComments,
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

        // Mapear campos adicionais do Jira (preservar existentes se já existirem)
        if (issue.fields?.duedate) {
            task.dueDate = issue.fields.duedate;
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].dueDate) {
            task.dueDate = updatedTasks[existingIndex].dueDate;
        }

        if (issue.fields?.timetracking) {
            task.timeTracking = {
                originalEstimate: issue.fields.timetracking.originalEstimate,
                remainingEstimate: issue.fields.timetracking.remainingEstimate,
                timeSpent: issue.fields.timetracking.timeSpent,
            };
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].timeTracking) {
            task.timeTracking = updatedTasks[existingIndex].timeTracking;
        }

        if (issue.fields?.components && issue.fields.components.length > 0) {
            task.components = issue.fields.components.map((comp: any) => ({
                id: comp.id,
                name: comp.name,
            }));
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].components) {
            task.components = updatedTasks[existingIndex].components;
        }

        if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
            task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
                id: version.id,
                name: version.name,
            }));
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].fixVersions) {
            task.fixVersions = updatedTasks[existingIndex].fixVersions;
        }

        if (issue.fields?.environment) {
            task.environment = issue.fields.environment;
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].environment) {
            task.environment = updatedTasks[existingIndex].environment;
        }

        if (issue.fields?.reporter) {
            task.reporter = {
                displayName: issue.fields.reporter.displayName,
                emailAddress: issue.fields.reporter.emailAddress,
            };
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].reporter) {
            task.reporter = updatedTasks[existingIndex].reporter;
        }

        if (issue.fields?.watches) {
            task.watchers = {
                watchCount: issue.fields.watches.watchCount || 0,
                isWatching: issue.fields.watches.isWatching || false,
            };
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].watchers) {
            task.watchers = updatedTasks[existingIndex].watchers;
        }

        if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
            task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
                id: link.id,
                type: link.type?.name || '',
                relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
                direction: link.outwardIssue ? 'outward' : 'inward',
            }));
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].issueLinks) {
            task.issueLinks = updatedTasks[existingIndex].issueLinks;
        }

        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].jiraAttachments) {
            task.jiraAttachments = updatedTasks[existingIndex].jiraAttachments;
        }

        // Mapear campos customizados
        const standardFields = [
            'summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter',
            'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment',
            'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches',
            'issuelinks', 'attachment'
        ];
        const customFields: { [key: string]: any } = {};
        Object.keys(issue.fields).forEach((key) => {
            if (!standardFields.includes(key) && !key.startsWith('_')) {
                customFields[key] = issue.fields[key];
            }
        });
        if (Object.keys(customFields).length > 0) {
            task.jiraCustomFields = customFields;
        } else if (existingIndex >= 0 && updatedTasks[existingIndex].jiraCustomFields) {
            task.jiraCustomFields = updatedTasks[existingIndex].jiraCustomFields;
        }

        if (existingIndex >= 0) {
            updatedTasks[existingIndex] = task;
        } else {
            updatedTasks.push(task);
        }
    }

    return {
        ...project,
        tasks: updatedTasks,
    };
};

export const addNewJiraTasks = async (
    config: JiraConfig,
    project: Project,
    jiraProjectKey: string,
    onProgress?: (current: number, total?: number) => void
): Promise<{ project: Project; newTasksCount: number; updatedStatusCount: number }> => {
    // Buscar status do Jira se não estiverem no projeto
    let jiraStatuses = project.settings?.jiraStatuses;
    if (!jiraStatuses || jiraStatuses.length === 0) {
        jiraStatuses = await getJiraStatuses(config, jiraProjectKey);
    }

    // Buscar TODAS as issues do Jira
    const jiraIssues = await getJiraIssues(config, jiraProjectKey, undefined, onProgress);
    
    // Criar um Map com as tarefas existentes para busca rápida
    const existingTasksMap = new Map(project.tasks.map(t => [t.id, t]));
    
    // Filtrar apenas tarefas novas (que não existem no projeto)
    const newIssues = jiraIssues.filter(issue => !existingTasksMap.has(issue.key));
    
    // Política: sincronização do Jira não altera status ou análises locais.
    // Apenas novas issues são adicionadas ao projeto.
    const updatedStatusCount = 0;
    
    if (newIssues.length === 0) {
        return { project, newTasksCount: 0, updatedStatusCount };
    }
    
    // Mapear apenas as novas issues para tarefas
    const newTasks: JiraTask[] = await Promise.all(newIssues.map(async (issue) => {
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';
        
        // Converter descrição do formato ADF para texto
        let description = '';
        if (issue.renderedFields?.description) {
            description = parseJiraDescription(issue.renderedFields.description);
        } else if (issue.fields?.description) {
            description = parseJiraDescription(issue.fields.description);
        }
        
        // Buscar comentários do Jira
        const jiraComments = await extractJiraComments(config, issue);
        
        const jiraStatusName = issue.fields?.status?.name || '';
        const task: JiraTask = {
            id: issue.key || `jira-${Date.now()}-${Math.random()}`,
            title: issue.fields?.summary || 'Sem título',
            description: description || '',
            status: mapJiraStatusToTaskStatus(jiraStatusName),
            jiraStatus: jiraStatusName, // Armazenar status original do Jira
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate,
            tags: issue.fields?.labels || [],
            testCases: [], // Novas tarefas começam sem casos de teste
            bddScenarios: [], // Novas tarefas começam sem cenários BDD
            comments: jiraComments,
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
            task.assignee = 'Product';
        }

        return task;
    }));

    // Adicionar novas tarefas ao projeto, preservando todas as tarefas existentes e suas alterações
    const allTasks = [...project.tasks, ...newTasks];

    return {
        project: {
            ...project,
            tasks: allTasks,
            settings: {
                ...project.settings,
                jiraStatuses: jiraStatuses,
                jiraProjectKey: jiraProjectKey,
            },
        },
        newTasksCount: newTasks.length,
        updatedStatusCount,
    };
};

/**
 * Atualiza uma issue do Jira com os campos fornecidos
 */
export const updateJiraIssue = async (
    config: JiraConfig,
    issueKey: string,
    fieldsToUpdate: { [key: string]: any }
): Promise<void> => {
    const endpoint = `rest/api/3/issue/${issueKey}`;
    
    const body = {
        fields: fieldsToUpdate,
    };

    await jiraApiCall<void>(
        config,
        endpoint,
        {
            method: 'PUT',
            body: JSON.stringify(body),
        }
    );
};

/**
 * Sincroniza uma tarefa local de volta para o Jira
 */
export const syncTaskToJira = async (
    config: JiraConfig,
    task: JiraTask
): Promise<void> => {
    // Verificar se a tarefa tem uma chave do Jira (formato PROJ-123)
    const jiraKeyMatch = task.id.match(/^[A-Z]+-\d+$/);
    if (!jiraKeyMatch) {
        throw new Error(`Tarefa ${task.id} não é uma issue do Jira válida`);
    }

    const issueKey = task.id;
    const fieldsToUpdate: { [key: string]: any } = {};

    // Mapear campos de volta para o formato do Jira
    if (task.dueDate) {
        fieldsToUpdate.duedate = task.dueDate;
    }

    if (task.timeTracking) {
        fieldsToUpdate.timetracking = {};
        if (task.timeTracking.originalEstimate) {
            fieldsToUpdate.timetracking.originalEstimate = task.timeTracking.originalEstimate;
        }
        if (task.timeTracking.remainingEstimate) {
            fieldsToUpdate.timetracking.remainingEstimate = task.timeTracking.remainingEstimate;
        }
        if (task.timeTracking.timeSpent) {
            fieldsToUpdate.timetracking.timeSpent = task.timeTracking.timeSpent;
        }
    }

    if (task.environment !== undefined) {
        fieldsToUpdate.environment = task.environment;
    }

    // Componentes e Fix Versions precisam ser atualizados com IDs
    // Por enquanto, apenas atualizamos se já existirem IDs
    if (task.components && task.components.length > 0) {
        fieldsToUpdate.components = task.components.map(comp => ({ id: comp.id }));
    }

    if (task.fixVersions && task.fixVersions.length > 0) {
        fieldsToUpdate.fixVersions = task.fixVersions.map(version => ({ id: version.id }));
    }

    // Campos customizados
    if (task.jiraCustomFields) {
        Object.keys(task.jiraCustomFields).forEach((key) => {
            fieldsToUpdate[key] = task.jiraCustomFields![key];
        });
    }

    // Só atualizar se houver campos para atualizar
    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('Nenhum campo para atualizar');
    }

    await updateJiraIssue(config, issueKey, fieldsToUpdate);
};

