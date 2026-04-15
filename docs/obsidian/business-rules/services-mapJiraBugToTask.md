---
tag: business-rule
status: active
file_origin: services/jiraBugsService.ts
---

# Busca bugs do Jira para um projeto específico / export const fetchBugsFromJira =

**Descrição:** Busca bugs do Jira para um projeto específico / export const fetchBugsFromJira = async ( config: JiraConfig, projectKey: string, maxResults: number = 100 ): Promise<JiraIssue[]> => { try { logger.debug(`Buscando bugs do projeto ${projectKey}`, 'JiraBugsService'); // Buscar todas as issues e filtrar apenas bugs const allIssues = await getJiraIssues(config, projectKey, maxResults * 2); // Buscar mais para garantir que temos bugs suficientes // Filtrar apenas bugs não resolvidos const bugs = allIss

**Lógica Aplicada:**

- [ ] Avaliar condição: `!priority`

**Referências:**

[[JiraTask]] [[BugSeverity]]
