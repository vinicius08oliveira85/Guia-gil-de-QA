---
tag: business-rule
status: active
file_origin: utils/bugAutoCreation.ts
aggregate: module
---

# Módulo: Bug Auto Creation

**Descrição:** Agregado de `utils/bugAutoCreation.ts` com 2 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 2

## `determineBugSeverity`

**Descrição:** Regra derivada da exportação `determineBugSeverity` em `utils/bugAutoCreation.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `hasCriticalTag`
- [ ] Avaliar condição: `hasHighSeverityTag`
- [ ] Avaliar condição: `task.priority === 'Urgente' || task.priority === 'Alta'`

**Referências (trecho):**

[[TestCase]] [[JiraTask]] [[BugSeverity]]

---

## `createBugFromFailedTest`

**Descrição:** Regra derivada da exportação `createBugFromFailedTest` em `utils/bugAutoCreation.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[TestCase]] [[JiraTask]]

---

**Referências (módulo):**

[[BugSeverity]] [[JiraTask]] [[TestCase]]
