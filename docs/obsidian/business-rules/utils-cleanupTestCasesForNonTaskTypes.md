---
tag: business-rule
status: active
file_origin: utils/testCaseCleanup.ts
---

# Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa" ou

**Descrição:** Remove casos de teste e cenários BDD de tarefas que não são do tipo "Tarefa" ou "Bug" Apenas tarefas do tipo "Tarefa" e "Bug" podem ter casos de teste e cenários BDD Epic e História não devem ter casos de teste nem cenários BDD

**Lógica Aplicada:**

- [ ] Avaliar condição: `createBackupBeforeCleanup`
- [ ] Avaliar condição: `!project || !project.tasks`
- [ ] Avaliar condição: `task.type !== 'Tarefa' && task.type !== 'Bug'`
- [ ] Avaliar condição: `needsCleanup`
- [ ] Avaliar condição: `removedItems.length > 0`

**Referências:**

[[Project]] [[JiraTask]]
