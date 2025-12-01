import { JiraConfig, getJiraConfig, getJiraIssues, JiraIssue } from './jiraService';
import { JiraTask, BugSeverity } from '../types';
import { logger } from '../utils/logger';

/**
 * Busca bugs do Jira para um projeto específico
 */
export const fetchBugsFromJira = async (
  config: JiraConfig,
  projectKey: string,
  maxResults: number = 100
): Promise<JiraIssue[]> => {
  try {
    logger.debug(`Buscando bugs do projeto ${projectKey}`, 'JiraBugsService');
    
    // Buscar todas as issues e filtrar apenas bugs
    const allIssues = await getJiraIssues(config, projectKey, maxResults * 2); // Buscar mais para garantir que temos bugs suficientes
    
    // Filtrar apenas bugs não resolvidos
    const bugs = allIssues.filter(issue => {
      const isBug = issue.fields.issuetype.name.toLowerCase().includes('bug');
      const isUnresolved = !issue.fields.resolutiondate;
      return isBug && isUnresolved;
    });

    logger.info(`Encontrados ${bugs.length} bugs no Jira`, 'JiraBugsService');
    return bugs.slice(0, maxResults);
  } catch (error) {
    logger.error('Erro ao buscar bugs do Jira', 'JiraBugsService', error);
    throw error;
  }
};

/**
 * Mapeia um bug do Jira para JiraTask local
 */
export const mapJiraBugToTask = (jiraIssue: JiraIssue): JiraTask => {
  // Mapear severidade do Jira para nosso tipo
  const mapSeverity = (priority?: string): BugSeverity => {
    if (!priority) return 'Médio';
    
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes('crítico') || lowerPriority.includes('critical') || lowerPriority.includes('bloqueador') || lowerPriority.includes('blocker')) {
      return 'Crítico';
    }
    if (lowerPriority.includes('alto') || lowerPriority.includes('high') || lowerPriority.includes('major')) {
      return 'Alto';
    }
    if (lowerPriority.includes('baixo') || lowerPriority.includes('low') || lowerPriority.includes('minor')) {
      return 'Baixo';
    }
    return 'Médio';
  };

  // Mapear status do Jira
  const mapStatus = (jiraStatus: string): 'To Do' | 'In Progress' | 'Done' => {
    const lowerStatus = jiraStatus.toLowerCase();
    if (lowerStatus.includes('done') || lowerStatus.includes('resolvido') || lowerStatus.includes('fechado') || lowerStatus.includes('closed')) {
      return 'Done';
    }
    if (lowerStatus.includes('progress') || lowerStatus.includes('andamento') || lowerStatus.includes('em desenvolvimento')) {
      return 'In Progress';
    }
    return 'To Do';
  };

  const severity = mapSeverity(jiraIssue.fields.priority?.name);
  const status = mapStatus(jiraIssue.fields.status.name);

  return {
    id: `jira-${jiraIssue.id}`,
    title: jiraIssue.fields.summary,
    description: jiraIssue.fields.description || '',
    status,
    jiraStatus: jiraIssue.fields.status.name,
    testCases: [],
    type: 'Bug',
    severity,
    priority: severity === 'Crítico' ? 'Urgente' : severity === 'Alto' ? 'Alta' : severity === 'Médio' ? 'Média' : 'Baixa',
    createdAt: jiraIssue.fields.created,
    completedAt: jiraIssue.fields.resolutiondate,
    tags: jiraIssue.fields.labels || [],
    environment: jiraIssue.fields.environment,
    reporter: jiraIssue.fields.reporter ? {
      displayName: jiraIssue.fields.reporter.displayName,
      emailAddress: jiraIssue.fields.reporter.emailAddress,
    } : undefined,
    watchers: jiraIssue.fields.watches ? {
      watchCount: jiraIssue.fields.watches.watchCount,
      isWatching: jiraIssue.fields.watches.isWatching,
    } : undefined,
    components: jiraIssue.fields.components,
    fixVersions: jiraIssue.fields.fixVersions,
    dueDate: jiraIssue.fields.duedate,
    timeTracking: jiraIssue.fields.timetracking,
    issueLinks: jiraIssue.fields.issuelinks?.map(link => ({
      id: link.id,
      type: link.type.name,
      relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
      direction: link.outwardIssue ? 'outward' : 'inward',
    })),
    jiraAttachments: jiraIssue.fields.attachment?.map(att => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      created: att.created,
      author: att.author.displayName,
    })),
  };
};

/**
 * Sincroniza bugs do Jira com o projeto
 * Retorna apenas bugs que ainda não estão no projeto (baseado no ID do Jira)
 */
export const syncBugsFromJira = async (
  projectKey: string,
  existingTasks: JiraTask[]
): Promise<JiraTask[]> => {
  const config = getJiraConfig();
  if (!config) {
    logger.warn('Configuração do Jira não encontrada', 'JiraBugsService');
    return [];
  }

  try {
    const jiraBugs = await fetchBugsFromJira(config, projectKey);
    const mappedBugs = jiraBugs.map(mapJiraBugToTask);

    // Filtrar bugs que já existem no projeto (comparar por título ou ID do Jira)
    const existingBugIds = new Set(
      existingTasks
        .filter(t => t.type === 'Bug')
        .map(t => {
          // Tentar extrair ID do Jira do ID local (formato: jira-{id})
          const match = t.id.match(/jira-(\d+)/);
          return match ? match[1] : t.title;
        })
    );

    const newBugs = mappedBugs.filter(bug => {
      const jiraId = bug.id.replace('jira-', '');
      return !existingBugIds.has(jiraId) && !existingBugIds.has(bug.title);
    });

    logger.info(`Sincronizados ${newBugs.length} novos bugs do Jira`, 'JiraBugsService');
    return newBugs;
  } catch (error) {
    logger.error('Erro ao sincronizar bugs do Jira', 'JiraBugsService', error);
    return [];
  }
};

