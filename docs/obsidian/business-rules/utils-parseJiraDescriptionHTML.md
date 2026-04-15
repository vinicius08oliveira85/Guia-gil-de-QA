---
tag: business-rule
status: active
file_origin: utils/jiraDescriptionParser.ts
---

# Converte descrição do Jira para HTML preservando formatação rica Suporta string

**Descrição:** Converte descrição do Jira para HTML preservando formatação rica Suporta string HTML renderizada, objeto ADF, ou array de objetos ADF Retorna HTML sanitizado pronto para renderização

**Lógica Aplicada:**

- [ ] Avaliar condição: `!description`
- [ ] Avaliar condição: `depth >= MAX_ADF_DEPTH`
- [ ] Avaliar condição: `typeof description === 'string'`
- [ ] Avaliar condição: `typeof description === 'object'`
- [ ] Avaliar condição: `description.type`
- [ ] Avaliar condição: `description.content`
- [ ] Avaliar condição: `description.html`
- [ ] Avaliar condição: `description.text`
- [ ] Avaliar condição: `html && jiraUrl && jiraAttachments && jiraAttachments.length > 0`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
