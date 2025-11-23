import React, { useState } from 'react';
import { FilterOptions } from '../../hooks/useFilters';
import { TAG_COLORS } from '../../utils/tagService';

interface FilterSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  id,
  title,
  icon,
  children,
  isExpanded,
  onToggle
}) => {
  const contentId = `filter-section-${id}`;

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-3 bg-surface-hover/50 hover:bg-surface-hover transition-colors"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div id={contentId} className="p-3 bg-surface/50">
          {children}
        </div>
      )}
    </div>
  );
};

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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['status', 'type', 'priority', 'search']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {activeFiltersCount > 0 && (
            <span className="text-xs bg-accent text-white px-2 py-1 rounded-full font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-accent hover:text-accent-light transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar todos
          </button>
        )}
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Filtro por Status */}
        <FilterSection
          id="status"
          title="Status"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
            isExpanded={expandedSections.has('status')}
            onToggle={toggleSection}
          >
          <div className="flex flex-wrap gap-2">
            {['To Do', 'In Progress', 'Done'].map(status => (
              <button
                key={status}
                onClick={() => toggleArrayFilter('status', status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.status?.includes(status as any)
                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Filtro por Tipo */}
        <FilterSection
          id="type"
          title="Tipo"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
            isExpanded={expandedSections.has('type')}
            onToggle={toggleSection}
          >
          <div className="flex flex-wrap gap-2">
            {['Epic', 'História', 'Tarefa', 'Bug'].map(type => (
              <button
                key={type}
                onClick={() => toggleArrayFilter('type', type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.type?.includes(type as any)
                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Filtro por Tags */}
        {availableTags.length > 0 && (
          <FilterSection
            id="tags"
            title="Tags"
            icon={
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
              isExpanded={expandedSections.has('tags')}
              onToggle={toggleSection}
            >
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleArrayFilter('tags', tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    filters.tags?.includes(tag)
                      ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                      : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                  }`}
                  style={{
                    borderColor: filters.tags?.includes(tag) ? TAG_COLORS[tag] || '#64748b' : undefined
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TAG_COLORS[tag] || '#64748b' }}
                  />
                  {tag}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Filtro por Prioridade */}
        <FilterSection
          id="priority"
          title="Prioridade"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
            isExpanded={expandedSections.has('priority')}
            onToggle={toggleSection}
          >
          <div className="flex flex-wrap gap-2">
            {['Baixa', 'Média', 'Alta', 'Urgente'].map(priority => (
              <button
                key={priority}
                onClick={() => toggleArrayFilter('priority', priority)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.priority?.includes(priority as any)
                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Filtro por Severidade */}
        <FilterSection
          id="severity"
          title="Severidade"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
            isExpanded={expandedSections.has('severity')}
            onToggle={toggleSection}
          >
          <div className="flex flex-wrap gap-2">
            {['Crítico', 'Alto', 'Médio', 'Baixo'].map(severity => (
              <button
                key={severity}
                onClick={() => toggleArrayFilter('severity', severity)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.severity?.includes(severity as any)
                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Filtro por Busca */}
        <FilterSection
          id="search"
          title="Buscar"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
            isExpanded={expandedSections.has('search')}
            onToggle={toggleSection}
          >
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="ID, título, descrição..."
            className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </FilterSection>

        {/* Filtros booleanos */}
        <FilterSection
          id="special"
          title="Filtros Especiais"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
            isExpanded={expandedSections.has('special')}
            onToggle={toggleSection}
          >
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-text-primary cursor-pointer hover:text-accent transition-colors p-2 rounded-lg hover:bg-surface-hover">
              <input
                type="checkbox"
                checked={filters.hasTestCases === true}
                onChange={(e) => onFilterChange('hasTestCases', e.target.checked ? true : undefined)}
                className="w-4 h-4 rounded border-surface-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm">Com casos de teste</span>
            </label>
            <label className="flex items-center gap-2.5 text-text-primary cursor-pointer hover:text-accent transition-colors p-2 rounded-lg hover:bg-surface-hover">
              <input
                type="checkbox"
                checked={filters.hasBddScenarios === true}
                onChange={(e) => onFilterChange('hasBddScenarios', e.target.checked ? true : undefined)}
                className="w-4 h-4 rounded border-surface-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm">Com cenários BDD</span>
            </label>
            <label className="flex items-center gap-2.5 text-text-primary cursor-pointer hover:text-accent transition-colors p-2 rounded-lg hover:bg-surface-hover">
              <input
                type="checkbox"
                checked={filters.isAutomated === true}
                onChange={(e) => onFilterChange('isAutomated', e.target.checked ? true : undefined)}
                className="w-4 h-4 rounded border-surface-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm">Apenas automatizados</span>
            </label>
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

