/**
 * Sistema de cache simples para chamadas de API
 * Armazena resultados em localStorage com TTL (Time To Live)
 */
import { logger } from './logger';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live em milissegundos
}

const CACHE_PREFIX = 'api_cache_';

/**
 * Salva dados no cache
 */
export const setCache = <T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void => {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch (error) {
        logger.warn('Erro ao salvar no cache', 'apiCache', error);
    }
};

/**
 * Recupera dados do cache se ainda válidos
 */
export const getCache = <T>(key: string): T | null => {
    try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);
        const now = Date.now();
        const age = now - entry.timestamp;

        // Verificar se expirou
        if (age > entry.ttl) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }

        return entry.data;
    } catch (error) {
        logger.warn('Erro ao ler do cache', 'apiCache', error);
        return null;
    }
};

/**
 * Remove um item específico do cache
 */
export const clearCache = (key: string): void => {
    try {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
        logger.warn('Erro ao limpar cache', 'apiCache', error);
    }
};

/**
 * Limpa todo o cache
 */
export const clearAllCache = (): void => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        logger.warn('Erro ao limpar todo o cache', 'apiCache', error);
    }
};

/**
 * Verifica se uma chave existe no cache e ainda é válida
 */
export const hasCache = (key: string): boolean => {
    return getCache(key) !== null;
};

