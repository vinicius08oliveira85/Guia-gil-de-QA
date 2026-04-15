---
tag: business-rule
status: active
file_origin: services/fileImportService.ts
---

# Valida o tamanho do arquivo / const validateFileSize = (file: File, maxSize: num

**Descrição:** Valida o tamanho do arquivo / const validateFileSize = (file: File, maxSize: number = MAX_DOCUMENT_SIZE): void => { if (file.size > maxSize) { throw new Error(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`); } if (file.size === 0) { throw new Error('Arquivo vazio'); } }; /** Valida o tipo de arquivo / const validateFileType = (file: File, allowedTypes: string[]): void => { const isValidType = allowedTypes.some(type => file.type.includes(type) || file.name.toLower

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
