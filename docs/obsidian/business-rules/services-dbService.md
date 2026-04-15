---
tag: business-rule
status: active
file_origin: services/dbService.ts
aggregate: module
---

# Módulo: Db Service

**Descrição:** Agregado de `services/dbService.ts` com 11 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 11

## `loadProjectsFromIndexedDB`

**Descrição:** Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB). */ export const BACKUP_EXPORT_FORMAT_VERSION = 1; let db: IDBDatabase; const openDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (db) { return resolve(db); } const request = indexedDB.open(DB_NAME, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados'); logger.error('Erro ao abrir banco de dados IndexedDB', 'dbService',

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `getProjectById`

**Descrição:** Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB). */ export const BACKUP_EXPORT_FORMAT_VERSION = 1; let db: IDBDatabase; const openDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (db) { return resolve(db); } const request = indexedDB.open(DB_NAME, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados'); logger.error('Erro ao abrir banco de dados IndexedDB', 'dbService',

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `getAllProjects`

**Descrição:** Versão do envelope JSON de backup (independente do DB_VERSION do IndexedDB). */ export const BACKUP_EXPORT_FORMAT_VERSION = 1; let db: IDBDatabase; const openDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { if (db) { return resolve(db); } const request = indexedDB.open(DB_NAME, DB_VERSION); request.onerror = () => { const error = request.error || new Error('Erro desconhecido ao abrir banco de dados'); logger.error('Erro ao abrir banco de dados IndexedDB', 'dbService',

**Lógica Aplicada:**

- [ ] Avaliar condição: `loadFailed`
- [ ] Avaliar condição: `supabaseProjects.length === 0 && indexedDBProjects.length > 0`
- [ ] Avaliar condição: `supabaseProjects.length > 0`

**Referências (trecho):**

[[Project]]

---

## `addProject`

**Descrição:** Regra derivada da exportação `addProject` em `services/dbService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `updateProject`

**Descrição:** Obtém um projeto pelo id no IndexedDB (para verificar existência na importação). Não consulta o Supabase. / export const getProjectById = async (projectId: string): Promise<Project | null> => { const db = await openDB(); const raw = await new Promise<Project | undefined>((resolve, reject) => { const transaction = db.transaction(STORE_NAME, 'readonly'); const store = transaction.objectStore(STORE_NAME); const request = store.get(projectId); request.onerror = () => reject(request.error); request.o

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `writeProjectToIndexedDBOnly`

**Descrição:** Persiste o projeto no IndexedDB. / export const updateProject = async ( project: Project, options?: { syncRemote?: boolean } ): Promise<SaveResult> => { const cleanedProject = cleanupTestCasesForNonTaskTypesSync(project); const syncRemote = options?.syncRemote === true; const totalStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.testStrategy?.length || 0), 0); const totalExecutedStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.executedStrategies?.length || 0

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `buildLocalBackupData`

**Descrição:** Escreve um projeto apenas no IndexedDB (sem chamar Supabase). Usado após Sincronizar (persistir lista final) e opcionalmente após Salvar (alinhar cache). Aplica cleanup e migrateTestCases para manter consistência com o restante do app. / export const writeProjectToIndexedDBOnly = async (project: Project): Promise<void> => { const cleaned = cleanupTestCasesForNonTaskTypesSync(project); const migrated: Project = { ...cleaned, tasks: cleaned.tasks.map(task => ({ ...task, testCases: migrateTestCases

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `exportProjectsToBackup`

**Descrição:** Escreve um projeto apenas no IndexedDB (sem chamar Supabase). Usado após Sincronizar (persistir lista final) e opcionalmente após Salvar (alinhar cache). Aplica cleanup e migrateTestCases para manter consistência com o restante do app. / export const writeProjectToIndexedDBOnly = async (project: Project): Promise<void> => { const cleaned = cleanupTestCasesForNonTaskTypesSync(project); const migrated: Project = { ...cleaned, tasks: cleaned.tasks.map(task => ({ ...task, testCases: migrateTestCases

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `importProjectsFromBackup`

**Descrição:** Escreve um projeto apenas no IndexedDB (sem chamar Supabase). Usado após Sincronizar (persistir lista final) e opcionalmente após Salvar (alinhar cache). Aplica cleanup e migrateTestCases para manter consistência com o restante do app. / export const writeProjectToIndexedDBOnly = async (project: Project): Promise<void> => { const cleaned = cleanupTestCasesForNonTaskTypesSync(project); const migrated: Project = { ...cleaned, tasks: cleaned.tasks.map(task => ({ ...task, testCases: migrateTestCases

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `saveProjectToSupabaseOnly`

**Descrição:** Envelope JSON de backup local (IndexedDB), usado em exportação por download ou File System Access API. */ export type LocalBackupEnvelope = { backupFormatVersion: number; dbVersion: number; exportedAt: string; app: string; projects: Project[]; }; /** Monta o objeto de backup a partir do IndexedDB (sem gravar arquivo). / export const buildLocalBackupData = async (): Promise<LocalBackupEnvelope> => { const projects = await loadProjectsFromIndexedDB(); return { backupFormatVersion: BACKUP_EXPORT_FO

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `deleteProject`

**Descrição:** Regra derivada da exportação `deleteProject` em `services/dbService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

**Referências (módulo):**

[[Project]]
