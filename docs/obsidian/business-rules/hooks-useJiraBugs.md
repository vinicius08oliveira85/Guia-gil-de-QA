---
tag: business-rule
status: active
file_origin: hooks/useJiraBugs.ts
---

# Hook para buscar e sincronizar bugs do Jira

**Descrição:** Hook para buscar e sincronizar bugs do Jira

**Lógica Aplicada:**

- [ ] Avaliar condição: `!projectKey`
- [ ] Avaliar condição: `updatedBugs.length > 0 || newBugs.length > 0`
- [ ] Avaliar condição: `updatedBugs.length > 0`
- [ ] Avaliar condição: `newBugs.length > 0`

**Referências:**

[[Project]]
