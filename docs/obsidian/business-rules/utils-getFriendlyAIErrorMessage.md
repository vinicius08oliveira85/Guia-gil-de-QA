---
tag: business-rule
status: active
file_origin: utils/aiErrorMapper.ts
---

# Get Friendly AIError Message

**Descrição:** Regra derivada da exportação `getFriendlyAIErrorMessage` em `utils/aiErrorMapper.ts`: lógica e validações implementadas no código.

**Lógica Aplicada:**

- [ ] Avaliar condição: `code && codeToMessage[code]`
- [ ] Avaliar condição: `status === 429`
- [ ] Avaliar condição: `status === 503`
- [ ] Avaliar condição: `typeof error === 'string'`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
