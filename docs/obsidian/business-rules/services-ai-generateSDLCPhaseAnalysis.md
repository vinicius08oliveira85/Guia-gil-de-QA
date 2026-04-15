---
tag: business-rule
status: active
file_origin: services/ai/sdlcPhaseAnalysisService.ts
---

# Calcula o percentual de progresso da fase atual baseado nas métricas / function

**Descrição:** Calcula o percentual de progresso da fase atual baseado nas métricas / function calculatePhaseProgress(project: Project, currentPhase: PhaseName): number { const metrics = calculateProjectMetrics(project); const totalTasks = project.tasks.filter(t => t.type === 'Tarefa').length; const doneTasks = project.tasks.filter(t => t.type !== 'Bug' && t.status === 'Done').length; switch (currentPhase) { case 'Request': // Progresso baseado em documentos ou tarefas criados { const hasContent = project.docu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]] [[SDLCPhaseAnalysis]] [[PhaseName]]
