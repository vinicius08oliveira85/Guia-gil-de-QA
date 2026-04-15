---
tag: business-rule
status: active
file_origin: services/jira/mappers.ts
---

# Extract Epic Link

**Descrição:** Regra derivada da exportação `extractEpicLink` em `services/jira/mappers.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `fields[fieldName]`
- [ ] Avaliar condição: `typeof fields[fieldName] === 'string'`
- [ ] Avaliar condição: `fields[fieldName]?.key`
- [ ] Avaliar condição: `typeof fields[key] === 'string'`
- [ ] Avaliar condição: `fields[key]?.key`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
