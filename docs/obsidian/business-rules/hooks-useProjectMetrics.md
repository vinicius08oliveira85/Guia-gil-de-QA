---
tag: business-rule
status: active
file_origin: hooks/useProjectMetrics.ts
aggregate: module
---

# Módulo: Use Project Metrics

**Descrição:** Agregado de `hooks/useProjectMetrics.ts` com 2 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 2

## `calculateProjectMetrics`

**Descrição:** Regra derivada da exportação `calculateProjectMetrics` em `hooks/useProjectMetrics.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!inProgressSet && previousPhaseCompleted`
- [ ] Avaliar condição: `phaseCompletionConditions[name]`
- [ ] Avaliar condição: `!inProgressSet && !previousPhaseCompleted`
- [ ] Avaliar condição: `inProgressSet`
- [ ] Avaliar condição: `status !== 'Concluído'`
- [ ] Avaliar condição: `!inProgressSet`
- [ ] Avaliar condição: `lastCompletedIndex < newPhases.length - 1`
- [ ] Avaliar condição: `tc.status === 'Passed'`
- [ ] Avaliar condição: `category === 'Concluído' && task.completedAt`

**Referências (trecho):**

[[Project]] [[Phase]] [[PhaseName]] [[PhaseStatus]] [[BugSeverity]]

---

## `useProjectMetrics`

**Descrição:** Regra derivada da exportação `useProjectMetrics` em `hooks/useProjectMetrics.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

**Referências (módulo):**

[[BugSeverity]] [[Phase]] [[PhaseName]] [[PhaseStatus]] [[Project]]
