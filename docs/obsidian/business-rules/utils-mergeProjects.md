---
tag: business-rule
status: active
file_origin: utils/projectMerge.ts
---

# Compara dois timestamps e retorna qual é mais recente / const compareTimestamps

**Descrição:** Compara dois timestamps e retorna qual é mais recente / const compareTimestamps = (timestamp1?: string, timestamp2?: string): number => { if (!timestamp1 && !timestamp2) return 0; if (!timestamp1) return -1; // timestamp2 é mais recente if (!timestamp2) return 1; // timestamp1 é mais recente const date1 = new Date(timestamp1).getTime(); const date2 = new Date(timestamp2).getTime(); if (date1 > date2) return 1; if (date1 < date2) return -1; return 0; }; /** Faz merge inteligente de dois projetos,

**Lógica Aplicada:**

- [ ] Avaliar condição: `timestampComparison > 0`

**Referências:**

[[Project]]
