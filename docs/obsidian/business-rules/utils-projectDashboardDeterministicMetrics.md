---
tag: business-rule
status: active
file_origin: utils/projectDashboardDeterministicMetrics.ts
aggregate: module
---

# Módulo: Project Dashboard Deterministic Metrics

**Descrição:** Agregado de `utils/projectDashboardDeterministicMetrics.ts` com 3 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 3

## `isTaskOverdue`

**Descrição:** 0–100; 0 quando não há tarefas. */ completionPercent: number; } export interface NamedCount { name: string; value: number; fill?: string; } export interface DeliveryWeekPoint { weekKey: string; label: string; concludedCount: number; } export interface ProjectDashboardDeterministicMetrics { completion: TaskCompletionStats; overdueCount: number; countsByStatus: Record<JiraTask['status'], number>; statusDistribution: NamedCount[]; deliveryEvolution: DeliveryWeekPoint[]; /** true se pelo menos uma t

**Lógica Aplicada:**

- [ ] Avaliar condição: `!task.dueDate`

**Referências (trecho):**

[[JiraTask]]

---

## `computeTaskCompletionStats`

**Descrição:** Regra derivada da exportação `computeTaskCompletionStats` em `utils/projectDashboardDeterministicMetrics.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

## `computeProjectDashboardDeterministicMetrics`

**Descrição:** Regra derivada da exportação `computeProjectDashboardDeterministicMetrics` em `utils/projectDashboardDeterministicMetrics.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

**Referências (módulo):**

[[JiraTask]]
