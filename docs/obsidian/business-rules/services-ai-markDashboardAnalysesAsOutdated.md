---
tag: business-rule
status: active
file_origin: services/ai/dashboardAnalysisService.ts
---

# Gera análise de visão geral do dashboard / export async function generateDashboa

**Descrição:** Gera análise de visão geral do dashboard / export async function generateDashboardOverviewAnalysis(project: Project): Promise<DashboardOverviewAnalysis> { const snapshot = createProjectSnapshot(project); const snapshotHash = hashString(snapshot); const cacheKey = `dashboard-overview:${project.id}`; // Verificar cache const cached = analysisCache.get(cacheKey); if (cached && cached.snapshotHash === snapshotHash && cached.expiresAt > Date.now()) { return cached.analysis as DashboardOverviewAnalysi

**Lógica Aplicada:**

- [ ] Avaliar condição: `project.dashboardOverviewAnalysis`
- [ ] Avaliar condição: `!cached || cached.snapshotHash !== currentHash`

**Referências:**

[[Project]]
