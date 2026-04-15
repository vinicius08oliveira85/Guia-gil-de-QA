---
tag: business-rule
status: active
file_origin: utils/pwa.ts
---

# Utilitários para gerenciar PWA (Progressive Web App) / interface BeforeInstallPr

**Descrição:** Utilitários para gerenciar PWA (Progressive Web App) / interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; } let deferredPrompt: BeforeInstallPromptEvent | null = null; let pwaInitialized = false; /** Verifica se o navegador suporta service workers / export const isServiceWorkerSupported = (): boolean => { return 'serviceWorker' in navigator; }; /** Verifica se o app está instalado (rodando como PWA)

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
