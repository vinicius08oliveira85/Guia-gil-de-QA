import React, { useState } from 'react';
import { FilterOptions } from '../../hooks/useFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { ModernIcons } from './ModernIcons';
import { cn } from '../../utils/cn';
import { appPanelClass } from './viewUi';

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
  onToggle,
}) => {
  const contentId = `filter-section-${id}`;

  return (
    <div
      className={cn(
        appPanelClass,
        'overflow-hidden transition-[box-shadow] duration-200 hover:shadow-[var(--leve-neu-hover)]'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="app-element-typography group flex w-full items-center justify-between p-4 transition-[box-shadow] duration-200 hover:shadow-[var(--leve-neu-inset)]"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-3">
          <div className="leve-neu-pill p-1.5 transition-[box-shadow] group-hover:shadow-[var(--leve-neu-hover)]">
            {icon}
          </div>
          <span className="text-sm font-semibold text-base-content">{title}</span>
        </div>
        <motion.svg
          className="h-4 w-4 text-base-content/72"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="leve-neu-surface-inset border-0 border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  activeFiltersCount,
}) => {
  const toggleArrayFilter = <K extends keyof FilterOptions>(key: K, value: any) => {
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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-base-content flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <ModernIcons.Filter className="text-primary" size={18} />
          </div>
          Filtros rápidos
          {activeFiltersCount > 0 && (
            <motion.span
              className="badge badge-primary badge-sm rounded-full px-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {activeFiltersCount}
            </motion.span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            onClick={onClearFilters}
            size="sm"
            variant="ghost"
            className="text-xs hover:bg-error/10 hover:text-error transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpar todos
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {availableTestTypes.length > 0 && (
          <FilterSection
            id="test-types"
            title="Estratégia de Teste"
            icon={<ModernIcons.TestStrategy className="text-primary" size={16} />}
            isExpanded={expandedSections.has('test-types')}
            onToggle={toggleSection}
          >
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              {availableTestTypes.map(type => {
                const isActive = filters.requiredTestTypes?.includes(type);
                return (
                  <motion.button
                    key={type}
                    onClick={() => toggleArrayFilter('requiredTestTypes', type)}
                    className={`btn btn-sm rounded-full whitespace-nowrap ${
                      isActive
                        ? 'btn-primary bg-primary text-primary-content shadow-sm'
                        : 'btn-outline hover:bg-primary/5 hover:border-primary/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {type}
                  </motion.button>
                );
              })}
            </div>
          </FilterSection>
        )}

        <FilterSection
          id="test-results"
          title="Status dos Testes"
          icon={<ModernIcons.TestStatus className="text-primary" size={16} />}
          isExpanded={expandedSections.has('test-results')}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {['Aprovado', 'Reprovado'].map(result => {
              const isActive = filters.testResultStatus?.includes(result as any);
              return (
                <motion.button
                  key={result}
                  onClick={() => toggleArrayFilter('testResultStatus', result as any)}
                  className={`btn btn-sm rounded-full whitespace-nowrap ${
                    isActive
                      ? 'btn-primary bg-primary text-primary-content shadow-sm'
                      : 'btn-outline hover:bg-primary/5 hover:border-primary/30'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {result}
                </motion.button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );
};
