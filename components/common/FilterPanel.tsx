import React, { useState } from 'react';
import { FilterOptions } from '../../hooks/useFilters';
import { cn } from '../../utils/windows12Styles';

interface FilterSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

/**
 * Seção de filtro expansível com design Windows 12
 */
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
    <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-800/30 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-slate-200">{title}</span>
        </div>
        <svg 
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div id={contentId} className="p-3 bg-slate-900/50">
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

/**
 * Painel de filtros com design Windows 12
 * Suporta filtros por tipo de teste e status
 */
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-100 bg-clip-text text-transparent flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros rápidos
          {activeFiltersCount > 0 && (
            <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2.5 py-1 rounded-full font-semibold shadow-sm shadow-cyan-500/30">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 group"
          >
            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar todos
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-3 grid-responsive">
        {availableTestTypes.length > 0 && (
          <FilterSection
            id="test-types"
            title="Estratégia de Teste"
            icon={
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    filters.requiredTestTypes?.includes(type)
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/30 border border-cyan-400/50'
                      : 'bg-slate-800/60 border border-slate-600/50 text-slate-300 hover:bg-slate-700/60 hover:border-cyan-500/30 hover:text-slate-100'
                  )}
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
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          isExpanded={expandedSections.has('test-results')}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'Aprovado', color: 'emerald' },
              { value: 'Reprovado', color: 'rose' }
            ].map(({ value, color }) => {
              const isSelected = filters.testResultStatus?.includes(value as any);
              return (
                <button
                  key={value}
                  onClick={() => toggleArrayFilter('testResultStatus', value as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isSelected
                      ? color === 'emerald'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-500/30 border border-emerald-400/50'
                        : 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/30 border border-rose-400/50'
                      : 'bg-slate-800/60 border border-slate-600/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/60 hover:text-slate-100'
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );
};
