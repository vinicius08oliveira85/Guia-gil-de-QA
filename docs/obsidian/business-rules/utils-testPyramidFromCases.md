---
tag: business-rule
status: active
file_origin: utils/testPyramidFromCases.ts
aggregate: module
---

# Módulo: Test Pyramid From Cases

**Descrição:** Agregado de `utils/testPyramidFromCases.ts` com 4 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 4

## `parseEffortPercent`

**Descrição:** Converte strings como "70%" em número 0–100.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `classifyTestCasePyramidLevel`

**Descrição:** Converte strings como "70%" em número 0–100. */ export function parseEffortPercent(effort: string | undefined): number { if (!effort) return 0; const m = String(effort).match(/(\d+(?:[.,]\d+)?)/); if (!m) return 0; const n = parseFloat(m[1].replace(',', '.')); if (Number.isNaN(n)) return 0; return Math.min(100, Math.max(0, n)); } function normalizeStrategy(s: string): string { return s .toLowerCase() .normalize('NFD') .replace(/[\u0300-\u036f]/g, ''); } /** Classifica um caso de teste em um níve

**Lógica Aplicada:**

- [ ] Avaliar condição: `isUnit && !isE2e`

**Referências (trecho):**

[[TestCase]]

---

## `aggregateCurrentPyramidCounts`

**Descrição:** Regra derivada da exportação `aggregateCurrentPyramidCounts` em `utils/testPyramidFromCases.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

## `buildPyramidComparisonRows`

**Descrição:** Converte strings como "70%" em número 0–100. */ export function parseEffortPercent(effort: string | undefined): number { if (!effort) return 0; const m = String(effort).match(/(\d+(?:[.,]\d+)?)/); if (!m) return 0; const n = parseFloat(m[1].replace(',', '.')); if (Number.isNaN(n)) return 0; return Math.min(100, Math.max(0, n)); } function normalizeStrategy(s: string): string { return s .toLowerCase() .normalize('NFD') .replace(/[\u0300-\u036f]/g, ''); } /** Classifica um caso de teste em um níve

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[TestPyramidAnalysis]] [[Project]]

---

**Referências (módulo):**

[[Project]] [[TestCase]] [[TestPyramidAnalysis]]
