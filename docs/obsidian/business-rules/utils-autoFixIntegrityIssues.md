---
tag: business-rule
status: active
file_origin: utils/dataIntegrityService.ts
---

# Valida estrutura básica de um projeto / const validateProjectStructure = (projec

**Descrição:** Valida estrutura básica de um projeto / const validateProjectStructure = (project: Project): IntegrityIssue[] => { const issues: IntegrityIssue[] = []; if (!project.id) { issues.push({ type: 'missing_field', severity: 'critical', path: 'id', message: 'Projeto sem ID', }); } if (!project.name || project.name.trim() === '') { issues.push({ type: 'missing_field', severity: 'high', path: 'name', message: 'Projeto sem nome', }); } if (!Array.isArray(project.tasks)) { issues.push({ type: 'invalid_data

**Lógica Aplicada:**

- [ ] Avaliar condição: `!fixedProject.id`
- [ ] Avaliar condição: `!fixedTask.id`
- [ ] Avaliar condição: `!fixedTask.type`
- [ ] Avaliar condição: `fixedTask.type !== 'Tarefa' && fixedTask.testCases.length > 0`
- [ ] Avaliar condição: `!fixedTestCase.id`
- [ ] Avaliar condição: `!fixedTestCase.status`

**Referências:**

[[Project]]
