---
tag: business-rule
status: active
file_origin: utils/stlcPhaseDetector.ts
---

# Detecta a fase atual do STLC baseado nas métricas do projeto

**Descrição:** Detecta a fase atual do STLC baseado nas métricas do projeto

**Lógica Aplicada:**

- [ ] Avaliar condição: `tasks.length === 0 && documents.length === 0`
- [ ] Avaliar condição: `totalTestCases === 0`
- [ ] Avaliar condição: `executedTestCases === 0`
- [ ] Avaliar condição: `executedTestCases < totalTestCases || passedTestCases < executedTestCases`
- [ ] Avaliar condição: `executedTestCases === totalTestCases && passedTestCases === executedTestCases && totalTestCases > 0`
- [ ] Avaliar condição: `tasks.length > 0 && totalTestCases === 0`

**Referências:**

[[Project]] [[STLCPhaseName]]
