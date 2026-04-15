---
tag: business-rule
status: active
file_origin: hooks/useAutoSave.ts
aggregate: module
---

# Módulo: Use Auto Save

**Descrição:** Agregado de `hooks/useAutoSave.ts` com 1 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 1

## `useAutoSave`

**Descrição:** Tempo de debounce em ms antes de salvar após mudanças não críticas Mudanças críticas (status, análises) são salvas imediatamente / debounceMs?: number; /** Se true, desabilita o auto-save (útil para desabilitar temporariamente) / disabled?: boolean; } /** Hook que monitora mudanças no projeto e persiste automaticamente no IndexedDB. A nuvem (Supabase) só é atualizada quando o usuário usa o botão Salvar / sincronização explícita. Mudanças críticas são persistidas localmente imediatamente; demais 

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

**Referências (módulo):**

_Nenhuma entidade tipada agregada._
