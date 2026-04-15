---
tag: business-rule
status: active
file_origin: hooks/useQualityMetrics.ts
---

# Identifica se um bug foi vazado para produção / const isEscapedDefect = (bug: Ji

**Descrição:** Identifica se um bug foi vazado para produção / const isEscapedDefect = (bug: JiraTask): boolean => { // Verificar campo isEscapedDefect se existir if (bug.isEscapedDefect === true) { return true; } // Verificar tags const escapedTags = ['production-escape', 'escaped', 'vazado', 'production-bug', 'escaped-defect']; if (bug.tags && bug.tags.some(tag => escapedTags.some(escapedTag => tag.toLowerCase().includes(escapedTag.toLowerCase())) )) { return true; } return false; }; /** Detecta testes flaky

**Lógica Aplicada:**

- [ ] Avaliar condição: `bug.status === 'Done' && bug.completedAt`
- [ ] Avaliar condição: `task.tags && task.tags.length > 0`
- [ ] Avaliar condição: `moduleTag`
- [ ] Avaliar condição: `task.parentId`
- [ ] Avaliar condição: `task.type === 'Bug'`
- [ ] Avaliar condição: `range.max === Infinity`

**Referências:**

[[Project]] [[TestCase]] [[JiraTask]]
