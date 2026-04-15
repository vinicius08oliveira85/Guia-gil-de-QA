---
tag: business-rule
status: active
file_origin: services/fileViewerService.ts
---

# Detecta o tipo de arquivo baseado no nome e tipo MIME / export const detectFileT

**Descrição:** Detecta o tipo de arquivo baseado no nome e tipo MIME / export const detectFileType = (fileName: string, mimeType?: string): FileViewerType => { const lowerName = fileName.toLowerCase(); if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') { return 'pdf'; } if (mimeType?.startsWith('image/') || lowerName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) { return 'image'; } if (mimeType?.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) { return 'text'; } if 

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
