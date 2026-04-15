---
tag: business-rule
status: active
file_origin: utils/bugAutoCreation.ts
---

# Determine Bug Severity

**Descrição:** Regra derivada da exportação `determineBugSeverity` em `utils/bugAutoCreation.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `hasCriticalTag`
- [ ] Avaliar condição: `hasHighSeverityTag`
- [ ] Avaliar condição: `task.priority === 'Urgente' || task.priority === 'Alta'`

**Referências:**

[[TestCase]] [[JiraTask]] [[BugSeverity]]
