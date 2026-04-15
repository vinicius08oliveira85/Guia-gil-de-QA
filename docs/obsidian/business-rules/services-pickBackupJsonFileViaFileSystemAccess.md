---
tag: business-rule
status: active
file_origin: services/fileSystemBackupService.ts
---

# Indica se o ambiente suporta escolha explícita de pasta/arquivo para backup (Chr

**Descrição:** Indica se o ambiente suporta escolha explícita de pasta/arquivo para backup (Chromium, Edge). */ export function isFileSystemAccessBackupSupported(): boolean { return ( typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function' ); } function isAbortError(error: unknown): boolean { return error instanceof DOMException && error.name === 'AbortError'; } /** Exporta o backup local para um caminho escolhido pelo usuário (File Sy

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
