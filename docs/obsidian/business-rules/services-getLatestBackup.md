---
tag: business-rule
status: active
file_origin: services/backupService.ts
---

# Cria um backup do projeto / export const createBackup = async ( project: Project

**Descrição:** Cria um backup do projeto / export const createBackup = async ( project: Project, operation: string = 'MANUAL', description?: string ): Promise<string> => { try { const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; const now = new Date().toISOString(); const size = calculateProjectSize(project); const backup: BackupEntry = { id: backupId, projectId: project.id, projectName: project.name, createdAt: now, operation, size, description, project: { ...project } // Deep

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[BackupInfo]]
