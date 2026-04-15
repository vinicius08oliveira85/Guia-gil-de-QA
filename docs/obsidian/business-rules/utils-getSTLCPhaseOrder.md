---
tag: business-rule
status: active
file_origin: utils/stlcPhaseDetector.ts
---

# Detecta a fase atual do STLC baseado nas métricas do projeto / export function d

**Descrição:** Detecta a fase atual do STLC baseado nas métricas do projeto / export function detectCurrentSTLCPhase(project: Project): STLCPhaseName { const tasks = project.tasks || []; const documents = project.documents || []; const allTestCases = tasks.flatMap(t => t.testCases || []); const totalTestCases = allTestCases.length; const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length; const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length; // Fase 1: Aná

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[STLCPhaseName]]
