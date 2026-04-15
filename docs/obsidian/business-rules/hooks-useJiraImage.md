---
tag: business-rule
status: active
file_origin: hooks/useJiraImage.ts
---

# Hook para gerenciar o carregamento autenticado de imagens do Jira

**Descrição:** Hook para gerenciar o carregamento autenticado de imagens do Jira. Resolve problemas de CORS e Autenticação convertendo a resposta em Blob URL. Usa proxy do Jira quando necessário para autenticação.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!url || !isImage`
- [ ] Avaliar condição: `shouldUseProxy`
- [ ] Avaliar condição: `!response.ok`
- [ ] Avaliar condição: `!response.ok`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
