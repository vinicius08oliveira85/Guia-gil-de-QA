import type { Comment } from '../../types';
import type { JiraConfig, JiraIssue, JiraTaskFormData } from './types';
import { EPIC_LINK_FIELD_KEYS } from './types';
import { jiraApiCall } from './api';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { logger } from '../../utils/logger';

export const mapJiraStatusToTaskStatus = (
  jiraStatus: string | undefined | null
): 'To Do' | 'In Progress' | 'Done' => {
  if (!jiraStatus) return 'To Do';
  const status = jiraStatus.toLowerCase();
  if (
    status.includes('done') ||
    status.includes('resolved') ||
    status.includes('closed') ||
    status.includes('concluído') ||
    status.includes('concluido') ||
    status.includes('finalizado') ||
    status.includes('resolvido') ||
    status.includes('fechado')
  ) {
    return 'Done';
  }
  if (
    status.includes('progress') ||
    status.includes('in progress') ||
    status.includes('em andamento') ||
    status.includes('andamento') ||
    status.includes('em desenvolvimento') ||
    status.includes('desenvolvimento')
  ) {
    return 'In Progress';
  }
  return 'To Do';
};

export const mapJiraTypeToTaskType = (
  jiraType: string | undefined | null
): 'Epic' | 'História' | 'Tarefa' | 'Bug' => {
  if (!jiraType) return 'Tarefa';
  const type = jiraType.toLowerCase();
  if (type.includes('epic')) return 'Epic';
  if (type.includes('story') || type.includes('história')) return 'História';
  if (type.includes('bug') || type.includes('defect')) return 'Bug';
  return 'Tarefa';
};

export const mapJiraPriorityToTaskPriority = (
  jiraPriority?: string
): 'Baixa' | 'Média' | 'Alta' | 'Urgente' => {
  if (!jiraPriority) return 'Média';
  const priority = jiraPriority.toLowerCase();
  if (priority.includes('highest') || priority.includes('urgent')) return 'Urgente';
  if (priority.includes('high')) return 'Alta';
  if (priority.includes('low') || priority.includes('lowest')) return 'Baixa';
  return 'Média';
};

export const mapJiraSeverity = (labels?: string[]): 'Crítico' | 'Alto' | 'Médio' | 'Baixo' => {
  if (!labels || !Array.isArray(labels)) return 'Médio';
  const severityLabels = labels.filter(
    l =>
      l &&
      typeof l === 'string' &&
      (l.toLowerCase().includes('severity') ||
        l.toLowerCase().includes('severidade') ||
        l.toLowerCase().includes('critical') ||
        l.toLowerCase().includes('high') ||
        l.toLowerCase().includes('medium') ||
        l.toLowerCase().includes('low'))
  );

  if (severityLabels.length === 0) return 'Médio';

  const severity = severityLabels[0]?.toLowerCase() || '';
  if (severity.includes('critical') || severity.includes('crítico')) return 'Crítico';
  if (severity.includes('high') || severity.includes('alto')) return 'Alto';
  if (severity.includes('low') || severity.includes('baixo')) return 'Baixo';
  return 'Médio';
};

export const extractEpicLink = (fields: any): string | undefined => {
  if (!fields) return undefined;

  const epicLinkFields = ['customfield_10011', 'epicLink', 'epic', 'customfield_10014'];

  for (const fieldName of epicLinkFields) {
    if (fields[fieldName]) {
      if (typeof fields[fieldName] === 'string') {
        return fields[fieldName];
      }
      if (fields[fieldName]?.key) {
        return fields[fieldName].key;
      }
    }
  }

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

export const getJiraIssueComments = async (
  config: JiraConfig,
  issueKey: string,
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>
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
        body: string | any;
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
      content: parseJiraDescriptionHTML(comment.body, config.url, jiraAttachments) || '',
      createdAt: comment.created,
      updatedAt: comment.updated,
      fromJira: true,
    }));
  } catch (error) {
    logger.warn(`Erro ao buscar comentários da issue ${issueKey}`, 'jiraService', error);
    return [];
  }
};

