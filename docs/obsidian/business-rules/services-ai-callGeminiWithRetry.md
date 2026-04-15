---
tag: business-rule
status: active
file_origin: services/ai/geminiApiWrapper.ts
---

# Call Gemini With Retry

**Descrição:** Regra derivada da exportação `callGeminiWithRetry` em `services/ai/geminiApiWrapper.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `retryAfter`
- [ ] Avaliar condição: `status === 429`
- [ ] Avaliar condição: `retryInfo.retryAfter != null`
- [ ] Avaliar condição: `retryInfo.status`
- [ ] Avaliar condição: `retryInfo.retryAfter`
- [ ] Avaliar condição: `status === 403`
- [ ] Avaliar condição: `status === 429`
- [ ] Avaliar condição: `status === 503`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
