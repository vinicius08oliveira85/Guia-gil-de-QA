---
tag: business-rule
status: active
file_origin: utils/workspaceAnalytics.ts
---

# Métricas agregadas de casos de teste em todos os projetos

**Descrição:** Métricas agregadas de casos de teste em todos os projetos. */ export interface WorkspaceTestMetrics { totalTestCases: number; passedTestCases: number; /** Casos com status diferente de `Not Run`. */ executedTestCases: number; /** (Passed / Total) * 100 — 0 se não houver casos. */ testSuccessPercent: number; /** (Executados / Total) * 100 — 0 se não houver casos. */ executionEfficiencyPercent: number; } /** Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes. / ex

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
