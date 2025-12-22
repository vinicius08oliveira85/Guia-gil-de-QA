import { Project, JiraTask, Comment } from '../types';
import { parseJiraDescription, parseJiraDescriptionHTML } from '../utils/jiraDescriptionParser';
import { getCache, setCache, clearCache } from '../utils/apiCache';
import { getJiraStatusColor } from '../utils/jiraStatusColors';
import { logger } from '../utils/logger';
import { loadTestStatusesByJiraKeys } from './supabaseService';
import { mergeTestCases } from '../utils/testCaseMerge';

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
        
        logger.debug('Fazendo requisição ao proxy Jira', 'jiraService', { endpoint, method: requestBody.method });
        
        const response = await fetch('/api/jira-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        logger.debug('Resposta do proxy', 'jiraService', { status: response.status, ok: response.ok });

        if (!response.ok) {
            let errorData: { error?: string };
            try {
                errorData = await response.json();
                logger.error('Erro do proxy', 'jiraService', errorData);
            } catch {
                const errorText = await response.text();
                logger.error('Erro do proxy (texto)', 'jiraService', errorText);
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || `Jira API Error (${response.status})`);
        }

        const data = await response.json();
        logger.debug('Dados recebidos do proxy', 'jiraService', data);
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            logger.error('Timeout na requisição', 'jiraService', error);
            throw new Error(`Timeout: A requisição demorou mais de ${timeout / 1000} segundos. Verifique sua conexão ou tente novamente.`);
        }
        logger.error('Erro na requisição', 'jiraService', error);
        throw error;
    }
};

export const testJiraConnection = async (config: JiraConfig): Promise<boolean> => {
    try {
        // Usar endpoint /myself que ainda está disponível
        await jiraApiCall(config, 'myself');
        return true;
    } catch (error) {
        logger.error('Jira connection test failed', 'jiraService', error);
        return false;
    }
};

