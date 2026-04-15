---
tag: business-rule
status: active
file_origin: services/ai/sdlcPhaseAnalysisService.ts
---

# Gera análise de fase SDLC com IA / export async function generateSDLCPhaseAnalys

**Descrição:** Gera análise de fase SDLC com IA / export async function generateSDLCPhaseAnalysis(project: Project): Promise<SDLCPhaseAnalysis> { const snapshot = createPhaseSnapshot(project); const snapshotHash = hashString(snapshot); const cacheKey = `sdlc-phase-analysis:${project.id}`; // Verificar cache const cached = analysisCache.get(cacheKey); if (cached && cached.snapshotHash === snapshotHash && cached.expiresAt > Date.now()) { return cached.analysis; } const metrics = calculateProjectMetrics(project);

**Lógica Aplicada:**

- [ ] Avaliar condição: `project.sdlcPhaseAnalysis`
- [ ] Avaliar condição: `!cached || cached.snapshotHash !== currentHash`

**Referências:**

[[Project]]
