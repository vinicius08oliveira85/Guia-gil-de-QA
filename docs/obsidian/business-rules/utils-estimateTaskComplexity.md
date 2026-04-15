---
tag: business-rule
status: active
file_origin: utils/estimationService.ts
---

# Estimate Task Complexity

**Descrição:** Regra derivada da exportação `estimateTaskComplexity` em `utils/estimationService.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.type === 'Epic'`
- [ ] Avaliar condição: `task.type === 'História'`
- [ ] Avaliar condição: `task.type === 'Bug'`
- [ ] Avaliar condição: `testCasesCount > 10`
- [ ] Avaliar condição: `testCasesCount > 5`
- [ ] Avaliar condição: `bddScenariosCount > 5`
- [ ] Avaliar condição: `hasDependencies`
- [ ] Avaliar condição: `complexity >= 5`
- [ ] Avaliar condição: `complexity >= 3`
- [ ] Avaliar condição: `complexity >= 2`

**Referências:**

[[JiraTask]]
