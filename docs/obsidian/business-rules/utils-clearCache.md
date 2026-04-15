---
tag: business-rule
status: active
file_origin: utils/apiCache.ts
---

# Sistema de cache simples para chamadas de API Armazena resultados em localStorag

**Descrição:** Sistema de cache simples para chamadas de API Armazena resultados em localStorage com TTL (Time To Live) / import { logger } from './logger'; interface CacheEntry<T> { data: T; timestamp: number; ttl: number; // Time to live em milissegundos } const CACHE_PREFIX = 'api_cache_'; /** Salva dados no cache / export const setCache = <T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void => { try { const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }; localStorage.setItem(`${CACHE_P

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
