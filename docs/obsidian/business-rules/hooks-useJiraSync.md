---
tag: business-rule
status: active
file_origin: hooks/useJiraSync.ts
---

# Use Jira Sync

**Descrição:** Regra derivada da exportação `useJiraSync` em `hooks/useJiraSync.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!project?.tasks?.length`
- [ ] Avaliar condição: `finalProjectFromStore`
- [ ] Avaliar condição: `missingTaskIds.length > 0`
- [ ] Avaliar condição: `linkedTaskIds.size > 0`
- [ ] Avaliar condição: `latestProjectAfterSync`
- [ ] Avaliar condição: `tc.id && tc.status !== 'Not Run'`
- [ ] Avaliar condição: `storeStatus && tc.status === 'Not Run'`
- [ ] Avaliar condição: `statusPerdidos > 0`
- [ ] Avaliar condição: `newTasks.length > 0`
- [ ] Avaliar condição: `updatedTasks.length > 0`
- [ ] Avaliar condição: `messages.length > 0`
- [ ] Avaliar condição: `!jiraProjectKey`

**Referências:**

[[Project]] [[TestCase]]
