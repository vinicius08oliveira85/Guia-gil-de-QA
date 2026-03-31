import { logger } from '../utils/logger';

/**
 * Após falhas transitórias (503, timeout, cold start), pausa chamadas ao proxy/Supabase
 * para reduzir spam no console e na rede. Dados locais (IndexedDB) seguem ativos.
 * Sincronização manual no header chama clearSupabaseRemotePause() antes de tentar de novo.
 */
const REMOTE_PAUSE_MS = 60_000;

let remotePausedUntil = 0;

export function isSupabaseRemotePaused(): boolean {
  return Date.now() < remotePausedUntil;
}

export function pauseSupabaseRemoteAfterTransientFailure(): void {
  const wasPaused = Date.now() < remotePausedUntil;
  remotePausedUntil = Date.now() + REMOTE_PAUSE_MS;
  if (!wasPaused) {
    logger.debug(
      `Supabase remoto em pausa (${REMOTE_PAUSE_MS / 1000}s) após falha transitória; dados locais ativos. Use "Sincronizar" para forçar nova tentativa.`,
      'supabaseCircuitBreaker'
    );
  }
}

export function clearSupabaseRemotePause(): void {
  remotePausedUntil = 0;
}
