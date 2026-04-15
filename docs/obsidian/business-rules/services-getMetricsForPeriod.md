---
tag: business-rule
status: active
file_origin: services/metricsHistoryService.ts
---

# Salva um snapshot das métricas atuais no histórico do projeto / export const sav

**Descrição:** Salva um snapshot das métricas atuais no histórico do projeto / export const saveMetricsSnapshot = (project: Project, snapshot: MetricsSnapshot): Project => { const history = project.metricsHistory || []; // Verificar se já existe snapshot para o mesmo dia (usar apenas data, sem hora) const snapshotDate = new Date(snapshot.date).toISOString().split('T')[0]; const existingIndex = history.findIndex( s => new Date(s.date).toISOString().split('T')[0] === snapshotDate ); const updatedHistory = existi

**Lógica Aplicada:**

- [ ] Avaliar condição: `history.length === 0`

**Referências:**

[[Project]] [[MetricsSnapshot]]
