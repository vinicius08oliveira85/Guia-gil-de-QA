import { useState, useEffect } from 'react';
import { FilterOptions } from './useFilters';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook para persistir filtros no localStorage
 * Mantém os filtros entre sessões e navegações
 */
export const usePersistedFilters = (projectId: string) => {
  const storageKey = `filters_${projectId}`;
  const [storedFilters, setStoredFilters] = useLocalStorage<FilterOptions>(storageKey, {});

  const [filters, setFilters] = useState<FilterOptions>(storedFilters);

  // Sincronizar com localStorage quando filters mudarem
  useEffect(() => {
    setStoredFilters(filters);
  }, [filters, setStoredFilters]);

  // Carregar filtros salvos quando o projeto mudar
  useEffect(() => {
    setFilters(storedFilters);
  }, [projectId]); // Apenas quando projectId mudar

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const removeFilter = (key: keyof FilterOptions) => {
    setFilters(prev => {
      if (!(key in prev)) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    removeFilter,
    setFilters,
  };
};
