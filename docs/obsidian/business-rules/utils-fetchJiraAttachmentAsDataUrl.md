---
tag: business-rule
status: active
file_origin: utils/jiraAttachmentFetch.ts
---

# Busca o conteúdo de um anexo do Jira via proxy e retorna como data URL (para exi

**Descrição:** Busca o conteúdo de um anexo do Jira via proxy e retorna como data URL (para exibir em img, etc.). Retorna null se não houver config Jira ou se o fetch falhar.

**Lógica Aplicada:**

- [ ] Avaliar condição: `!jiraConfig`
- [ ] Avaliar condição: `!response.ok`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
