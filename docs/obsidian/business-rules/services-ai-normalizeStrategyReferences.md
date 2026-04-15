---
tag: business-rule
status: active
file_origin: services/ai/testGenerationValidators.ts
---

# Garante que os tipos citados em cada caso existam nas estratégias geradas

**Descrição:** Garante que os tipos citados em cada caso existam nas estratégias geradas. Se a IA inventar nomes, mantém apenas os válidos; se vazio, usa o primeiro tipo como fallback.

**Lógica Aplicada:**

- [ ] Avaliar condição: `filtered.length > 0`
- [ ] Avaliar condição: `allowed.length > 0`

**Referências:**

[[TestStrategy]]
