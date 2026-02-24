import { logger } from './logger';

/**
 * Utilitários para gerenciar PWA (Progressive Web App)
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let pwaInitialized = false;

/**
 * Verifica se o navegador suporta service workers
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

/**
 * Verifica se o app está instalado (rodando como PWA)
 */
export const isAppInstalled = (): boolean => {
  // Verifica se está rodando em modo standalone (PWA instalado)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Verifica se está rodando em modo standalone no iOS
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  return false;
};

/**
 * Verifica se o app pode ser instalado
 */
export const canInstallApp = (): boolean => {
  return deferredPrompt !== null;
};

/**
 * Registra o service worker
 */
export const registerServiceWorker = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    logger.warn('Service Workers não são suportados neste navegador', 'pwa');
    return;
  }

  try {
    // O vite-plugin-pwa registra automaticamente, mas podemos verificar
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      logger.info('Service Worker registrado com sucesso', 'pwa', { scope: registration.scope });

      // Verificar atualizações periodicamente
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              logger.info(
                'Nova versão do app disponível. Recarregue a página para atualizar.',
                'pwa'
              );
              // Pode mostrar notificação ao usuário aqui
            }
          });
        }
      });
    }
  } catch (error) {
    logger.error('Erro ao registrar Service Worker', 'pwa', error);
  }
};

/**
 * Instala o app (mostra prompt de instalação)
 */
export const installApp = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    logger.warn('Prompt de instalação não está disponível', 'pwa');
    return false;
  }

  try {
    // Mostra o prompt de instalação
    await deferredPrompt.prompt();

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      logger.info('Usuário aceitou instalar o app', 'pwa');
      deferredPrompt = null;
      return true;
    } else {
      logger.info('Usuário rejeitou instalar o app', 'pwa');
      return false;
    }
  } catch (error) {
    logger.error('Erro ao instalar app', 'pwa', error);
    return false;
  }
};

/**
 * Inicializa os listeners de PWA
 */
export const initializePWA = (): void => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  // Evitar múltiplos listeners (ex.: React StrictMode + chamadas em mais de um lugar)
  if (pwaInitialized) {
    return;
  }
  pwaInitialized = true;

  // Listener para o evento beforeinstallprompt
  // Nota: O aviso "Banner not shown: beforeinstallpromptevent.preventDefault()" no console é esperado:
  // o app usa prompt customizado (InstallPWAButton); prompt() só é chamado quando o usuário clica em "Instalar App".
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Previne o prompt padrão do navegador
    e.preventDefault();

    // Salva o evento para usar depois
    deferredPrompt = e as BeforeInstallPromptEvent;

    logger.info('App pode ser instalado', 'pwa');

    // Pode disparar evento customizado para mostrar botão de instalação
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  // Listener para quando o app é instalado
  window.addEventListener('appinstalled', () => {
    logger.info('App instalado com sucesso', 'pwa');
    deferredPrompt = null;

    // Pode disparar evento customizado para esconder botão de instalação
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });

  // Registrar service worker quando a página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
  } else {
    registerServiceWorker();
  }
};

/**
 * Verifica se há atualização disponível do service worker
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();

    // Verifica se há um novo service worker esperando
    if (registration.waiting) {
      logger.info('Nova versão disponível', 'pwa');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Erro ao verificar atualizações', 'pwa', error);
    return false;
  }
};

/**
 * Força atualização do service worker (recarrega a página)
 */
export const forceUpdate = (): void => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  navigator.serviceWorker
    .getRegistration()
    .then(registration => {
      if (registration?.waiting) {
        // Envia mensagem para o service worker para pular a espera
        try {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } catch (error) {
          logger.warn('Erro ao enviar mensagem para service worker', 'pwa', error);
        }

        // Recarrega a página após um pequeno delay
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    })
    .catch(error => {
      logger.error('Erro ao forçar atualização do service worker', 'pwa', error);
    });
};
