---
tag: business-rule
status: active
file_origin: services/dbService.ts
---

# Envelope JSON de backup local (IndexedDB), usado em exportação por download ou F

**Descrição:** Envelope JSON de backup local (IndexedDB), usado em exportação por download ou File System Access API. */ export type LocalBackupEnvelope = { backupFormatVersion: number; dbVersion: number; exportedAt: string; app: string; projects: Project[]; }; /** Monta o objeto de backup a partir do IndexedDB (sem gravar arquivo). / export const buildLocalBackupData = async (): Promise<LocalBackupEnvelope> => { const projects = await loadProjectsFromIndexedDB(); return { backupFormatVersion: BACKUP_EXPORT_FO

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
