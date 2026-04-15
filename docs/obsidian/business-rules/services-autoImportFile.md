---
tag: business-rule
status: active
file_origin: services/fileImportService.ts
---

# Importa um documento genérico (PDF, Word, Excel, imagem, etc

**Descrição:** Importa um documento genérico (PDF, Word, Excel, imagem, etc.) / export const importDocument = async (file: File): Promise<ImportResult<ProjectDocument>> => { try { validateFileSize(file); const isImage = file.type.startsWith('image/'); const isText = file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'text/csv'; let content: string; if (isImage) { // Converter imagem para base64 const arrayBuffer = await file.arrayBuffer(); const bytes = new Uint8Array(arrayBuffe

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
