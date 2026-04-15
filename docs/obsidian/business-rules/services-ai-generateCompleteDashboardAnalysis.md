---
tag: business-rule
status: active
file_origin: services/ai/dashboardInsightsService.ts
---

# Prepara dados detalhados de Tarefas e Testes para o prompt / function prepareTas

**Descrição:** Prepara dados detalhados de Tarefas e Testes para o prompt / function prepareTasksAndTestsData(project: Project) { const tasks = project.tasks.map(task => ({ id: task.id, title: task.title, type: task.type, status: task.status, priority: task.priority, testCases: task.testCases?.map(tc => ({ title: tc.title, status: tc.status, isAutomated: tc.isAutomated || false, })) || [], bddScenarios: task.bddScenarios?.length || 0, hasBddScenarios: (task.bddScenarios?.length || 0) > 0, })); const tasksWitho

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]] [[SDLCPhaseAnalysis]] [[DashboardInsightsAnalysis]]
