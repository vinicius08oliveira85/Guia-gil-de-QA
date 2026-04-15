---
tag: business-rule
status: active
file_origin: utils/dataIntegrityService.ts
aggregate: module
---

# Módulo: Data Integrity Service

**Descrição:** Agregado de `utils/dataIntegrityService.ts` com 3 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 3

## `validateProjectIntegrity`

**Descrição:** Impressão digital leve do projeto (evita JSON.stringify do grafo inteiro → stack/heap em projetos grandes). / const projectIntegrityFingerprint = (project: Project): string => { try { let hash = 5381; const mix = (s: string) => { for (let i = 0; i < s.length; i++) { hash = (hash * 33) ^ s.charCodeAt(i); hash |= 0; } }; mix(project.id || ''); mix(project.name || ''); mix(project.updatedAt || ''); mix(project.createdAt || ''); const tasks = project.tasks || []; hash = (hash * 33 + tasks.length) | 

**Lógica Aplicada:**

- [ ] Avaliar condição: `fingerprint === 'fp:error'`

**Referências (trecho):**

[[Project]]

---

## `autoFixIntegrityIssues`

**Descrição:** Valida estrutura básica de um projeto / const validateProjectStructure = (project: Project): IntegrityIssue[] => { const issues: IntegrityIssue[] = []; if (!project.id) { issues.push({ type: 'missing_field', severity: 'critical', path: 'id', message: 'Projeto sem ID', }); } if (!project.name || project.name.trim() === '') { issues.push({ type: 'missing_field', severity: 'high', path: 'name', message: 'Projeto sem nome', }); } if (!Array.isArray(project.tasks)) { issues.push({ type: 'invalid_data

**Lógica Aplicada:**

- [ ] Avaliar condição: `!fixedProject.id`
- [ ] Avaliar condição: `!fixedTask.id`
- [ ] Avaliar condição: `!fixedTask.type`
- [ ] Avaliar condição: `fixedTask.type !== 'Tarefa' && fixedTask.testCases.length > 0`
- [ ] Avaliar condição: `!fixedTestCase.id`
- [ ] Avaliar condição: `!fixedTestCase.status`

**Referências (trecho):**

[[Project]]

---

## `validateAndFixProject`

**Descrição:** Valida integridade de um projeto / export const validateProjectIntegrity = (project: Project): IntegrityCheckResult => { const issues: IntegrityIssue[] = []; // Validar estrutura básica issues.push(...validateProjectStructure(project)); // Validar tarefas if (Array.isArray(project.tasks)) { project.tasks.forEach((task, index) => { issues.push(...validateTask(task, index)); }); } try { const fingerprint = projectIntegrityFingerprint(project); if (fingerprint === 'fp:error') { issues.push({ type: 

**Lógica Aplicada:**

- [ ] Avaliar condição: `checkResult.isValid`
- [ ] Avaliar condição: `checkResult.canAutoFix`
- [ ] Avaliar condição: `fixedCheckResult.isValid`
- [ ] Avaliar condição: `restoredCheckResult.isValid`

**Referências (trecho):**

[[Project]]

---

**Referências (módulo):**

[[Project]]
