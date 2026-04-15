---
tag: business-rule
status: active
file_origin: utils/testPyramidFromCases.ts
---

# Converte strings como "70%" em número 0–100

**Descrição:** Converte strings como "70%" em número 0–100. */ export function parseEffortPercent(effort: string | undefined): number { if (!effort) return 0; const m = String(effort).match(/(\d+(?:[.,]\d+)?)/); if (!m) return 0; const n = parseFloat(m[1].replace(',', '.')); if (Number.isNaN(n)) return 0; return Math.min(100, Math.max(0, n)); } function normalizeStrategy(s: string): string { return s .toLowerCase() .normalize('NFD') .replace(/[\u0300-\u036f]/g, ''); } /** Classifica um caso de teste em um níve

**Lógica Aplicada:**

- [ ] Avaliar condição: `isUnit && !isE2e`

**Referências:**

[[TestCase]]
