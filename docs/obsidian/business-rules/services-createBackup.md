---
tag: business-rule
status: active
file_origin: services/backupService.ts
---

# Abre conexão com o banco de dados de backups / const openBackupDB = (): Promise<

**Descrição:** Abre conexão com o banco de dados de backups / const openBackupDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (backupDb) { return resolve(backupDb); } const request = indexedDB.open(`${DB_NAME}_backups`, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados de backups'); logger.error('Erro ao abrir banco de dados de backups', 'backupService', error); reject(error); }; request.onsuccess = () => {

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
