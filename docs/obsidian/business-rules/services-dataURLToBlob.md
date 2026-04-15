---
tag: business-rule
status: active
file_origin: services/fileViewerService.ts
---

# Verifica se um arquivo pode ser visualizado diretamente no navegador / export co

**Descrição:** Verifica se um arquivo pode ser visualizado diretamente no navegador / export const canViewInBrowser = (fileType: FileViewerType): boolean => { return ['pdf', 'image', 'text', 'json', 'csv'].includes(fileType); }; /** Visualiza um arquivo em uma nova aba do navegador Otimizado para melhor performance / export const viewFileInNewTab = ( content: string | ArrayBuffer | Blob, fileName: string, mimeType: string, options: FileViewerOptions = {} ): void => { try { // Se for uma data URL, usar diretame

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
