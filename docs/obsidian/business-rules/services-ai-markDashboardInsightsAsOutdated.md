---
tag: business-rule
status: active
file_origin: services/ai/dashboardInsightsService.ts
---

# Prepara dados detalhados de Tarefas e Testes para o prompt / function prepareTas

**Descrição:** Prepara dados detalhados de Tarefas e Testes para o prompt / function prepareTasksAndTestsData(project: Project) { const tasks = project.tasks.map(task => ({ id: task.id, title: task.title, type: task.type, status: task.status, priority: task.priority, testCases: task.testCases?.map(tc => ({ title: tc.title, status: tc.status, isAutomated: tc.isAutomated || false, })) || [], bddScenarios: task.bddScenarios?.length || 0, hasBddScenarios: (task.bddScenarios?.length || 0) > 0, })); const tasksWitho

**Lógica Aplicada:**

- [ ] Avaliar condição: `project.dashboardInsightsAnalysis`
- [ ] Avaliar condição: `!cached || cached.snapshotHash !== currentHash`

**Referências:**

[[Project]]
