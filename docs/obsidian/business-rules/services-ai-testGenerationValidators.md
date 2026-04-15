---
tag: business-rule
status: active
file_origin: services/ai/testGenerationValidators.ts
aggregate: module
---

# Módulo: Test Generation Validators

**Descrição:** Agregado de `services/ai/testGenerationValidators.ts` com 1 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 1

## `normalizeStrategyReferences`

**Descrição:** Garante que os tipos citados em cada caso existam nas estratégias geradas. Se a IA inventar nomes, mantém apenas os válidos; se vazio, usa o primeiro tipo como fallback.

**Lógica Aplicada:**

- [ ] Avaliar condição: `filtered.length > 0`
- [ ] Avaliar condição: `allowed.length > 0`

**Referências (trecho):**

[[TestStrategy]]

---

**Referências (módulo):**

[[TestStrategy]]
