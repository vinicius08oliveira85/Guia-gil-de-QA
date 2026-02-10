/**
 * Hook para gerenciar estado e comportamento do assistente virtual Rolaf
 */

/**
 * Anuncia uma mensagem para leitores de tela usando uma região aria-live.
 * Baseado na "Recomendação 6: Adicionar Anúncios para Leitores de Tela" do relatório de UI/UX.
 * @param message A mensagem a ser anunciada.
 * @param priority A prioridade do anúncio ('polite' ou 'assertive').
 */
const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const region = document.getElementById('aria-live-region');
  if (region) {
    region.setAttribute('aria-live', priority);
    region.textContent = message;
    setTimeout(() => { if (region.textContent === message) { region.textContent = ''; } }, 1000);
  }
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RolafPreferences, 
  selectTip, 
  shouldShowTip, 
  markTipAsShown,
  loadRolafPreferences,
  updatePreferences,
  getCurrentContext
} from '../services/rolafService';
import { QATip } from '../utils/rolafTips';
import { logger } from '../utils/logger';

export type RolafState = 'hidden' | 'showing-tip' | 'showing-tour' | 'minimized';

export interface UseRolafReturn {
  state: RolafState;
  currentTip: QATip | null;
  preferences: RolafPreferences;
  isVisible: boolean;
  showTip: (context?: string) => void;
  hideTip: () => void;
  startTour: () => void;
  stopTour: () => void;
  minimize: () => void;
  maximize: () => void;
  updateRolafPreferences: (updates: Partial<RolafPreferences>) => void;
  toggleEnabled: () => void;
}

const TIP_CHECK_INTERVAL = 60000; // Verificar a cada 1 minuto

export function useRolaf(currentView?: string): UseRolafReturn {
  const [state, setState] = useState<RolafState>('hidden');
  const [currentTip, setCurrentTip] = useState<QATip | null>(null);
  const [preferences, setPreferences] = useState<RolafPreferences>(loadRolafPreferences());
  const intervalRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Atualiza preferências localmente e no storage
  const updateRolafPreferences = useCallback((updates: Partial<RolafPreferences>) => {
    updatePreferences(updates);
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Mostra uma dica
  const showTip = useCallback((context?: string) => {
    if (!preferences.enabled) return;
    
    const tipContext = context || getCurrentContext(window.location.pathname, currentView);
    const tip = selectTip(tipContext, preferences.recentTipIds);
    
    if (tip) {
      setCurrentTip(tip);
      setState('showing-tip');
      markTipAsShown(tip.id);
      updateRolafPreferences({ lastTipShownAt: Date.now(), lastTipId: tip.id });
      
      // Anuncia para leitores de tela
      announce(`Nova dica: ${tip.title}`, 'polite');
      
      // Atualiza lista de recentes
      const recentIds = [tip.id, ...preferences.recentTipIds].slice(0, 10);
      updateRolafPreferences({ recentTipIds: recentIds });
    }
  }, [preferences.enabled, preferences.recentTipIds, currentView, updateRolafPreferences]);

  // Esconde a dica atual
  const hideTip = useCallback(() => {
    setState('hidden');
    setCurrentTip(null);
    announce('Dica fechada.', 'polite');
  }, []);

  // Inicia o tour
  const startTour = useCallback(() => {
    if (!preferences.enabled) return;
    setState('showing-tour');
    announce('Iniciando o tour guiado.', 'polite');
  }, [preferences.enabled]);

  // Para o tour
  const stopTour = useCallback(() => {
    setState('hidden');
    updateRolafPreferences({ tourCompleted: true });
    announce('Tour guiado finalizado.', 'polite');
  }, [updateRolafPreferences]);

  // Minimiza o Rolaf
  const minimize = useCallback(() => {
    setState('minimized');
  }, []);

  // Maximiza o Rolaf
  const maximize = useCallback(() => {
    if (currentTip) {
      setState('showing-tip');
    } else {
      showTip();
    }
  }, [currentTip, showTip]);

  // Toggle enabled
  const toggleEnabled = useCallback(() => {
    const newEnabled = !preferences.enabled;
    updateRolafPreferences({ enabled: newEnabled });
    
    if (!newEnabled) {
      hideTip();
    } else {
      // Se ativou, mostra dica após um pequeno delay
      setTimeout(() => showTip(), 2000);
    }
  }, [preferences.enabled, updateRolafPreferences, hideTip, showTip]);

  // Rastreia atividade do usuário
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Verifica periodicamente se deve mostrar dica
  useEffect(() => {
    if (!preferences.enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verifica imediatamente se deve mostrar
    const checkAndShow = () => {
      const now = Date.now();
      const timeSinceActivity = (now - lastActivityRef.current) / 1000; // segundos
      
      // Só mostra se usuário esteve ativo nos últimos 30 segundos
      if (timeSinceActivity > 30) return;
      
      if (shouldShowTip(preferences, now) && state === 'hidden') {
        showTip();
      }
    };

    // Verifica imediatamente
    checkAndShow();

    // Configura intervalo
    intervalRef.current = window.setInterval(checkAndShow, TIP_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [preferences.enabled, preferences.lastTipShownAt, preferences.tipsFrequency, state, showTip]);

  // Carrega preferências ao montar
  useEffect(() => {
    const loaded = loadRolafPreferences();
    setPreferences(loaded);
    
    // Se tour não foi completado e é primeira vez, inicia tour após delay
    if (!loaded.tourCompleted && loaded.enabled) {
      const timer = setTimeout(() => {
        startTour();
      }, 3000); // 3 segundos após carregar
      
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  const isVisible = state !== 'hidden';

  return {
    state,
    currentTip,
    preferences,
    isVisible,
    showTip,
    hideTip,
    startTour,
    stopTour,
    minimize,
    maximize,
    updateRolafPreferences,
    toggleEnabled
  };
}
