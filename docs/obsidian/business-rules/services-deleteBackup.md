---
tag: business-rule
status: active
file_origin: services/backupService.ts
---

# Lista todos os backups de um projeto / export const listBackups = async (project

**Descrição:** Lista todos os backups de um projeto / export const listBackups = async (projectId: string): Promise<BackupInfo[]> => { try { const db = await openBackupDB(); const backups = await new Promise<BackupEntry[]>((resolve, reject) => { const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly'); const store = transaction.objectStore(BACKUP_STORE_NAME); const index = store.index('projectId'); const request = index.getAll(projectId); request.onerror = () => reject(request.error); request.onsucces

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
