---
tag: business-rule
status: active
file_origin: utils/suggestionService.ts
---

# Gera sugestões automáticas baseadas no estado do projeto

**Descrição:** Gera sugestões automáticas baseadas no estado do projeto

**Lógica Aplicada:**

- [ ] Avaliar condição: `tasks.length === 0`
- [ ] Avaliar condição: `tasksWithoutBDD.length > 0`
- [ ] Avaliar condição: `tasksWithoutTests.length > 0`
- [ ] Avaliar condição: `unexecutedTests.length > 0`
- [ ] Avaliar condição: `criticalBugs.length > 0`
- [ ] Avaliar condição: `doneTasksWithoutPassingTests.length > 0`
- [ ] Avaliar condição: `project.documents.length === 0`

**Referências:**

[[Project]]
