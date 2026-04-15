---
tag: business-rule
status: active
file_origin: services/dbService.ts
---

# Persiste o projeto no IndexedDB

**Descrição:** Persiste o projeto no IndexedDB. / export const updateProject = async ( project: Project, options?: { syncRemote?: boolean } ): Promise<SaveResult> => { const cleanedProject = cleanupTestCasesForNonTaskTypesSync(project); const syncRemote = options?.syncRemote === true; const totalStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.testStrategy?.length || 0), 0); const totalExecutedStrategies = cleanedProject.tasks.reduce((sum, task) => sum + (task.executedStrategies?.length || 0

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
