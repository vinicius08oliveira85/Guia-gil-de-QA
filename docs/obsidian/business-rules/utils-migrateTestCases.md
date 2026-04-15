---
tag: business-rule
status: active
file_origin: utils/testCaseMigration.ts
---

# Normaliza executedStrategy para sempre ser um array Converte strings antigas (le

**Descrição:** Normaliza executedStrategy para sempre ser um array Converte strings antigas (legado) para array / export function normalizeExecutedStrategy(executedStrategy?: string | string[]): string[] { if (!executedStrategy) { return []; } if (Array.isArray(executedStrategy)) { return executedStrategy.filter(s => s && s.trim() !== ''); } // Se for string (formato antigo), converte para array return executedStrategy.trim() !== '' ? [executedStrategy] : []; } /** Verifica se um TestCase precisa de migração /

**Lógica Aplicada:**

- [ ] Avaliar condição: `!needsAnyMigration`

**Referências:**

[[TestCase]]
