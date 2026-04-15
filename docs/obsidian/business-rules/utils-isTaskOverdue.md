---
tag: business-rule
status: active
file_origin: utils/projectDashboardDeterministicMetrics.ts
---

# 0–100; 0 quando não há tarefas

**Descrição:** 0–100; 0 quando não há tarefas. */ completionPercent: number; } export interface NamedCount { name: string; value: number; fill?: string; } export interface DeliveryWeekPoint { weekKey: string; label: string; concludedCount: number; } export interface ProjectDashboardDeterministicMetrics { completion: TaskCompletionStats; overdueCount: number; countsByStatus: Record<JiraTask['status'], number>; statusDistribution: NamedCount[]; deliveryEvolution: DeliveryWeekPoint[]; /** true se pelo menos uma t

**Lógica Aplicada:**

- [ ] Avaliar condição: `!task.dueDate`

**Referências:**

[[JiraTask]]
