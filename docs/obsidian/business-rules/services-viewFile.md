---
tag: business-rule
status: active
file_origin: services/fileViewerService.ts
---

# Baixa um arquivo / export const downloadFile = ( content: string | ArrayBuffer |

**Descrição:** Baixa um arquivo / export const downloadFile = ( content: string | ArrayBuffer | Blob, fileName: string, mimeType: string ): void => { try { let blob: Blob; if (content instanceof Blob) { blob = content; } else if (content instanceof ArrayBuffer) { blob = new Blob([content], { type: mimeType }); } else if (typeof content === 'string') { if (content.startsWith('data:')) { // Converter data URL para blob const response = fetch(content); response.then(res => res.blob()).then(blob => { const url = U

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
