---
tag: business-rule
status: active
file_origin: services/ai/documentContextService.ts
---

# Carrega o contexto do documento de especificação processado do projeto Usa cache

**Descrição:** Carrega o contexto do documento de especificação processado do projeto Usa cache em memória para melhor performance / export async function getDocumentContext(project: Project | null): Promise<string | null> { if (!project) { return null; } const projectId = project.id; // Se já temos o contexto em cache para este projeto, retornar diretamente if (cacheInitialized.has(projectId) && contextCache.has(projectId)) { return contextCache.get(projectId) || null; } try { const content = loadProcessedDoc

**Lógica Aplicada:**

- [ ] Avaliar condição: `projectId`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
