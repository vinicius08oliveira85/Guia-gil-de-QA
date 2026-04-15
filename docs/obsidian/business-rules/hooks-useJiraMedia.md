---
tag: business-rule
status: active
file_origin: hooks/useJiraMedia.ts
---

# Estado do carregamento de mídia / export interface JiraMediaState { objectUrl: s

**Descrição:** Estado do carregamento de mídia / export interface JiraMediaState { objectUrl: string | null; thumbnailUrl: string | null; loading: boolean; error: string | null; mediaInfo: JiraMediaInfo | null; loadingThumbnail: boolean; } /** Hook para gerenciar mídia do Jira de forma segura Abstrai a lógica de resolução de URLs, autenticação e cache

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
