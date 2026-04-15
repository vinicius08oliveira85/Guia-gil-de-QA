---
tag: business-rule
status: active
file_origin: utils/stlcPhaseDetector.ts
aggregate: module
---

# Módulo: Stlc Phase Detector

**Descrição:** Agregado de `utils/stlcPhaseDetector.ts` com 4 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 4

## `detectCurrentSTLCPhase`

**Descrição:** Detecta a fase atual do STLC baseado nas métricas do projeto

**Lógica Aplicada:**

- [ ] Avaliar condição: `tasks.length === 0 && documents.length === 0`
- [ ] Avaliar condição: `totalTestCases === 0`
- [ ] Avaliar condição: `executedTestCases === 0`
- [ ] Avaliar condição: `executedTestCases < totalTestCases || passedTestCases < executedTestCases`
- [ ] Avaliar condição: `executedTestCases === totalTestCases && passedTestCases === executedTestCases && totalTestCases > 0`
- [ ] Avaliar condição: `tasks.length > 0 && totalTestCases === 0`

**Referências (trecho):**

[[Project]] [[STLCPhaseName]]

---

## `getSTLCPhaseOrder`

**Descrição:** Detecta a fase atual do STLC baseado nas métricas do projeto / export function detectCurrentSTLCPhase(project: Project): STLCPhaseName { const tasks = project.tasks || []; const documents = project.documents || []; const allTestCases = tasks.flatMap(t => t.testCases || []); const totalTestCases = allTestCases.length; const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length; const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length; // Fase 1: Aná

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[STLCPhaseName]]

---

## `isSTLCPhaseBefore`

**Descrição:** Detecta a fase atual do STLC baseado nas métricas do projeto / export function detectCurrentSTLCPhase(project: Project): STLCPhaseName { const tasks = project.tasks || []; const documents = project.documents || []; const allTestCases = tasks.flatMap(t => t.testCases || []); const totalTestCases = allTestCases.length; const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length; const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length; // Fase 1: Aná

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[STLCPhaseName]]

---

## `isSTLCPhaseAfter`

**Descrição:** Detecta a fase atual do STLC baseado nas métricas do projeto / export function detectCurrentSTLCPhase(project: Project): STLCPhaseName { const tasks = project.tasks || []; const documents = project.documents || []; const allTestCases = tasks.flatMap(t => t.testCases || []); const totalTestCases = allTestCases.length; const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length; const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length; // Fase 1: Aná

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[STLCPhaseName]]

---

**Referências (módulo):**

[[Project]] [[STLCPhaseName]]
