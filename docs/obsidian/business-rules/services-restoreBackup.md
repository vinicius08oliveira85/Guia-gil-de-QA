---
tag: business-rule
status: active
file_origin: services/backupService.ts
---

# Abre conexão com o banco de dados de backups / const openBackupDB = (): Promise<

**Descrição:** Abre conexão com o banco de dados de backups / const openBackupDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (backupDb) { return resolve(backupDb); } const request = indexedDB.open(`${DB_NAME}_backups`, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados de backups'); logger.error('Erro ao abrir banco de dados de backups', 'backupService', error); reject(error); }; request.onsuccess = () => {

**Lógica Aplicada:**

- [ ] Avaliar condição: `backupId === 'latest'`
- [ ] Avaliar condição: `!latestBackup`
- [ ] Avaliar condição: `result.projectId !== projectId`

**Referências:**

[[Project]]
