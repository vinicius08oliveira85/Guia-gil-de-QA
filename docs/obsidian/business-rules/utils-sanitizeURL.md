---
tag: business-rule
status: active
file_origin: utils/sanitize.ts
---

# Sanitiza HTML para prevenir XSS attacks / export const sanitizeHTML = (dirty: st

**Descrição:** Sanitiza HTML para prevenir XSS attacks / export const sanitizeHTML = (dirty: string): string => { return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [ 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', ], ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'], ALLOW_DATA_ATTR: true, // Permitir data URIs para imagens }); }; /** Sanitiza e valida URLs antes de usar

**Lógica Aplicada:**

- [ ] Avaliar condição: `parsed.protocol === 'http:' || parsed.protocol === 'https:'`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
