/**
 * Facade do módulo Jira: reexporta todas as funções e tipos de services/jira/
 * e injeta a dependência do store em syncJiraProject para manter compatibilidade.
 */
import * as jira from './jira';
import type { JiraConfig } from './jira';
import type { Project } from '../types';
import type { SyncJiraProjectOptions } from './jira/syncJiraProject';
import { useProjectsStore } from '../store/projectsStore';

export * from './jira';

/**
 * Sincroniza o projeto com o Jira, usando o projeto mais recente do store quando disponível.
 * (Wrapper que injeta getLatestProject para o módulo jira não depender do store.)
 * Retorna o projeto sincronizado e metadados de erro granular.
 */
export async function syncJiraProject(
  config: JiraConfig,
  project: Project,
  jiraProjectKey: string,
  options?: SyncJiraProjectOptions
): Promise<import('./jira/syncJiraProject').SyncJiraProjectResult> {
  return jira.syncJiraProject(config, project, jiraProjectKey, () =>
    useProjectsStore.getState().projects.find(p => p.id === project.id),
    options
  );
}
