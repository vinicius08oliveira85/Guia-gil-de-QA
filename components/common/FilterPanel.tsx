import React, { useState } from 'react';
import { FilterOptions } from '../../hooks/useFilters';

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
  availableTestTypes: string[];
  activeFiltersCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableTestTypes,
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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['test-types', 'test-results'])
  );

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
          Filtros rápidos
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

      <div className="space-y-3 grid-responsive">
        {availableTestTypes.length > 0 && (
          <FilterSection
            id="test-types"
            title="Estratégia de Teste"
            icon={
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3l4 4-4 4m4-4h8m-8 6l4 4-4 4m4-4h8" />
              </svg>
            }
              isExpanded={expandedSections.has('test-types')}
              onToggle={toggleSection}
            >
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {availableTestTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleArrayFilter('requiredTestTypes', type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filters.requiredTestTypes?.includes(type)
                      ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                      : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection
          id="test-results"
          title="Status dos Testes"
          icon={
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
            isExpanded={expandedSections.has('test-results')}
            onToggle={toggleSection}
          >
          <div className="flex flex-wrap gap-2">
            {['Aprovado', 'Reprovado'].map(result => (
              <button
                key={result}
                onClick={() => toggleArrayFilter('testResultStatus', result as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.testResultStatus?.includes(result as any)
                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
                }`}
              >
                {result}
              </button>
            ))}
          </div>
        </FilterSection>

      </div>
    </div>
  );
};

