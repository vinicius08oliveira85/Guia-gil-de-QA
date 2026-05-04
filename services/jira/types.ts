/** Tipos e constantes do módulo Jira. */

export interface JiraConfig {
  url: string;
  email: string;
  apiToken: string;
}

/** Chaves de Epic Link conhecidas; ao montar jiraCustomFields excluímos só estas (não qualquer campo com "epic" no nome). */
export const EPIC_LINK_FIELD_KEYS = ['epicLink', 'epic', 'customfield_10011', 'customfield_10014'];

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
    [key: string]: any;
  };
  renderedFields?: {
    description?: string;
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

export const JIRA_CONFIG_KEY = 'jira_config';
export const JIRA_LAST_URL_KEY = 'jira_last_url';

/** Lista de campos do Jira (GET /rest/api/3/field). */
export interface JiraFieldInfo {
  id: string;
  name: string;
  custom?: boolean;
}

export interface GetJiraFieldsOptions {
  skipCache?: boolean;
}

/** Opção de um custom field do tipo select no Jira. */
export interface JiraCustomFieldOption {
  id: string;
  value: string;
  disabled?: boolean;
}

/** Formato dos dados do formulário de tarefa (TaskForm) para preenchimento após importação do Jira */
export interface JiraTaskFormData {
  id: string;
  title: string;
  description: string;
  type: 'Epic' | 'História' | 'Tarefa' | 'Bug';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  parentId: string;
  owner: 'Product' | 'QA' | 'Dev';
  assignee: 'Product' | 'QA' | 'Dev';
  tags: string[];
  severity?: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>;
}
