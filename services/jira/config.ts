import type { JiraConfig } from './types';
import { JIRA_CONFIG_KEY, JIRA_LAST_URL_KEY } from './types';
import { jiraApiCall } from './api';
import { logger } from '../../utils/logger';

export const saveJiraConfig = (config: JiraConfig): void => {
  localStorage.setItem(JIRA_CONFIG_KEY, JSON.stringify(config));
  if (config.url?.trim()) {
    localStorage.setItem(JIRA_LAST_URL_KEY, config.url.trim());
  }
};

export const getJiraConfig = (): JiraConfig | null => {
  const stored = localStorage.getItem(JIRA_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getJiraLastUrl = (): string => {
  return localStorage.getItem(JIRA_LAST_URL_KEY) ?? '';
};

export const setJiraLastUrl = (url: string): void => {
  const trimmed = url?.trim() ?? '';
  if (trimmed) {
    localStorage.setItem(JIRA_LAST_URL_KEY, trimmed);
  }
};

export const deleteJiraConfig = (): void => {
  localStorage.removeItem(JIRA_CONFIG_KEY);
};

export const testJiraConnection = async (config: JiraConfig): Promise<boolean> => {
  try {
    await jiraApiCall(config, 'myself');
    return true;
  } catch (error) {
    logger.error('Jira connection test failed', 'jiraService', error);
    return false;
  }
};
