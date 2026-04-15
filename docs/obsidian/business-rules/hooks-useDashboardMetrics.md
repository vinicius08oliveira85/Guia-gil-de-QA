---
tag: business-rule
status: active
file_origin: hooks/useDashboardMetrics.ts
---

# Fatia para gráfico de pizza (Recharts)

**Descrição:** Fatia para gráfico de pizza (Recharts). */ export interface DashboardPieSlice { name: string; value: number; fill: string; } /** Linha para gráfico de barras por membro (Recharts). */ export interface DashboardMemberBarRow { name: string; value: number; fill: string; } export interface DashboardMetrics { totalTasks: number; completedTasks: number; overdueTasks: number; /** Percentual de tarefas concluídas (0–100). */ efficiencyPercent: number; /** Status com contagem maior que zero, com cores do

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
