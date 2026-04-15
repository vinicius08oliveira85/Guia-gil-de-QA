---
tag: business-rule
status: active
file_origin: services/ai/geminiConstants.ts
---

# Modelo padrão na Gemini API (Developer API / AI Studio)

**Descrição:** Modelo padrão na Gemini API (Developer API / AI Studio). Padrão: `gemini-2.5-flash` (amplamente disponível em v1beta). Override com `VITE_GEMINI_MODEL`. Se a API retornar 404 ou indisponível, tente `gemini-2.5-flash-lite`, `gemini-2.0-flash` ou `gemini-1.5-flash-latest`. / const envModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim(); export const GEMINI_DEFAULT_MODEL = envModel || 'gemini-2.5-flash'; /** Modelos alternativos quando o principal falha com 404 ou 5xx transitório (ex.: 503). */

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
