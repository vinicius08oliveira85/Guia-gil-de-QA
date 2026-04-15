---
tag: business-rule
status: active
file_origin: services/supabaseService.ts
---

# Deleta um projeto do Supabase Não lança erro - apenas loga aviso se falhar / exp

**Descrição:** Deleta um projeto do Supabase Não lança erro - apenas loga aviso se falhar / export const deleteProjectFromSupabase = async (projectId: string): Promise<void> => { if (forceLocalOnly) { return; } if (supabaseProxyUrl) { try { const userId = await getUserId(); await callSupabaseProxy('DELETE', { body: { projectId, userId } }, requestTimeoutMs); // Timeout de 5 segundos logger.info(`Projeto ${projectId} removido via proxy Supabase`, 'supabaseService'); return; } catch (error) { if (isCorsError(err

**Lógica Aplicada:**

- [ ] Avaliar condição: `validKeys.length === 0`
- [ ] Avaliar condição: `projects.length === 0`
- [ ] Avaliar condição: `!project.tasks || project.tasks.length === 0`
- [ ] Avaliar condição: `testCases.length > 0`

**Referências:**

[[TestCase]]
