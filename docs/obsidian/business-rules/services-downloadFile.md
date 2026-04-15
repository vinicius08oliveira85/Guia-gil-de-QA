---
tag: business-rule
status: active
file_origin: services/fileViewerService.ts
---

# Detecta o tipo de arquivo baseado no nome e tipo MIME / export const detectFileT

**Descrição:** Detecta o tipo de arquivo baseado no nome e tipo MIME / export const detectFileType = (fileName: string, mimeType?: string): FileViewerType => { const lowerName = fileName.toLowerCase(); if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') { return 'pdf'; } if (mimeType?.startsWith('image/') || lowerName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) { return 'image'; } if (mimeType?.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) { return 'text'; } if 

**Lógica Aplicada:**

- [ ] Avaliar condição: `content instanceof Blob`
- [ ] Avaliar condição: `content instanceof ArrayBuffer`
- [ ] Avaliar condição: `typeof content === 'string'`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
