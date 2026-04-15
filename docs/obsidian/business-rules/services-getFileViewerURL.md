---
tag: business-rule
status: active
file_origin: services/fileViewerService.ts
---

# Verifica se um arquivo pode ser visualizado diretamente no navegador / export co

**Descrição:** Verifica se um arquivo pode ser visualizado diretamente no navegador / export const canViewInBrowser = (fileType: FileViewerType): boolean => { return ['pdf', 'image', 'text', 'json', 'csv'].includes(fileType); }; /** Visualiza um arquivo em uma nova aba do navegador Otimizado para melhor performance / export const viewFileInNewTab = ( content: string | ArrayBuffer | Blob, fileName: string, mimeType: string, options: FileViewerOptions = {} ): void => { try { // Se for uma data URL, usar diretame

**Lógica Aplicada:**

- [ ] Avaliar condição: `content instanceof Blob`
- [ ] Avaliar condição: `content instanceof ArrayBuffer`
- [ ] Avaliar condição: `typeof content === 'string'`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
