---
tag: business-rule
status: active
file_origin: services/geminiConfigService.ts
---

# Serviço para gerenciar configuração da API Key do Gemini Armazena a chave no loc

**Descrição:** Serviço para gerenciar configuração da API Key do Gemini Armazena a chave no localStorage seguindo o padrão do jiraService / const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key'; export interface GeminiConfig { apiKey: string; } /** Salva a configuração da API Key do Gemini no localStorage

**Lógica Aplicada:**

- [ ] Avaliar condição: `typeof window === 'undefined' || !window.localStorage`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
