---
tag: business-rule
status: active
file_origin: hooks/useProjectMetrics.ts
---

# Calculate Project Metrics

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

**Referências:**

[[Project]] [[Phase]] [[PhaseName]] [[PhaseStatus]] [[BugSeverity]]
