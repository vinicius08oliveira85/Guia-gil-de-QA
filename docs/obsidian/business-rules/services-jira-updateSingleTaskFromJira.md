---
tag: business-rule
status: active
file_origin: services/jira/taskSync.ts
---

# Atualiza uma única tarefa do projeto com os dados atuais do Jira (por ID)

**Descrição:** Atualiza uma única tarefa do projeto com os dados atuais do Jira (por ID).

**Lógica Aplicada:**

- [ ] Avaliar condição: `issue.fields?.attachment?.length`
- [ ] Avaliar condição: `issue.renderedFields?.description`
- [ ] Avaliar condição: `issue.fields?.description`
- [ ] Avaliar condição: `existingTestCases.length > 0 && existingWithStatus > 0`
- [ ] Avaliar condição: `issue.fields?.assignee?.emailAddress`
- [ ] Avaliar condição: `existingTask`

**Referências:**

[[Project]] [[TestCase]] [[JiraTask]]
