---
tag: business-rule
status: active
file_origin: services/metricsHistoryService.ts
---

# Obtém snapshots de um período específico / export const getMetricsForPeriod = (

**Descrição:** Obtém snapshots de um período específico / export const getMetricsForPeriod = ( project: Project, period: 'week' | 'month' | 'all' = 'week' ): MetricsSnapshot[] => { const history = project.metricsHistory || []; if (history.length === 0) return []; const now = new Date(); const cutoffDate = new Date(); switch (period) { case 'week': cutoffDate.setDate(now.getDate() - 7); break; case 'month': cutoffDate.setMonth(now.getMonth() - 1); break; case 'all': return history; } return history.filter(snaps

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[MetricsSnapshot]]
