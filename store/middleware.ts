import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { logger } from '../utils/logger';

/**
 * Middleware para logging de ações do store
 * Registra todas as mudanças de estado para debugging
 */
export const loggerMiddleware = <T extends object>(
  config: StateCreator<T>,
  name?: string
): StateCreator<T> => {
  return (set, get, api) => {
    const storeName = name || 'Store';
    
    return config(
      (...args) => {
        const result = set(...args);
        const newState = get();
        
        logger.debug(
          `[${storeName}] State updated`,
          'Store',
          { state: newState }
        );
        
        return result;
      },
      get,
      api
    );
  };
};

/**
 * Middleware para persistência no localStorage
 * Salva estado automaticamente quando há mudanças
 */
export const persistMiddleware = <T extends object>(
  config: StateCreator<T>,
  options: {
    name: string;
    include?: (keyof T)[];
    exclude?: (keyof T)[];
  }
): StateCreator<T> => {
  const storageKey = `store_${options.name}`;
  
  return (set, get, api) => {
    // Carregar estado inicial do localStorage
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Aplicar estado salvo antes de configurar o store
        Object.assign(get() as object, parsed);
      }
    } catch (error) {
      logger.warn(`Failed to load persisted state for ${options.name}`, 'Store', error);
    }
    
    return config(
      (...args) => {
        const result = set(...args);
        const newState = get();
        
        // Filtrar o que deve ser persistido
        let stateToPersist: Partial<T> = newState;
        
        if (options.include) {
          stateToPersist = {} as Partial<T>;
          options.include.forEach((key) => {
            stateToPersist[key] = newState[key];
          });
        } else if (options.exclude) {
          stateToPersist = { ...newState };
          options.exclude.forEach((key) => {
            delete stateToPersist[key];
          });
        }
        
        // Salvar no localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
        } catch (error) {
          logger.warn(`Failed to persist state for ${options.name}`, 'Store', error);
        }
        
        return result;
      },
      get,
      api
    );
  };
};

