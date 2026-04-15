---
tag: business-rule
status: active
file_origin: hooks/useQualityMetrics.ts
aggregate: module
---

# Módulo: Use Quality Metrics

**Descrição:** Agregado de `hooks/useQualityMetrics.ts` com 2 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 2

## `calculateQualityMetrics`

**Descrição:** Identifica se um bug foi vazado para produção / const isEscapedDefect = (bug: JiraTask): boolean => { // Verificar campo isEscapedDefect se existir if (bug.isEscapedDefect === true) { return true; } // Verificar tags const escapedTags = ['production-escape', 'escaped', 'vazado', 'production-bug', 'escaped-defect']; if (bug.tags && bug.tags.some(tag => escapedTags.some(escapedTag => tag.toLowerCase().includes(escapedTag.toLowerCase())) )) { return true; } return false; }; /** Detecta testes flaky

**Lógica Aplicada:**

- [ ] Avaliar condição: `bug.status === 'Done' && bug.completedAt`
- [ ] Avaliar condição: `task.tags && task.tags.length > 0`
- [ ] Avaliar condição: `moduleTag`
- [ ] Avaliar condição: `task.parentId`
- [ ] Avaliar condição: `task.type === 'Bug'`
- [ ] Avaliar condição: `range.max === Infinity`

**Referências (trecho):**

[[Project]] [[TestCase]] [[JiraTask]]

---

## `useQualityMetrics`

**Descrição:** Regra derivada da exportação `useQualityMetrics` em `hooks/useQualityMetrics.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[Project]]

---

**Referências (módulo):**

[[JiraTask]] [[Project]] [[TestCase]]
