---
tag: business-rule
status: active
file_origin: services/ai/aiServiceFactory.ts
---

# Resolve qual provedor de IA usar

**Descrição:** Resolve qual provedor de IA usar. Ordem de precedência: 1. Chave Gemini salva pelo usuário em Configurações (localStorage) — uso explícito do Gemini na UI. 2. `VITE_OPENAI_API_KEY` / `OPENAI_API_KEY` no ambiente. 3. `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` no ambiente. 4. Padrão: Gemini (a chave efetiva nas chamadas vem do `geminiApiKeyManager`: localStorage depois env). / export const resolveConfiguredAIProvider = (): AIProvider => { const geminiUiKey = getGeminiConfig()?.apiKey?.trim() ?? ''; 

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