export const getJiraProjects = async (config: JiraConfig, useCache: boolean = true): Promise<JiraProject[]> => {
    const cacheKey = `jira_projects_${config.url}`;
    
    // Tentar cache primeiro
    if (useCache) {
        const cached = getCache<JiraProject[]>(cacheKey);
        if (cached) {
            logger.debug('Usando projetos do cache', 'jiraService');
            return cached;
        }
    }
    logger.debug('Buscando projetos do Jira', 'jiraService', { url: config.url, endpoint: 'project?maxResults=100' });
    
    try {
        const response = await jiraApiCall<{ values?: JiraProject[] }>(
            config, 
            'project?maxResults=100',
            { timeout: 20000 } // 20 segundos para listar projetos
        );
        
        logger.debug('Resposta do Jira', 'jiraService', response);
        
        if (!response) {
            logger.error('Resposta vazia do Jira', 'jiraService');
            throw new Error('Resposta vazia do servidor Jira');
        }
        
        let projects: JiraProject[] = [];
        
        if (Array.isArray(response.values)) {
            logger.info(`Encontrados ${response.values.length} projetos`, 'jiraService');
            projects = response.values;
        } else if (Array.isArray(response)) {
            logger.info(`Encontrados ${response.length} projetos (formato alternativo)`, 'jiraService');
            projects = response;
        } else {
            logger.warn('Formato de resposta inesperado', 'jiraService', response);
            projects = [];
        }
        
        // Salvar no cache (5 minutos)
        if (projects && projects.length > 0) {
            setCache(cacheKey, projects, 5 * 60 * 1000);
        }
        
        return projects;
    } catch (error) {
        logger.error('Erro em getJiraProjects', 'jiraService', error);
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
        logger.debug('Usando status do Jira do cache', 'jiraService');
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
            logger.warn('Não foi possível buscar status via API, extraindo das issues', 'jiraService');
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
        logger.error('Erro ao buscar status do Jira', 'jiraService', error);
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
            logger.error('Erro no fallback de status', 'jiraService', fallbackError);
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
            logger.debug(`${label}: Recebidas ${(response.issues || []).length} issues`, 'jiraService');
        }
        return response;
    };

    logger.info(`Buscando TODAS as issues do projeto ${projectKey}`, 'jiraService');
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
                logger.warn('Nenhuma issue retornada nesta página. Parando paginação', 'jiraService');
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
                logger.warn('Nenhuma issue retornada nesta página. Parando paginação', 'jiraService');
                break;
            }
            pushIssues(issues, response.total);
            nextStartAt += issues.length;
            pageIndex += 1;

            if (issues.length < pageSize) {
                break;
            }

            if (maxResults === undefined && allIssues.length >= 50000) {
                logger.warn(`Limite de segurança de 50000 issues atingido para o projeto ${projectKey}`, 'jiraService');
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
    logger.debug(`Tipos encontrados no Jira: ${uniqueTypes.slice(0, 10).join(', ')}`, 'jiraService');
    
    logger.info(`Total de issues buscadas: ${allIssues.length} para o projeto ${projectKey}`, 'jiraService');
    logger.info(`Breakdown: ${epics} Epics, ${stories} Histórias, ${tasks} Tarefas, ${bugs} Bugs`, 'jiraService');
    
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
 * Extrai o Epic Link (key do Epic) dos campos customizados do Jira
 * O Epic Link pode estar em diferentes campos customizados dependendo da configuração do Jira
 */
const extractEpicLink = (fields: any): string | undefined => {
    if (!fields) return undefined;
    
    // Tentar campos comuns do Epic Link
    const epicLinkFields = [
        'customfield_10011', // Campo padrão mais comum
        'epicLink',
        'epic',
        'customfield_10014', // Epic Name (alternativo)
    ];
    
    // Procurar em campos conhecidos
    for (const fieldName of epicLinkFields) {
        if (fields[fieldName]) {
            // Pode ser string (key) ou objeto com key
            if (typeof fields[fieldName] === 'string') {
                return fields[fieldName];
            }
            if (fields[fieldName]?.key) {
                return fields[fieldName].key;
            }
        }
    }
    
    // Procurar em todos os campos customizados que contenham "epic" no nome
    for (const key in fields) {
        if (key.toLowerCase().includes('epic') && fields[key]) {
            if (typeof fields[key] === 'string') {
                return fields[key];
            }
            if (fields[key]?.key) {
                return fields[key].key;
            }
        }
    }
    
    return undefined;
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
        logger.warn(`Erro ao buscar comentários da issue ${issueKey}`, 'jiraService', error);
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

    // Buscar status dos testes salvos no Supabase para todas as chaves Jira
    const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
    const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);
    
    logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService');

    // Mapear issues para tarefas
    const tasks: JiraTask[] = await Promise.all(jiraIssues.map(async (issue, index) => {
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';
        
        // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
        let jiraAttachments: Array<{ id: string; filename: string; size: number; created: string; author: string }> = [];
        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        }
        
        // Converter descrição do formato ADF para HTML preservando formatação rica
        // Tentar também renderedFields.description se disponível (formato HTML renderizado)
        let description = '';
        if (issue.renderedFields?.description) {
            // Se temos descrição renderizada (HTML), preservar formatação rica
            description = parseJiraDescriptionHTML(
                issue.renderedFields.description,
                config.url,
                jiraAttachments
            );
        } else if (issue.fields?.description) {
            // Caso contrário, converter a descrição raw (ADF) para HTML
            description = parseJiraDescriptionHTML(
                issue.fields.description,
                config.url,
                jiraAttachments
            );
        }
        
        // Log para debug das primeiras tarefas
        if (index < 3) {
            logger.debug(`Tarefa ${issue.key}`, 'jiraService', {
                title: issue.fields?.summary,
                type: taskType,
                hasDescription: !!description,
                descriptionLength: description.length,
                descriptionPreview: description.substring(0, 100),
                attachmentsCount: jiraAttachments.length
            });
        }
        
        // Buscar comentários do Jira
        const jiraComments = await extractJiraComments(config, issue);
        
        const jiraStatusName = issue.fields?.status?.name || '';
        const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;
        
        // Buscar testCases salvos para esta chave Jira
        const savedTestCases = savedTestStatuses.get(jiraKey) || [];
        
        const task: JiraTask = {
            id: jiraKey,
            title: issue.fields?.summary || 'Sem título',
            description: description || '',
            status: mapJiraStatusToTaskStatus(jiraStatusName),
            jiraStatus: jiraStatusName, // Armazenar status original do Jira
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate,
            tags: issue.fields?.labels || [],
            testCases: savedTestCases, // Inicializar com testCases salvos (serão mesclados se houver novos)
            bddScenarios: [],
            comments: jiraComments,
        };
        
        if (savedTestCases.length > 0) {
            logger.debug(`Preservando ${savedTestCases.length} testCases salvos para ${jiraKey}`, 'jiraService');
        }

        if (isBug) {
            task.severity = mapJiraSeverity(issue.fields.labels);
        }

        if (issue.fields?.parent?.key) {
            task.parentId = issue.fields.parent.key;
        }

        // Capturar Epic Link (para Histórias vinculadas a Epics)
        const epicKey = extractEpicLink(issue.fields);
        if (epicKey) {
            task.epicKey = epicKey;
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
        // Excluir campos de Epic Link da lista de customizados pois já foram processados
        const standardFields = [
            'summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter',
            'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment',
            'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches',
            'issuelinks', 'attachment'
        ];
        const customFields: { [key: string]: any } = {};
        Object.keys(issue.fields).forEach((key) => {
            // Não incluir campos de Epic Link nos customizados (já processados)
            if (!standardFields.includes(key) && !key.startsWith('_') && !key.toLowerCase().includes('epic')) {
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

    // Organizar hierarquia (Epics, Histórias e subtarefas)
    // A hierarquia é:
    // - Epic (tipo Epic)
    //   - História (tipo História com epicKey apontando para Epic)
    //     - Tarefa (tipo Tarefa com parentId apontando para História)
    //   - Bug (tipo Bug com epicKey ou parentId)
    // Nota: A hierarquia é preservada através dos campos epicKey e parentId
    // Não precisamos reorganizar aqui, apenas garantir que os campos estão corretos

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
    
    logger.info(`Buscadas ${jiraIssues.length} issues do Jira para projeto ${jiraProjectKey}`, 'jiraService');
    logger.info(`Tarefas existentes no projeto: ${project.tasks.length}`, 'jiraService');
    
    // Buscar status dos testes salvos no Supabase para todas as chaves Jira
    const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
    const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);
    
    logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService');
    
    // Atualizar tarefas existentes e adicionar novas
    const updatedTasks = [...project.tasks];
    let updatedCount = 0;
    let newCount = 0;

    for (const issue of jiraIssues) {
        const existingIndex = updatedTasks.findIndex(t => t.id === issue.key);
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';

        // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
        let jiraAttachments: Array<{ id: string; filename: string; size: number; created: string; author: string }> = [];
        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        }

        // Converter descrição do formato ADF para HTML preservando formatação rica
        // Tentar também renderedFields.description se disponível (formato HTML renderizado)
        let description = '';
        if (issue.renderedFields?.description) {
            // Se temos descrição renderizada (HTML), preservar formatação rica
            description = parseJiraDescriptionHTML(
                issue.renderedFields.description,
                config.url,
                jiraAttachments
            );
        } else if (issue.fields?.description) {
            // Caso contrário, converter a descrição raw (ADF) para HTML
            description = parseJiraDescriptionHTML(
                issue.fields.description,
                config.url,
                jiraAttachments
            );
        }
        
        // Buscar comentários do Jira
        const jiraComments = await extractJiraComments(config, issue);
        
        // Fazer merge com comentários existentes
        const existingComments = existingIndex >= 0 ? (updatedTasks[existingIndex].comments || []) : [];
        const mergedComments = mergeComments(existingComments, jiraComments);
        
        const jiraStatusName = issue.fields?.status?.name || '';
        const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;
        
        // Buscar testCases existentes e salvos
        const existingTestCases = existingIndex >= 0 ? (updatedTasks[existingIndex].testCases || []) : [];
        const savedTestCases = savedTestStatuses.get(jiraKey) || [];
        
        // Mesclar testCases: priorizar os existentes (mais recentes) sobre os salvos
        // Se há testCases existentes, usar como base e mesclar com salvos (para pegar status de testCases que foram removidos)
        // Se não há existentes mas há salvos, usar os salvos
        let mergedTestCases: typeof existingTestCases;
        if (existingTestCases.length > 0) {
            // Priorizar existentes (mais recentes), mas mesclar com salvos para pegar testCases removidos
            mergedTestCases = mergeTestCases(existingTestCases, savedTestCases);
            logger.debug(`Mesclando ${existingTestCases.length} testCases existentes com ${savedTestCases.length} salvos para ${jiraKey}`, 'jiraService');
        } else if (savedTestCases.length > 0) {
            // Não há existentes, usar os salvos
            mergedTestCases = savedTestCases;
            logger.debug(`Usando ${savedTestCases.length} testCases salvos (sem existentes) para ${jiraKey}`, 'jiraService');
        } else {
            // Não há nem existentes nem salvos
            mergedTestCases = [];
        }
        
        const task: JiraTask = {
            id: jiraKey,
            title: issue.fields?.summary || 'Sem título',
            description: description || '',
            status: mapJiraStatusToTaskStatus(jiraStatusName),
            jiraStatus: jiraStatusName, // Sempre atualizar status original do Jira
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate || undefined, // Atualizar exatamente como está no Jira
            tags: issue.fields?.labels || [],
            testCases: mergedTestCases, // Usar testCases mesclados (salvos + existentes)
            bddScenarios: existingIndex >= 0 ? updatedTasks[existingIndex].bddScenarios : [], // Preservar cenários BDD locais
            comments: mergedComments,
        };

        if (isBug) {
            task.severity = mapJiraSeverity(issue.fields.labels);
        }

        // Atualizar parentId exatamente como está no Jira
        if (issue.fields?.parent?.key) {
            task.parentId = issue.fields.parent.key;
        } else {
            // Se não há parent no Jira, remover se existia anteriormente
            task.parentId = undefined;
        }

        // Capturar Epic Link (para Histórias vinculadas a Epics) - sempre atualizar do Jira
        const epicKey = extractEpicLink(issue.fields);
        if (epicKey) {
            task.epicKey = epicKey;
        } else {
            // Se não há Epic Link no Jira, remover se existia anteriormente
            task.epicKey = undefined;
        }

        // Mapear assignee - sempre atualizar do Jira
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

        // Mapear campos adicionais do Jira - sempre atualizar exatamente como estão no Jira
        if (issue.fields?.duedate) {
            task.dueDate = issue.fields.duedate;
        } else {
            // Se não há dueDate no Jira, remover se existia anteriormente
            task.dueDate = undefined;
        }

        // Atualizar timeTracking exatamente como está no Jira
        if (issue.fields?.timetracking) {
            task.timeTracking = {
                originalEstimate: issue.fields.timetracking.originalEstimate,
                remainingEstimate: issue.fields.timetracking.remainingEstimate,
                timeSpent: issue.fields.timetracking.timeSpent,
            };
        } else {
            // Se não há timetracking no Jira, remover se existia anteriormente
            task.timeTracking = undefined;
        }

        // Atualizar components exatamente como estão no Jira
        if (issue.fields?.components && issue.fields.components.length > 0) {
            task.components = issue.fields.components.map((comp: any) => ({
                id: comp.id,
                name: comp.name,
            }));
        } else {
            // Se não há components no Jira, remover se existiam anteriormente
            task.components = undefined;
        }

        // Atualizar fixVersions exatamente como estão no Jira
        if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
            task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
                id: version.id,
                name: version.name,
            }));
        } else {
            // Se não há fixVersions no Jira, remover se existiam anteriormente
            task.fixVersions = undefined;
        }

        // Atualizar environment exatamente como está no Jira
        if (issue.fields?.environment) {
            task.environment = issue.fields.environment;
        } else {
            // Se não há environment no Jira, remover se existia anteriormente
            task.environment = undefined;
        }

        // Atualizar reporter exatamente como está no Jira
        if (issue.fields?.reporter) {
            task.reporter = {
                displayName: issue.fields.reporter.displayName,
                emailAddress: issue.fields.reporter.emailAddress,
            };
        } else {
            // Se não há reporter no Jira, remover se existia anteriormente
            task.reporter = undefined;
        }

        // Atualizar watchers exatamente como estão no Jira
        if (issue.fields?.watches) {
            task.watchers = {
                watchCount: issue.fields.watches.watchCount || 0,
                isWatching: issue.fields.watches.isWatching || false,
            };
        } else {
            // Se não há watches no Jira, remover se existiam anteriormente
            task.watchers = undefined;
        }

        // Atualizar issueLinks exatamente como estão no Jira
        if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
            task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
                id: link.id,
                type: link.type?.name || '',
                relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
                direction: link.outwardIssue ? 'outward' : 'inward',
            }));
        } else {
            // Se não há issueLinks no Jira, remover se existiam anteriormente
            task.issueLinks = undefined;
        }

        // Atualizar jiraAttachments exatamente como estão no Jira
        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        } else {
            // Se não há attachments no Jira, remover se existiam anteriormente
            task.jiraAttachments = undefined;
        }

        // Mapear campos customizados - sempre atualizar exatamente como estão no Jira
        // Excluir campos de Epic Link da lista de customizados pois já foram processados
        const standardFields = [
            'summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter',
            'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment',
            'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches',
            'issuelinks', 'attachment'
        ];
        const customFields: { [key: string]: any } = {};
        Object.keys(issue.fields).forEach((key) => {
            // Não incluir campos de Epic Link nos customizados (já processados)
            if (!standardFields.includes(key) && !key.startsWith('_') && !key.toLowerCase().includes('epic')) {
                customFields[key] = issue.fields[key];
            }
        });
        if (Object.keys(customFields).length > 0) {
            task.jiraCustomFields = customFields;
        } else {
            // Se não há customFields no Jira, remover se existiam anteriormente
            task.jiraCustomFields = undefined;
        }

        if (existingIndex >= 0) {
            const oldTask = updatedTasks[existingIndex];
            // Verificar se realmente houve mudanças nos campos do Jira antes de atualizar
            const hasChanges = (
                oldTask.title !== task.title ||
                oldTask.description !== task.description ||
                oldTask.status !== task.status ||
                oldTask.jiraStatus !== task.jiraStatus ||
                oldTask.priority !== task.priority ||
                JSON.stringify(oldTask.tags || []) !== JSON.stringify(task.tags || []) ||
                oldTask.severity !== task.severity ||
                oldTask.completedAt !== task.completedAt ||
                oldTask.dueDate !== task.dueDate ||
                oldTask.parentId !== task.parentId ||
                oldTask.epicKey !== task.epicKey ||
                oldTask.assignee !== task.assignee ||
                JSON.stringify(oldTask.timeTracking) !== JSON.stringify(task.timeTracking) ||
                JSON.stringify(oldTask.components || []) !== JSON.stringify(task.components || []) ||
                JSON.stringify(oldTask.fixVersions || []) !== JSON.stringify(task.fixVersions || []) ||
                oldTask.environment !== task.environment ||
                JSON.stringify(oldTask.reporter) !== JSON.stringify(task.reporter) ||
                JSON.stringify(oldTask.watchers) !== JSON.stringify(task.watchers) ||
                JSON.stringify(oldTask.issueLinks || []) !== JSON.stringify(task.issueLinks || []) ||
                JSON.stringify(oldTask.jiraAttachments || []) !== JSON.stringify(task.jiraAttachments || []) ||
                JSON.stringify(oldTask.jiraCustomFields || {}) !== JSON.stringify(task.jiraCustomFields || {})
            );
            
            if (hasChanges) {
                logger.debug(`Atualizando tarefa ${task.id}`, 'jiraService', {
                    titleChanged: oldTask.title !== task.title,
                    statusChanged: oldTask.status !== task.status || oldTask.jiraStatus !== task.jiraStatus,
                    priorityChanged: oldTask.priority !== task.priority,
                    descriptionChanged: oldTask.description !== task.description
                });
                
                // Buscar testCases salvos no Supabase para esta chave
                const savedTestCasesForTask = savedTestStatuses.get(task.id) || [];
                const existingTestCasesForTask = oldTask.testCases || [];
                
                // Mesclar testCases: priorizar os existentes (mais recentes) sobre os salvos
                let finalTestCases: typeof oldTask.testCases;
                if (existingTestCasesForTask.length > 0) {
                    // Priorizar existentes (mais recentes), mas mesclar com salvos para pegar testCases removidos
                    finalTestCases = mergeTestCases(existingTestCasesForTask, savedTestCasesForTask);
                    logger.debug(`Mesclando ${existingTestCasesForTask.length} testCases existentes com ${savedTestCasesForTask.length} salvos para ${task.id}`, 'jiraService');
                } else if (savedTestCasesForTask.length > 0) {
                    // Não há existentes, usar os salvos
                    finalTestCases = savedTestCasesForTask;
                    logger.debug(`Usando ${savedTestCasesForTask.length} testCases salvos (sem existentes) para ${task.id}`, 'jiraService');
                } else {
                    // Não há nem existentes nem salvos
                    finalTestCases = [];
                }
                
                // Fazer merge preservando dados locais e atualizando apenas campos do Jira
                updatedTasks[existingIndex] = {
                    ...oldTask, // Preservar todos os dados locais primeiro
                    // Atualizar apenas campos importados do Jira
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    jiraStatus: task.jiraStatus,
                    priority: task.priority,
                    tags: task.tags,
                    severity: task.severity,
                    completedAt: task.completedAt,
                    dueDate: task.dueDate,
                    parentId: task.parentId,
                    epicKey: task.epicKey,
                    assignee: task.assignee,
                    timeTracking: task.timeTracking,
                    components: task.components,
                    fixVersions: task.fixVersions,
                    environment: task.environment,
                    reporter: task.reporter,
                    watchers: task.watchers,
                    issueLinks: task.issueLinks,
                    jiraAttachments: task.jiraAttachments,
                    jiraCustomFields: task.jiraCustomFields,
                    comments: task.comments, // Já faz merge de comentários
                    // Preservar dados locais que não vêm do Jira
                    testCases: finalTestCases, // ✅ Preservar status dos testes (mesclados com salvos do Supabase)
                    bddScenarios: oldTask.bddScenarios || [], // ✅ Preservar cenários BDD
                    testStrategy: oldTask.testStrategy, // ✅ Preservar estratégia de teste
                    tools: oldTask.tools, // ✅ Preservar ferramentas
                    testCaseTools: oldTask.testCaseTools, // ✅ Preservar ferramentas de testes
                    // Preservar createdAt se já existe (não sobrescrever com data do Jira se já foi criado localmente)
                    createdAt: oldTask.createdAt || task.createdAt,
                };
                updatedCount++;
            } else {
                // Preservar tarefa existente se não houve mudanças no Jira
                // Mas ainda assim mesclar testCases salvos se houver
                const savedTestCasesForTaskNoChanges = savedTestStatuses.get(task.id) || [];
                const existingTestCasesNoChanges = oldTask.testCases || [];
                
                if (existingTestCasesNoChanges.length > 0 || savedTestCasesForTaskNoChanges.length > 0) {
                    // Priorizar existentes, mas mesclar com salvos
                    const mergedTestCasesNoChanges = existingTestCasesNoChanges.length > 0
                        ? mergeTestCases(existingTestCasesNoChanges, savedTestCasesForTaskNoChanges)
                        : savedTestCasesForTaskNoChanges;
                    updatedTasks[existingIndex] = {
                        ...oldTask,
                        testCases: mergedTestCasesNoChanges
                    };
                    logger.debug(`Mesclando ${existingTestCasesNoChanges.length} testCases existentes com ${savedTestCasesForTaskNoChanges.length} salvos (sem mudanças no Jira) para ${task.id}`, 'jiraService');
                } else {
                    updatedTasks[existingIndex] = oldTask;
                }
            }
        } else {
            logger.info(`Nova tarefa encontrada: ${task.id} - ${task.title}`, 'jiraService');
            updatedTasks.push(task);
            newCount++;
        }
    }

    logger.info(`Resumo: ${updatedCount} atualizadas, ${newCount} novas, ${updatedTasks.length} total`, 'jiraService');

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
        
        // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
        let jiraAttachments: Array<{ id: string; filename: string; size: number; created: string; author: string }> = [];
        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        }
        
        // Converter descrição do formato ADF para HTML preservando formatação rica
        let description = '';
        if (issue.renderedFields?.description) {
            // Se temos descrição renderizada (HTML), preservar formatação rica
            description = parseJiraDescriptionHTML(
                issue.renderedFields.description,
                config.url,
                jiraAttachments
            );
        } else if (issue.fields?.description) {
            // Caso contrário, converter a descrição raw (ADF) para HTML
            description = parseJiraDescriptionHTML(
                issue.fields.description,
                config.url,
                jiraAttachments
            );
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

        // Capturar Epic Link (para Histórias vinculadas a Epics)
        const epicKey = extractEpicLink(issue.fields);
        if (epicKey) {
            task.epicKey = epicKey;
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

        // Mapear campos adicionais do Jira (exatamente como estão no Jira)
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
        // Excluir campos de Epic Link da lista de customizados pois já foram processados
        const standardFields = [
            'summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter',
            'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment',
            'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches',
            'issuelinks', 'attachment'
        ];
        const customFields: { [key: string]: any } = {};
        Object.keys(issue.fields).forEach((key) => {
            // Não incluir campos de Epic Link nos customizados (já processados)
            if (!standardFields.includes(key) && !key.startsWith('_') && !key.toLowerCase().includes('epic')) {
                customFields[key] = issue.fields[key];
            }
        });
        if (Object.keys(customFields).length > 0) {
            task.jiraCustomFields = customFields;
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
    const endpoint = `issue/${issueKey}`;
    
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
    // Filtrar campos que são apenas informativos e não podem ser atualizados
    const readOnlyFields = ['project', 'statusCategory', 'statuscategorychangedate', 'aggregatetimespent'];
    
    if (task.jiraCustomFields) {
        Object.keys(task.jiraCustomFields).forEach((key) => {
            // Pular campos somente leitura
            if (readOnlyFields.includes(key)) {
                return;
            }
            
            const value = task.jiraCustomFields![key];
            
            // Não enviar valores null ou undefined
            if (value === null || value === undefined) {
                return;
            }
            
            // Para objetos complexos, tentar extrair apenas o ID se disponível
            // (campos customizados do Jira geralmente precisam de IDs)
            if (typeof value === 'object' && value !== null) {
                // Se o objeto tem um ID, usar apenas o ID
                if (value.id) {
                    fieldsToUpdate[key] = { id: value.id };
                } else if (value.key) {
                    // Para alguns campos, usar key
                    fieldsToUpdate[key] = { key: value.key };
                } else {
                    // Para outros objetos, tentar enviar como está (pode precisar de ajuste)
                    fieldsToUpdate[key] = value;
                }
            } else {
                // Para valores primitivos, enviar diretamente
                fieldsToUpdate[key] = value;
            }
        });
    }

    // Só atualizar se houver campos para atualizar
    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('Nenhum campo para atualizar');
    }

    await updateJiraIssue(config, issueKey, fieldsToUpdate);
};

