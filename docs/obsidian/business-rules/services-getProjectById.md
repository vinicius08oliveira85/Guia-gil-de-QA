---
tag: business-rule
status: active
file_origin: services/dbService.ts
---

# Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB)

**Descrição:** Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB). */ export const BACKUP_EXPORT_FORMAT_VERSION = 1; let db: IDBDatabase; const openDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (db) { return resolve(db); } const request = indexedDB.open(DB_NAME, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados'); logger.error('Erro ao abrir banco de dados IndexedDB', 'dbService',

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
