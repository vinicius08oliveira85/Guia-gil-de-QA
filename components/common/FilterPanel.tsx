import React from 'react';
import { FilterOptions } from '../../hooks/useFilters';
import { DEFAULT_TAGS, TAG_COLORS } from '../../utils/tagService';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  onClearFilters: () => void;
  availableTags: string[];
  activeFiltersCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableTags,
  activeFiltersCount
}) => {
  const toggleArrayFilter = <K extends keyof FilterOptions>(
    key: K,
    value: any
  ) => {
    const current = (filters[key] as any[]) || [];
    if (current.includes(value)) {
      onFilterChange(key, current.filter(v => v !== value) as any);
    } else {
      onFilterChange(key, [...current, value] as any);
    }
  };

  return (
    <div className="mica rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          🔍 Filtros
          {activeFiltersCount > 0 && (
            <span className="text-sm bg-accent text-white px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Limpar todos
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Filtro por Status */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {['To Do', 'In Progress', 'Done'].map(status => (
              <button
                key={status}
                onClick={() => toggleArrayFilter('status', status)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filters.status?.includes(status as any)
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Tipo */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {['Epic', 'História', 'Tarefa', 'Bug'].map(type => (
              <button
                key={type}
                onClick={() => toggleArrayFilter('type', type)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filters.type?.includes(type as any)
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Tags */}
        {availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleArrayFilter('tags', tag)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${
                    filters.tags?.includes(tag)
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                  }`}
                  style={{
                    borderColor: filters.tags?.includes(tag) ? TAG_COLORS[tag] || '#64748b' : undefined
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TAG_COLORS[tag] || '#64748b' }}
                  />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtro por Prioridade */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Prioridade</label>
          <div className="flex flex-wrap gap-2">
            {['Baixa', 'Média', 'Alta', 'Urgente'].map(priority => (
              <button
                key={priority}
                onClick={() => toggleArrayFilter('priority', priority)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filters.priority?.includes(priority as any)
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Severidade */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Severidade</label>
          <div className="flex flex-wrap gap-2">
            {['Crítico', 'Alto', 'Médio', 'Baixo'].map(severity => (
              <button
                key={severity}
                onClick={() => toggleArrayFilter('severity', severity)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filters.severity?.includes(severity as any)
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Busca */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Buscar</label>
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="ID, título, descrição..."
            className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Filtros booleanos */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Filtros Especiais</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasTestCases === true}
                onChange={(e) => onFilterChange('hasTestCases', e.target.checked ? true : undefined)}
                className="rounded"
              />
              <span>Com casos de teste</span>
            </label>
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasBddScenarios === true}
                onChange={(e) => onFilterChange('hasBddScenarios', e.target.checked ? true : undefined)}
                className="rounded"
              />
              <span>Com cenários BDD</span>
            </label>
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isAutomated === true}
                onChange={(e) => onFilterChange('isAutomated', e.target.checked ? true : undefined)}
                className="rounded"
              />
              <span>Apenas automatizados</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

