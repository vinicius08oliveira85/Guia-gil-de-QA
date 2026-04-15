---
tag: business-rule
status: active
file_origin: services/jira/metadata.ts
---

# Get Jira Custom Field Options

**Descrição:** Regra derivada da exportação `getJiraCustomFieldOptions` em `services/jira/metadata.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `cached?.length !== undefined`
- [ ] Avaliar condição: `!contextId`
- [ ] Avaliar condição: `v?.id != null && v?.value != null`
- [ ] Avaliar condição: `allOptions.length > 0`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
