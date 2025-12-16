import React from 'react';
import { FilterOptions } from '../../hooks/useFilters';
import { Badge } from './Badge';

interface QuickFiltersProps {
    filters: FilterOptions;
    activeFiltersCount: number;
    onFilterChange: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
    onClearFilters: () => void;
    onRemoveFilter: (key: keyof FilterOptions) => void;
}

/**
 * Componente de filtros rápidos visíveis como chips na parte superior
 * Mostra filtros ativos e permite adicionar/remover rapidamente
 */
export const QuickFilters: React.FC<QuickFiltersProps> = ({
    filters,
    activeFiltersCount,
    onFilterChange,
    onClearFilters,
    onRemoveFilter,
}) => {
    const getFilterChips = () => {
        const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

        // Status
        if (filters.status && filters.status.length > 0) {
            filters.status.forEach(status => {
                chips.push({
                    key: `status-${status}`,
                    label: `Status: ${status}`,
                    value: status,
                    onRemove: () => {
                        const newStatus = filters.status!.filter(s => s !== status);
                        if (newStatus.length === 0) {
                            onRemoveFilter('status');
                        } else {
                            onFilterChange('status', newStatus);
                        }
                    }
                });
            });
        }

        // Tipo
        if (filters.type && filters.type.length > 0) {
            filters.type.forEach(type => {
                chips.push({
                    key: `type-${type}`,
                    label: `Tipo: ${type}`,
                    value: type,
                    onRemove: () => {
                        const newType = filters.type!.filter(t => t !== type);
                        if (newType.length === 0) {
                            onRemoveFilter('type');
                        } else {
                            onFilterChange('type', newType);
                        }
                    }
                });
            });
        }

        // Tags
        if (filters.tags && filters.tags.length > 0) {
            filters.tags.forEach(tag => {
                chips.push({
                    key: `tag-${tag}`,
                    label: `Tag: ${tag}`,
                    value: tag,
                    onRemove: () => {
                        const newTags = filters.tags!.filter(t => t !== tag);
                        if (newTags.length === 0) {
                            onRemoveFilter('tags');
                        } else {
                            onFilterChange('tags', newTags);
                        }
                    }
                });
            });
        }

        // Prioridade
        if (filters.priority && filters.priority.length > 0) {
            filters.priority.forEach(priority => {
                chips.push({
                    key: `priority-${priority}`,
                    label: `Prioridade: ${priority}`,
                    value: priority,
                    onRemove: () => {
                        const newPriority = filters.priority!.filter(p => p !== priority);
                        if (newPriority.length === 0) {
                            onRemoveFilter('priority');
                        } else {
                            onFilterChange('priority', newPriority);
                        }
                    }
                });
            });
        }

        // Severidade
        if (filters.severity && filters.severity.length > 0) {
            filters.severity.forEach(severity => {
                chips.push({
                    key: `severity-${severity}`,
                    label: `Severidade: ${severity}`,
                    value: severity,
                    onRemove: () => {
                        const newSeverity = filters.severity!.filter(s => s !== severity);
                        if (newSeverity.length === 0) {
                            onRemoveFilter('severity');
                        } else {
                            onFilterChange('severity', newSeverity);
                        }
                    }
                });
            });
        }

        // Test Result Status
        if (filters.testResultStatus && filters.testResultStatus.length > 0) {
            filters.testResultStatus.forEach(status => {
                chips.push({
                    key: `testResult-${status}`,
                    label: `Teste: ${status}`,
                    value: status,
                    onRemove: () => {
                        const newStatus = filters.testResultStatus!.filter(s => s !== status);
                        if (newStatus.length === 0) {
                            onRemoveFilter('testResultStatus');
                        } else {
                            onFilterChange('testResultStatus', newStatus);
                        }
                    }
                });
            });
        }

        // Required Test Types
        if (filters.requiredTestTypes && filters.requiredTestTypes.length > 0) {
            filters.requiredTestTypes.forEach(type => {
                chips.push({
                    key: `testType-${type}`,
                    label: `Estratégia: ${type}`,
                    value: type,
                    onRemove: () => {
                        const newTypes = filters.requiredTestTypes!.filter(t => t !== type);
                        if (newTypes.length === 0) {
                            onRemoveFilter('requiredTestTypes');
                        } else {
                            onFilterChange('requiredTestTypes', newTypes);
                        }
                    }
                });
            });
        }

        // Boolean filters
        if (filters.hasTestCases !== undefined) {
            chips.push({
                key: 'hasTestCases',
                label: filters.hasTestCases ? 'Com casos de teste' : 'Sem casos de teste',
                value: 'hasTestCases',
                onRemove: () => onRemoveFilter('hasTestCases')
            });
        }

        if (filters.hasBddScenarios !== undefined) {
            chips.push({
                key: 'hasBddScenarios',
                label: filters.hasBddScenarios ? 'Com BDD' : 'Sem BDD',
                value: 'hasBddScenarios',
                onRemove: () => onRemoveFilter('hasBddScenarios')
            });
        }

        if (filters.isAutomated !== undefined) {
            chips.push({
                key: 'isAutomated',
                label: filters.isAutomated ? 'Automatizado' : 'Não automatizado',
                value: 'isAutomated',
                onRemove: () => onRemoveFilter('isAutomated')
            });
        }

        // Search query
        if (filters.searchQuery) {
            chips.push({
                key: 'searchQuery',
                label: `Busca: "${filters.searchQuery}"`,
                value: filters.searchQuery,
                onRemove: () => onRemoveFilter('searchQuery')
            });
        }

        return chips;
    };

    const filterChips = getFilterChips();

    if (activeFiltersCount === 0) {
        return null;
    }

    return (
        <div className="rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="font-medium">
                        {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {filterChips.map(chip => {
                        // Determina variante baseado no tipo de filtro
                        const getVariant = (key: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
                            if (key.includes('priority') || key.includes('severity')) {
                                if (chip.value.includes('Crítica') || chip.value.includes('Crítico')) return 'error';
                                if (chip.value.includes('Alta') || chip.value.includes('Alto')) return 'warning';
                                return 'info';
                            }
                            if (key.includes('status')) {
                                if (chip.value.includes('Failed') || chip.value.includes('Erro')) return 'error';
                                if (chip.value.includes('Passed') || chip.value.includes('Success')) return 'success';
                                return 'info';
                            }
                            return 'default';
                        };

                        return (
                            <Badge
                                key={chip.key}
                                variant={getVariant(chip.key)}
                                size="sm"
                                dismissible
                                onDismiss={chip.onRemove}
                                className="max-w-[240px]"
                            >
                                {chip.label}
                            </Badge>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={onClearFilters}
                    className="btn btn-ghost btn-xs ml-auto"
                >
                    Limpar
                </button>
            </div>
        </div>
    );
};

