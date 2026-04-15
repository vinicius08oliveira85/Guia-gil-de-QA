---
tag: business-rule
status: active
file_origin: utils/testCaseCleanup.ts
---

# Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa" ou

**Descrição:** Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa" ou "Bug" Apenas tarefas do tipo "Tarefa" e "Bug" podem ter casos de teste e cenários BDD Epic e História não devem ter casos de teste nem cenários BDD / export async function cleanupTestCasesForNonTaskTypes( project: Project, createBackupBeforeCleanup: boolean = true ): Promise<CleanupResult> { const removedItems: CleanupResult['removedItems'] = []; let backupId: string | undefined; // Criar backup antes de limpar se so

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
