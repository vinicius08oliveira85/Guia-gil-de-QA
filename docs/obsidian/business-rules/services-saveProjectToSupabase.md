---
tag: business-rule
status: active
file_origin: services/supabaseService.ts
---

# Save Project To Supabase

**Descrição:** Regra derivada da exportação `saveProjectToSupabase` em `services/supabaseService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`
- [ ] Avaliar condição: `existingSave`
- [ ] Avaliar condição: `latestProject && latestProject !== project`
- [ ] Avaliar condição: `latestProject && latestProject !== project`
- [ ] Avaliar condição: `useProxyFirst && supabaseProxyUrl`
- [ ] Avaliar condição: `!supabaseProxyUrl`
- [ ] Avaliar condição: `supabaseProxyUrl`
- [ ] Avaliar condição: `sdkAlreadyFailedWith403 || !supabase`
- [ ] Avaliar condição: `!supabase && !supabaseProxyUrl`
- [ ] Avaliar condição: `latestProject === project`

**Referências:**

[[Project]]