export const mergeComments = (existingComments: Comment[], jiraComments: Comment[]): Comment[] => {
  const commentsMap = new Map<string, Comment>();

  existingComments.forEach(comment => {
    commentsMap.set(comment.id, comment);
  });

  jiraComments.forEach(jiraComment => {
    const existing = commentsMap.get(jiraComment.id);
    if (existing) {
      if (
        jiraComment.updatedAt &&
        (!existing.updatedAt || jiraComment.updatedAt > existing.updatedAt)
      ) {
        commentsMap.set(jiraComment.id, jiraComment);
      }
    } else {
      commentsMap.set(jiraComment.id, jiraComment);
    }
  });

  return Array.from(commentsMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

export const extractJiraComments = async (
  config: JiraConfig,
  issue: JiraIssue,
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>
): Promise<Comment[]> => {
  let jiraComments: Comment[] = [];

  if (issue.renderedFields?.comment?.comments && issue.renderedFields.comment.comments.length > 0) {
    jiraComments = issue.renderedFields.comment.comments.map(comment => ({
      id: comment.id,
      author: comment.author?.displayName || 'Desconhecido',
      content: parseJiraDescriptionHTML(comment.body, config.url, jiraAttachments) || '',
      createdAt: comment.created,
      updatedAt: comment.updated,
      fromJira: true,
    }));
  } else if (issue.fields?.comment?.comments && issue.fields.comment.comments.length > 0) {
    jiraComments = issue.fields.comment.comments.map((comment: any) => ({
      id: comment.id,
      author: comment.author?.displayName || 'Desconhecido',
      content: parseJiraDescriptionHTML(comment.body, config.url, jiraAttachments) || '',
      createdAt: comment.created,
      updatedAt: comment.updated,
      fromJira: true,
    }));
  } else if (!issue.renderedFields?.comment && !issue.fields?.comment) {
    // Só busca comentários se o campo não veio na resposta inicial (expand=renderedFields,comment)
    // Quando o campo existe mas está vazio ([]), significa que a issue não tem comentários
    jiraComments = await getJiraIssueComments(config, issue.key, jiraAttachments);
  }

  return jiraComments;
};

export const jiraIssueToTaskFormData = (issue: JiraIssue, config: JiraConfig): JiraTaskFormData => {
  const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
  const isBug = taskType === 'Bug';

  let jiraAttachments: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }> = [];
  if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
    jiraAttachments = issue.fields.attachment.map((att: any) => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      created: att.created,
      author: att.author?.displayName || 'Desconhecido',
    }));
  }

  let description = '';
  if (issue.renderedFields?.description) {
    description = parseJiraDescriptionHTML(
      issue.renderedFields.description,
      config.url,
      jiraAttachments
    );
  } else if (issue.fields?.description) {
    description = parseJiraDescriptionHTML(issue.fields.description, config.url, jiraAttachments);
  }

  let assignee: 'Product' | 'QA' | 'Dev' = 'Product';
  if (issue.fields?.assignee?.emailAddress) {
    const email = issue.fields.assignee.emailAddress.toLowerCase();
    if (email.includes('qa') || email.includes('test')) {
      assignee = 'QA';
    } else if (email.includes('dev') || email.includes('developer')) {
      assignee = 'Dev';
    } else {
      assignee = 'Product';
    }
  }

  const parentId = issue.fields?.parent?.key || extractEpicLink(issue.fields) || '';

  const data: JiraTaskFormData = {
    id: issue.key || '',
    title: issue.fields?.summary || 'Sem título',
    description,
    type: taskType,
    priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
    parentId,
    owner: 'Product',
    assignee,
    tags: issue.fields?.labels || [],
  };
  if (isBug) {
    data.severity = mapJiraSeverity(issue.fields?.labels);
  }
  if (jiraAttachments.length > 0) {
    data.jiraAttachments = jiraAttachments;
  }
  return data;
};
