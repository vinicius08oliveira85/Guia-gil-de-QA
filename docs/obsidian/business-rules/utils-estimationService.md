---
tag: business-rule
status: active
file_origin: utils/estimationService.ts
aggregate: module
---

# Módulo: Estimation Service

**Descrição:** Agregado de `utils/estimationService.ts` com 4 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 4

## `calculateTaskEstimation`

**Descrição:** Regra derivada da exportação `calculateTaskEstimation` em `utils/estimationService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!task.estimatedHours`

**Referências (trecho):**

[[JiraTask]]

---

## `calculateProjectEstimations`

**Descrição:** Regra derivada da exportação `calculateProjectEstimations` em `utils/estimationService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `estimateTaskComplexity`

**Descrição:** Regra derivada da exportação `estimateTaskComplexity` em `utils/estimationService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.type === 'Epic'`
- [ ] Avaliar condição: `task.type === 'História'`
- [ ] Avaliar condição: `task.type === 'Bug'`
- [ ] Avaliar condição: `testCasesCount > 10`
- [ ] Avaliar condição: `testCasesCount > 5`
- [ ] Avaliar condição: `bddScenariosCount > 5`
- [ ] Avaliar condição: `hasDependencies`
- [ ] Avaliar condição: `complexity >= 5`
- [ ] Avaliar condição: `complexity >= 3`
- [ ] Avaliar condição: `complexity >= 2`

**Referências (trecho):**

[[JiraTask]]

---

## `suggestEstimation`

**Descrição:** Regra derivada da exportação `suggestEstimation` em `utils/estimationService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `testCasesCount > 0`

**Referências (trecho):**

[[JiraTask]]

---

**Referências (módulo):**

[[JiraTask]] [[Project]]
