---
tag: business-rule
status: active
file_origin: services/jira/metadata.ts
---

# Get Jira Fields

**Descrição:** Regra derivada da exportação `getJiraFields` em `services/jira/metadata.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!skipCache`
- [ ] Avaliar condição: `cached?.length !== undefined`
- [ ] Avaliar condição: `fields.length > 0 && !skipCache`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
