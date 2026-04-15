---
tag: business-rule
status: active
file_origin: services/jira/syncJiraProject.ts
aggregate: module
---

# Módulo: Sync Jira Project

**Descrição:** Agregado de `services/jira/syncJiraProject.ts` com 1 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 1

## `syncJiraProject`

**Descrição:** Regra derivada da exportação `syncJiraProject` em `services/jira/syncJiraProject.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `latestProjectFromStore`
- [ ] Avaliar condição: `latestProjectFromStore && issue.key`
- [ ] Avaliar condição: `latestTask`
- [ ] Avaliar condição: `issue.fields?.attachment && issue.fields.attachment.length > 0`
- [ ] Avaliar condição: `issue.renderedFields?.description`
- [ ] Avaliar condição: `issue.fields?.description`
- [ ] Avaliar condição: `!jiraStatusName`
- [ ] Avaliar condição: `tc.id && tc.status !== 'Not Run'`
- [ ] Avaliar condição: `existingTestCases.length > 0 && existingWithStatus > 0`
- [ ] Avaliar condição: `existingTestCases.length > 0`
- [ ] Avaliar condição: `savedTestCases.length > 0`

**Referências (trecho):**

[[Project]] [[JiraTask]] [[TestCase]]

---

**Referências (módulo):**

[[JiraTask]] [[Project]] [[TestCase]]
