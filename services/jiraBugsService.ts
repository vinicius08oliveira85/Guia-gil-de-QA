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
    // Verificar status concluído (inglês e português)
    if (
      lowerStatus.includes('done') ||
      lowerStatus.includes('resolved') ||
      lowerStatus.includes('closed') ||
      lowerStatus.includes('concluído') ||
      lowerStatus.includes('concluido') ||
      lowerStatus.includes('finalizado') ||
      lowerStatus.includes('resolvido') ||
      lowerStatus.includes('fechado')
    ) {
      return 'Done';
    }
    // Verificar status em andamento (inglês e português)
    if (
      lowerStatus.includes('progress') ||
      lowerStatus.includes('in progress') ||
      lowerStatus.includes('em andamento') ||
      lowerStatus.includes('andamento') ||
      lowerStatus.includes('em desenvolvimento') ||
      lowerStatus.includes('desenvolvimento')
    ) {
      return 'In Progress';
    }
    return 'To Do';
  };

  const severity = mapSeverity(jiraIssue.fields.priority?.name);
  const status = mapStatus(jiraIssue.fields.status.name);

  return {
    id: jiraIssue.key || `jira-${jiraIssue.id}`, // Usar issue.key (ex: GDPI-232) como ID
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
 * Atualiza bugs existentes e retorna novos bugs
 * Retorna objeto com bugs atualizados e novos bugs separadamente
 */
export const syncBugsFromJira = async (
  projectKey: string,
  existingTasks: JiraTask[]
): Promise<{ updatedBugs: JiraTask[]; newBugs: JiraTask[] }> => {
  const config = getJiraConfig();
  if (!config) {
    logger.warn('Configuração do Jira não encontrada', 'JiraBugsService');
    return { updatedBugs: [], newBugs: [] };
  }

  try {
    const jiraBugs = await fetchBugsFromJira(config, projectKey);
    const mappedBugs = jiraBugs.map(mapJiraBugToTask);

    // Criar um Map de bugs existentes por ID (issue.key como GDPI-XXX)
    const existingBugsMap = new Map<string, JiraTask>();
    existingTasks
      .filter(t => t.type === 'Bug')
      .forEach(t => {
        // O ID pode ser no formato GDPI-XXX ou jira-{id}
        // Normalizar para comparar corretamente
        const normalizedId = t.id.match(/^[A-Z]+-\d+$/) ? t.id : t.id;
        existingBugsMap.set(normalizedId, t);
      });

    const updatedBugs: JiraTask[] = [];
    const newBugs: JiraTask[] = [];

    mappedBugs.forEach(bug => {
      const existingBug = existingBugsMap.get(bug.id);
      
      if (existingBug) {
        // Bug existe - atualizar preservando apenas comentários (bugs não devem ter testCases nem bddScenarios)
        const updatedBug: JiraTask = {
          ...bug,
          testCases: [], // Bugs não devem ter casos de teste
          bddScenarios: [], // Bugs não devem ter cenários BDD
          comments: existingBug.comments || bug.comments || [], // Merge de comentários
        };
        updatedBugs.push(updatedBug);
      } else {
        // Bug novo
        newBugs.push(bug);
      }
    });

    logger.info(
      `Sincronizados ${updatedBugs.length} bugs atualizados e ${newBugs.length} novos bugs do Jira`,
      'JiraBugsService'
    );
    
    return { updatedBugs, newBugs };
  } catch (error) {
    logger.error('Erro ao sincronizar bugs do Jira', 'JiraBugsService', error);
    return { updatedBugs: [], newBugs: [] };
  }
};

