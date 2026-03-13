import React from 'react';
import { X } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { TEST_STATUS_FILTER_OPTIONS } from './tasksViewHelpers';

export interface TasksViewListProps {
    statusFilter: string[];
    setStatusFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    priorityFilter: string[];
    setPriorityFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    typeFilter: string[];
    setTypeFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    testStatusFilter: TaskTestStatus[];
    setTestStatusFilter: (v: TaskTestStatus[] | ((prev: TaskTestStatus[]) => TaskTestStatus[])) => void;
    qualityFilter: string[];
    setQualityFilter: (v: string[] | ((prev: string[]) => string[])) => void;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    activeFiltersCount: number;
    clearAllFilters: () => void;
    onClearAndCloseFilters: () => void;
    filteredCount: number;
    totalCount: number;
    hasActiveFiltersOrSearch: boolean;
    children: React.ReactNode;
}

const QUALITY_LABELS: Record<string, string> = {
    'with-bdd': 'Com BDD',
    'without-bdd': 'Sem BDD',
    'with-tests': 'Com Testes',
    'without-tests': 'Sem Testes',
    automated: 'Automatizados',
    manual: 'Manuais',
};

export const TasksViewList: React.FC<TasksViewListProps> = ({
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    typeFilter,
    setTypeFilter,
    testStatusFilter,
    setTestStatusFilter,
    qualityFilter,
    setQualityFilter,
    searchQuery,
    setSearchQuery,
    activeFiltersCount,
    clearAllFilters,
    onClearAndCloseFilters,
    filteredCount,
    totalCount,
    hasActiveFiltersOrSearch,
    children,
}) => (
    <>
        {hasActiveFiltersOrSearch && (
            <div className="flex flex-wrap items-center gap-2">
                {statusFilter.map((s) => (
                    <span
                        key={`status-${s}`}
                        className="badge badge-primary badge-outline gap-1 pr-1 py-2 text-xs font-medium"
                    >
                        Status: {s}
                        <button
                            type="button"
                            onClick={() => setStatusFilter((prev) => prev.filter((x) => x !== s))}
                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-5 w-5 rounded-full hover:bg-primary/20"
                            aria-label={`Remover filtro Status: ${s}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {priorityFilter.map((p) => (
                    <span
                        key={`priority-${p}`}
                        className="badge badge-primary badge-outline gap-1 pr-1 py-2 text-xs font-medium"
                    >
                        Prioridade: {p}
                        <button
                            type="button"
                            onClick={() => setPriorityFilter((prev) => prev.filter((x) => x !== p))}
                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-5 w-5 rounded-full hover:bg-primary/20"
                            aria-label={`Remover filtro Prioridade: ${p}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {typeFilter.map((t) => (
                    <span
                        key={`type-${t}`}
                        className="badge badge-primary badge-outline gap-1 pr-1 py-2 text-xs font-medium"
                    >
                        Tipo: {t}
                        <button
                            type="button"
                            onClick={() => setTypeFilter((prev) => prev.filter((x) => x !== t))}
                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-5 w-5 rounded-full hover:bg-primary/20"
                            aria-label={`Remover filtro Tipo: ${t}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {testStatusFilter.map((ts) => {
                    const opt = TEST_STATUS_FILTER_OPTIONS.find((o) => o.value === ts);
                    return (
                        <span
                            key={`testStatus-${ts}`}
                            className="badge badge-primary badge-outline gap-1 pr-1 py-2 text-xs font-medium"
                        >
                            Teste: {opt?.label ?? ts}
                            <button
                                type="button"
                                onClick={() => setTestStatusFilter((prev) => prev.filter((x) => x !== ts))}
                                className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-5 w-5 rounded-full hover:bg-primary/20"
                                aria-label={`Remover filtro Teste: ${opt?.label ?? ts}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    );
                })}
                {qualityFilter.map((q) => (
                    <span
                        key={`quality-${q}`}
                        className="badge badge-primary badge-outline gap-1 pr-1 py-2 text-xs font-medium"
                    >
                        Qualidade: {QUALITY_LABELS[q] ?? q}
                        <button
                            type="button"
                            onClick={() => setQualityFilter((prev) => prev.filter((x) => x !== q))}
                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-5 w-5 rounded-full hover:bg-primary/20"
                            aria-label={`Remover filtro Qualidade: ${QUALITY_LABELS[q] ?? q}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {searchQuery && (
                    <span className="badge badge-primary badge-outline gap-1 pr-1 py-2 text-xs font-medium">
                        Busca: {searchQuery.length > 20 ? `${searchQuery.slice(0, 20)}…` : searchQuery}
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-5 w-5 rounded-full hover:bg-primary/20"
                            aria-label="Remover filtro de busca"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}
                <button
                    type="button"
                    onClick={onClearAndCloseFilters}
                    className="btn btn-ghost btn-sm text-error hover:bg-error/10 text-xs font-medium"
                >
                    <X className="w-3 h-3 mr-1" />
                    Limpar todos
                </button>
            </div>
        )}

        {hasActiveFiltersOrSearch && (
            <p className="text-sm text-base-content/70">
                Exibindo {filteredCount} de {totalCount} tarefas
            </p>
        )}

        {children}
    </>
);
