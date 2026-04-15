---
tag: business-rule
status: active
file_origin: hooks/useRouterSync.ts
---

# Sincroniza o "roteamento" da SPA (Dashboard/Projeto/Settings) com a URL via Hist

**Descrição:** Sincroniza o "roteamento" da SPA (Dashboard/Projeto/Settings) com a URL via History API. - URL -> estado: mount + popstate - estado -> URL: pushState Convenção: - Dashboard: / - Projeto: ?project=ID - Settings: ?view=settings

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
