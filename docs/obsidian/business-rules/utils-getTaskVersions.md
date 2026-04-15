---
tag: business-rule
status: active
file_origin: utils/tagService.ts
---

# Extrai tags de versão de uma tarefa (formato V1, V2, V3, etc

**Descrição:** Extrai tags de versão de uma tarefa (formato V1, V2, V3, etc.)

**Lógica Aplicada:**

- [ ] Avaliar condição: `!task.tags || task.tags.length === 0`

**Referências:**

[[JiraTask]]
