---
tag: business-rule
status: active
file_origin: services/fileImportService.ts
---

# Valida o tamanho do arquivo / const validateFileSize = (file: File, maxSize: num

**Descrição:** Valida o tamanho do arquivo / const validateFileSize = (file: File, maxSize: number = MAX_DOCUMENT_SIZE): void => { if (file.size > maxSize) { throw new Error(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`); } if (file.size === 0) { throw new Error('Arquivo vazio'); } }; /** Valida o tipo de arquivo / const validateFileType = (file: File, allowedTypes: string[]): void => { const isValidType = allowedTypes.some(type => file.type.includes(type) || file.name.toLower

**Lógica Aplicada:**

- [ ] Avaliar condição: `!projectData.id || !projectData.name`

**Referências:**

[[Project]]
