---
tag: business-rule
status: active
file_origin: services/dbService.ts
---

# Escreve um projeto apenas no IndexedDB (sem chamar Supabase)

**Descrição:** Escreve um projeto apenas no IndexedDB (sem chamar Supabase). Usado após Sincronizar (persistir lista final) e opcionalmente após Salvar (alinhar cache). Aplica cleanup e migrateTestCases para manter consistência com o restante do app. / export const writeProjectToIndexedDBOnly = async (project: Project): Promise<void> => { const cleaned = cleanupTestCasesForNonTaskTypesSync(project); const migrated: Project = { ...cleaned, tasks: cleaned.tasks.map(task => ({ ...task, testCases: migrateTestCases

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
