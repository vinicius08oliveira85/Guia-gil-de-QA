/**
 * Serviço para gerenciar lógica do assistente virtual Rolaf
 */

import { QATip, getRandomTip, getTipsByContext, getTipById } from '../utils/rolafTips';
import { logger } from '../utils/logger';

export interface RolafPreferences {
  enabled: boolean;
  tipsFrequency: number; // minutos entre dicas
  lastTipShownAt?: number; // timestamp
  lastTipId?: string;
  recentTipIds: string[]; // IDs das últimas 10 dicas mostradas
  tourCompleted: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const DEFAULT_PREFERENCES: RolafPreferences = {
  enabled: true,
  tipsFrequency: 5, // 5 minutos
  recentTipIds: [],
  tourCompleted: false,
  position: 'bottom-right'
};

const STORAGE_KEY = 'rolaf_preferences';
const MAX_RECENT_TIPS = 10;

/**
 * Carrega preferências do localStorage
 */
export function loadRolafPreferences(): RolafPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    logger.error('Erro ao carregar preferências do Rolaf', error);
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Salva preferências no localStorage
 */
export function saveRolafPreferences(preferences: RolafPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    logger.error('Erro ao salvar preferências do Rolaf', error);
  }
}

/**
 * Verifica se é hora de mostrar uma nova dica
 */
export function shouldShowTip(preferences: RolafPreferences, currentTime: number = Date.now()): boolean {
  if (!preferences.enabled) return false;
  
  const { lastTipShownAt, tipsFrequency } = preferences;
  
  if (!lastTipShownAt) {
    // Primeira vez - mostrar após 2 minutos
    return true;
  }
  
  const timeSinceLastTip = (currentTime - lastTipShownAt) / (1000 * 60); // minutos
  return timeSinceLastTip >= tipsFrequency;
}

/**
 * Seleciona uma dica para mostrar
 */
export function selectTip(context?: string, excludeIds: string[] = []): QATip | null {
  const preferences = loadRolafPreferences();
  
  // Adiciona IDs recentes à lista de exclusão
  const allExcludeIds = [...excludeIds, ...preferences.recentTipIds];
  
  // Tenta encontrar dica contextual primeiro
  if (context) {
    const contextualTips = getTipsByContext(context);
    const availableContextual = contextualTips.filter(tip => !allExcludeIds.includes(tip.id));
    
    if (availableContextual.length > 0) {
      const selected = availableContextual[Math.floor(Math.random() * availableContextual.length)];
      return selected;
    }
  }
  
  // Se não encontrou contextual ou não há contexto, pega aleatória
  const tip = getRandomTip(allExcludeIds);
  return tip;
}

/**
 * Registra que uma dica foi mostrada
 */
export function markTipAsShown(tipId: string): void {
  const preferences = loadRolafPreferences();
  
  // Adiciona à lista de recentes
  const recentIds = [tipId, ...preferences.recentTipIds].slice(0, MAX_RECENT_TIPS);
  
  const updated: RolafPreferences = {
    ...preferences,
    lastTipShownAt: Date.now(),
    lastTipId: tipId,
    recentTipIds: recentIds
  };
  
  saveRolafPreferences(updated);
}

/**
 * Atualiza preferências
 */
export function updatePreferences(updates: Partial<RolafPreferences>): void {
  const current = loadRolafPreferences();
  const updated = { ...current, ...updates };
  saveRolafPreferences(updated);
}

/**
 * Reseta preferências para padrão
 */
export function resetPreferences(): void {
  saveRolafPreferences({ ...DEFAULT_PREFERENCES });
}

/**
 * Obtém contexto atual da aplicação baseado na rota/view
 */
export function getCurrentContext(pathname?: string, view?: string): string | undefined {
  // Se view fornecida diretamente, usa ela
  if (view) return view;
  
  // Tenta inferir do pathname
  if (!pathname) return undefined;
  
  if (pathname.includes('dashboard') || pathname === '/') return 'dashboard';
  if (pathname.includes('task') || pathname.includes('tarefa')) return 'creating-task';
  if (pathname.includes('test') || pathname.includes('teste')) return 'test-cases';
  if (pathname.includes('jira')) return 'jira';
  if (pathname.includes('document')) return 'documents';
  if (pathname.includes('analysis') || pathname.includes('analise')) return 'analysis';
  
  return undefined;
}

