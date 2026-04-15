---
tag: business-rule
status: active
file_origin: services/jira/mappers.ts
---

# Jira Issue To Task Form Data

**Descrição:** Regra derivada da exportação `jiraIssueToTaskFormData` em `services/jira/mappers.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `issue.fields?.attachment && issue.fields.attachment.length > 0`
- [ ] Avaliar condição: `issue.renderedFields?.description`
- [ ] Avaliar condição: `issue.fields?.description`
- [ ] Avaliar condição: `issue.fields?.assignee?.emailAddress`
- [ ] Avaliar condição: `jiraAttachments.length > 0`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
