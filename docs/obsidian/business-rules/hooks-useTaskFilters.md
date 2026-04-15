---
tag: business-rule
status: active
file_origin: hooks/useTaskFilters.ts
aggregate: module
---

# Módulo: Use Task Filters

**Descrição:** Agregado de `hooks/useTaskFilters.ts` com 1 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 1

## `useTaskFilters`

**Descrição:** Regra derivada da exportação `useTaskFilters` em `hooks/useTaskFilters.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!project?.id`
- [ ] Avaliar condição: `data && typeof data === 'object'`
- [ ] Avaliar condição: `typeof data.searchQuery === 'string'`
- [ ] Avaliar condição: `navKey <= 0 || navKey === lastExecutionStatusNavKeyRef.current`
- [ ] Avaliar condição: `statuses && statuses.length > 0`
- [ ] Avaliar condição: `!project?.id || filtersRestoredForProjectRef.current !== project.id`
- [ ] Avaliar condição: `debouncedSearchQuery`
- [ ] Avaliar condição: `!matchesId && !matchesTitle`
- [ ] Avaliar condição: `qualityFilter.length > 0`
- [ ] Avaliar condição: `!matchesQuality`

**Referências (trecho):**

[[Project]] [[TaskTestStatus]]

---

**Referências (módulo):**

[[Project]] [[TaskTestStatus]]
