---
tag: business-rule
status: active
file_origin: services/jira/taskSync.ts
---

# Sync Task To Jira

**Descrição:** Regra derivada da exportação `syncTaskToJira` em `services/jira/taskSync.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!jiraKeyMatch`
- [ ] Avaliar condição: `task.dueDate`
- [ ] Avaliar condição: `task.timeTracking`
- [ ] Avaliar condição: `task.timeTracking.originalEstimate`
- [ ] Avaliar condição: `task.timeTracking.remainingEstimate`
- [ ] Avaliar condição: `task.timeTracking.timeSpent`
- [ ] Avaliar condição: `task.environment !== undefined`
- [ ] Avaliar condição: `task.components && task.components.length > 0`
- [ ] Avaliar condição: `task.fixVersions && task.fixVersions.length > 0`
- [ ] Avaliar condição: `task.jiraCustomFields`
- [ ] Avaliar condição: `value === null || value === undefined`
- [ ] Avaliar condição: `typeof value === 'object' && value !== null`

**Referências:**

[[JiraTask]]
