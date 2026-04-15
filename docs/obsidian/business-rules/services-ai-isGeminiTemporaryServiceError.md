---
tag: business-rule
status: active
file_origin: services/ai/geminiApiWrapper.ts
---

# Wrapper para chamadas à API Gemini com retry e rate limiting Gerencia automatica

**Descrição:** Wrapper para chamadas à API Gemini com retry e rate limiting Gerencia automaticamente rate limiting e retry com backoff exponencial / import { GoogleGenAI } from '@google/genai'; import { retryWithBackoff } from '../../utils/retry'; import { geminiRateLimiter } from '../../utils/rateLimiter'; import { logger } from '../../utils/logger'; import { geminiApiKeyManager } from './geminiApiKeyManager'; import { getGeminiModelFallbackChain } from './geminiConstants'; export type GeminiAppError = Error 

**Lógica Aplicada:**

- [ ] Avaliar condição: `e?.code === 'GEMINI_TEMP_UNAVAILABLE'`
- [ ] Avaliar condição: `s === null`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
