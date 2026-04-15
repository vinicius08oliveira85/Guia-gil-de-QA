---
tag: business-rule
status: active
file_origin: hooks/useFilters.ts
---

# Use Filters

**Descrição:** Regra derivada da exportação `useFilters` em `hooks/useFilters.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `filters.status && filters.status.length > 0`
- [ ] Avaliar condição: `filters.type && filters.type.length > 0`
- [ ] Avaliar condição: `filters.tags && filters.tags.length > 0`
- [ ] Avaliar condição: `filters.priority && filters.priority.length > 0`
- [ ] Avaliar condição: `filters.severity && filters.severity.length > 0`
- [ ] Avaliar condição: `filters.owner && filters.owner.length > 0`
- [ ] Avaliar condição: `filters.assignee && filters.assignee.length > 0`
- [ ] Avaliar condição: `filters.dateRange`
- [ ] Avaliar condição: `filters.dateRange.start`
- [ ] Avaliar condição: `!t.createdAt`
- [ ] Avaliar condição: `filters.dateRange.end`
- [ ] Avaliar condição: `!t.createdAt`

**Referências:**

[[Project]]
