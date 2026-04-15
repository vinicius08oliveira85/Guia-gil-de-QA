---
tag: business-rule
status: active
file_origin: services/taskTestStatusService.ts
---

# Carrega o status de teste de uma task do Supabase / export const loadTaskTestSta

**Descrição:** Carrega o status de teste de uma task do Supabase / export const loadTaskTestStatus = async (taskKey: string): Promise<TaskTestStatus | null> => { if (forceLocalOnly) { return null; } if (isSupabaseRemotePaused()) { return null; } const hasProxy = Boolean(supabaseProxyUrl); const hasSdk = Boolean(supabase); // Preferir proxy quando configurado (evita 403 por RLS no browser) if (hasProxy) { try { return await loadThroughProxy(taskKey); } catch (error) { // Em produção, evitar fallback para SDK di

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`

**Referências:**

[[TaskTestStatus]]
