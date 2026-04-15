---
tag: business-rule
status: active
file_origin: utils/jiraDescriptionParser.ts
---

# Utilitário para converter descrições do Jira (ADF - Atlassian Document Format) p

**Descrição:** Utilitário para converter descrições do Jira (ADF - Atlassian Document Format) para texto/HTML / import { marked } from 'marked'; import { sanitizeHTML } from './sanitize'; import { JiraContentSanitizer } from './jiraContentSanitizer'; /** Profundidade máxima de recursão para conversão ADF — evita stack overflow com dados aninhados. */ const MAX_ADF_DEPTH = 50; /** Converte texto simples (markdown-like) em HTML sanitizado, estilo Jira (parágrafos, listas, negrito). */ function plainTextToHtml(te

**Lógica Aplicada:**

- [ ] Avaliar condição: `!description`
- [ ] Avaliar condição: `typeof description === 'string'`
- [ ] Avaliar condição: `typeof description === 'object'`
- [ ] Avaliar condição: `description.type`
- [ ] Avaliar condição: `description.content`
- [ ] Avaliar condição: `description.html`
- [ ] Avaliar condição: `description.text`
- [ ] Avaliar condição: `depth >= MAX_ADF_DEPTH`
- [ ] Avaliar condição: `node.text`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
