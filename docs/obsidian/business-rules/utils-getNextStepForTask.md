---
tag: business-rule
status: active
file_origin: utils/taskPhaseHelper.ts
---

# Determina em qual fase do projeto uma tarefa está baseado em seu status e caract

**Descrição:** Determina em qual fase do projeto uma tarefa está baseado em seu status e características / export const getTaskPhase = (task: JiraTask, _projectPhases?: { name: PhaseName; status: string }[]): PhaseName | null => { // Se a tarefa está "Done", está na fase mais avançada possível if (task.status === 'Done') { // Se tem testes executados, está em Test ou posterior if (task.testCases && task.testCases.some(tc => tc.status !== 'Not Run')) { return 'Test'; } // Se tem testes mas não executados, está 

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.status === 'Done'`
- [ ] Avaliar condição: `!task.bddScenarios || task.bddScenarios.length === 0`
- [ ] Avaliar condição: `!task.testCases || task.testCases.length === 0`

**Referências:**

[[JiraTask]]
