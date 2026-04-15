---
tag: business-rule
status: active
file_origin: utils/workspaceAnalytics.ts
---

# Métricas agregadas de casos de teste em todos os projetos

**Descrição:** Métricas agregadas de casos de teste em todos os projetos. */ export interface WorkspaceTestMetrics { totalTestCases: number; passedTestCases: number; /** Casos com status diferente de `Not Run`. */ executedTestCases: number; /** (Passed / Total) * 100 — 0 se não houver casos. */ testSuccessPercent: number; /** (Executados / Total) * 100 — 0 se não houver casos. */ executionEfficiencyPercent: number; } /** Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes.

**Lógica Aplicada:**

- [ ] Avaliar condição: `tc.status === 'Passed'`
- [ ] Avaliar condição: `tc.status !== 'Not Run'`

**Referências:**

[[Project]]
