---
tag: business-rule
status: active
file_origin: services/supabaseService.ts
---

# Load Projects From Supabase

**Descrição:** Regra derivada da exportação `loadProjectsFromSupabase` em `services/supabaseService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`
- [ ] Avaliar condição: `supabaseProxyUrl`
- [ ] Avaliar condição: `projects.length === 0`
- [ ] Avaliar condição: `isTimeout`
- [ ] Avaliar condição: `isSchemaCacheOrPaused`
- [ ] Avaliar condição: `isTransientHttp`
- [ ] Avaliar condição: `!shouldRetry || !hasMoreAttempts`
- [ ] Avaliar condição: `!data || data.length === 0`

**Referências:**

[[Project]]
