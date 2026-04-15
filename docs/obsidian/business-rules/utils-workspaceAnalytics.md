---
tag: business-rule
status: active
file_origin: utils/workspaceAnalytics.ts
aggregate: module
---

# Módulo: Workspace Analytics

**Descrição:** Agregado de `utils/workspaceAnalytics.ts` com 5 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 5

## `computeWorkspaceTestMetrics`

**Descrição:** Métricas agregadas de casos de teste em todos os projetos. */ export interface WorkspaceTestMetrics { totalTestCases: number; passedTestCases: number; /** Casos com status diferente de `Not Run`. */ executedTestCases: number; /** (Passed / Total) * 100 — 0 se não houver casos. */ testSuccessPercent: number; /** (Executados / Total) * 100 — 0 se não houver casos. */ executionEfficiencyPercent: number; } /** Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes.

**Lógica Aplicada:**

- [ ] Avaliar condição: `tc.status === 'Passed'`
- [ ] Avaliar condição: `tc.status !== 'Not Run'`

**Referências (trecho):**

[[Project]]

---

## `computeTaskWorkflowBuckets`

**Descrição:** Regra derivada da exportação `computeTaskWorkflowBuckets` em `utils/workspaceAnalytics.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `s === 'Done'`
- [ ] Avaliar condição: `s === 'To Do'`

**Referências (trecho):**

[[Project]]

---

## `computeTaskDonePercent`

**Descrição:** Métricas agregadas de casos de teste em todos os projetos. */ export interface WorkspaceTestMetrics { totalTestCases: number; passedTestCases: number; /** Casos com status diferente de `Not Run`. */ executedTestCases: number; /** (Passed / Total) * 100 — 0 se não houver casos. */ testSuccessPercent: number; /** (Executados / Total) * 100 — 0 se não houver casos. */ executionEfficiencyPercent: number; } /** Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes. / ex

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `computeProjectsWithTestExecutionAlerts`

**Descrição:** Métricas agregadas de casos de teste em todos os projetos. */ export interface WorkspaceTestMetrics { totalTestCases: number; passedTestCases: number; /** Casos com status diferente de `Not Run`. */ executedTestCases: number; /** (Passed / Total) * 100 — 0 se não houver casos. */ testSuccessPercent: number; /** (Executados / Total) * 100 — 0 se não houver casos. */ executionEfficiencyPercent: number; } /** Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes. / ex

**Lógica Aplicada:**

- [ ] Avaliar condição: `tc.status === 'Failed' || tc.status === 'Blocked'`

**Referências (trecho):**

[[Project]]

---

## `computePhaseCompletionPercent`

**Descrição:** Métricas agregadas de casos de teste em todos os projetos. */ export interface WorkspaceTestMetrics { totalTestCases: number; passedTestCases: number; /** Casos com status diferente de `Not Run`. */ executedTestCases: number; /** (Passed / Total) * 100 — 0 se não houver casos. */ testSuccessPercent: number; /** (Executados / Total) * 100 — 0 se não houver casos. */ executionEfficiencyPercent: number; } /** Agrega contagens de casos de teste com defensiva para `tasks` / `testCases` ausentes. / ex

**Lógica Aplicada:**

- [ ] Avaliar condição: `phases.length === 0`

**Referências (trecho):**

[[Project]]

---

**Referências (módulo):**

[[Project]]
