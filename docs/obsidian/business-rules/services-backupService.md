---
tag: business-rule
status: active
file_origin: services/backupService.ts
aggregate: module
---

# Módulo: Backup Service

**Descrição:** Agregado de `services/backupService.ts` com 7 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 7

## `createBackup`

**Descrição:** Abre conexão com o banco de dados de backups / const openBackupDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (backupDb) { return resolve(backupDb); } const request = indexedDB.open(`${DB_NAME}_backups`, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados de backups'); logger.error('Erro ao abrir banco de dados de backups', 'backupService', error); reject(error); }; request.onsuccess = () => {

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `restoreBackup`

**Descrição:** Abre conexão com o banco de dados de backups / const openBackupDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (backupDb) { return resolve(backupDb); } const request = indexedDB.open(`${DB_NAME}_backups`, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados de backups'); logger.error('Erro ao abrir banco de dados de backups', 'backupService', error); reject(error); }; request.onsuccess = () => {

**Lógica Aplicada:**

- [ ] Avaliar condição: `backupId === 'latest'`
- [ ] Avaliar condição: `!latestBackup`
- [ ] Avaliar condição: `result.projectId !== projectId`

**Referências (trecho):**

[[Project]]

---

## `listBackups`

**Descrição:** Estimativa de tamanho serializado (evita JSON.stringify do projeto inteiro em grafos enormes). / const calculateProjectSize = (project: Project): number => { try { let n = 512; const addStr = (s: string | undefined, cap = 50_000) => { const len = Math.min(s?.length ?? 0, cap); n += len * 2; }; addStr(project.id, 200); addStr(project.name, 2000); addStr(project.description, 100_000); for (const doc of project.documents || []) { n += 64; addStr(doc.name, 2000); addStr(doc.content, 500_000); addStr

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[BackupInfo]]

---

## `getLatestBackup`

**Descrição:** Cria um backup do projeto / export const createBackup = async ( project: Project, operation: string = 'MANUAL', description?: string ): Promise<string> => { try { const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; const now = new Date().toISOString(); const size = calculateProjectSize(project); const backup: BackupEntry = { id: backupId, projectId: project.id, projectName: project.name, createdAt: now, operation, size, description, project: { ...project } // Deep

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[BackupInfo]]

---

## `autoBackupBeforeOperation`

**Descrição:** Restaura um backup específico / export const restoreBackup = async ( projectId: string, backupId: string ): Promise<Project> => { try { // Se backupId for 'latest', obter o backup mais recente let targetBackupId = backupId; if (backupId === 'latest') { const latestBackup = await getLatestBackup(projectId); if (!latestBackup) { throw new Error(`Nenhum backup encontrado para o projeto ${projectId}`); } targetBackupId = latestBackup.id; } const db = await openBackupDB(); const backup = await new Pr

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `deleteBackup`

**Descrição:** Lista todos os backups de um projeto / export const listBackups = async (projectId: string): Promise<BackupInfo[]> => { try { const db = await openBackupDB(); const backups = await new Promise<BackupEntry[]>((resolve, reject) => { const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly'); const store = transaction.objectStore(BACKUP_STORE_NAME); const index = store.index('projectId'); const request = index.getAll(projectId); request.onerror = () => reject(request.error); request.onsucces

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `getBackupStats`

**Descrição:** Lista todos os backups de um projeto / export const listBackups = async (projectId: string): Promise<BackupInfo[]> => { try { const db = await openBackupDB(); const backups = await new Promise<BackupEntry[]>((resolve, reject) => { const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly'); const store = transaction.objectStore(BACKUP_STORE_NAME); const index = store.index('projectId'); const request = index.getAll(projectId); request.onerror = () => reject(request.error); request.onsucces

**Lógica Aplicada:**

- [ ] Avaliar condição: `backups.length === 0`

**Referências (trecho):**

[[BackupInfo]]

---

**Referências (módulo):**

[[BackupInfo]] [[Project]]
