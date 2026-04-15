---
tag: business-rule
status: active
file_origin: utils/testCaseMerge.ts
---

# Mescla testCases prioritários com testCases secundários Estratégia de mesclagem:

**Descrição:** Mescla testCases prioritários com testCases secundários Estratégia de mesclagem: - Se um testCase existe tanto nos prioritários quanto nos secundários (mesmo ID), usar os dados dos prioritários (preservar status) - Se um testCase existe apenas nos prioritários, adicionar normalmente - Se um testCase existe apenas nos secundários mas não nos prioritários, preservar (caso o teste tenha sido removido mas ainda existe nos secundários)

**Lógica Aplicada:**

- [ ] Avaliar condição: `!primaryTestCases || primaryTestCases.length === 0`
- [ ] Avaliar condição: `!secondaryTestCases || secondaryTestCases.length === 0`
- [ ] Avaliar condição: `testCase.id`
- [ ] Avaliar condição: `primaryHasStatus`
- [ ] Avaliar condição: `!primaryHasStatus && secondaryHasStatus`
- [ ] Avaliar condição: `secondary`

**Referências:**

[[TestCase]]
