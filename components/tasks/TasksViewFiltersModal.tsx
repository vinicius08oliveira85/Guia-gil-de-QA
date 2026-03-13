import React from 'react';
import { X } from 'lucide-react';
import type { TaskTestStatus } from '../../types';
import { TEST_STATUS_FILTER_OPTIONS } from './tasksViewHelpers';

const FilterChip = ({
    label,
    count,
    isActive,
    onClick,
}: {
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
            ${isActive
                ? 'bg-primary text-primary-content border-primary shadow-sm'
                : 'bg-base-100 text-base-content/70 border-base-300 hover:border-primary/50 hover:text-base-content'
            }
        `}
    >
        {label}
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-base-200'}`}>{count}</span>
    </button>
);

export interface TasksViewFiltersModalCounts {
    status: (statusName: string) => number;
    priority: (priorityName: string) => number;
    type: (type: string) => number;
    testStatus: (status: TaskTestStatus) => number;
    quality: (type: string) => number;
}

export interface TasksViewFiltersModalProps {
    statusOptions: string[];
    priorityOptions: string[];
    counts: TasksViewFiltersModalCounts;
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
    activeFiltersCount: number;
    onClearAll: () => void;
}

export const TasksViewFiltersModalContent: React.FC<TasksViewFiltersModalProps> = ({
    statusOptions,
    priorityOptions,
    counts,
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
    activeFiltersCount,
    onClearAll,
}) => (
    <>
        {activeFiltersCount > 0 && (
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={onClearAll}
                    className="text-xs text-error hover:text-error/80 font-medium flex items-center gap-1"
                >
                    <X className="w-3 h-3" /> Limpar todos
                </button>
            </div>
        )}
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">Status</p>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map(statusName => (
                        <FilterChip
                            key={statusName}
                            label={statusName}
                            count={counts.status(statusName)}
                            isActive={statusFilter.includes(statusName)}
                            onClick={() => setStatusFilter(prev => prev.includes(statusName) ? prev.filter(s => s !== statusName) : [...prev, statusName])}
                        />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">Prioridade</p>
                <div className="flex flex-wrap gap-2">
                    {priorityOptions.map(priorityName => (
                        <FilterChip
                            key={priorityName}
                            label={priorityName}
                            count={counts.priority(priorityName)}
                            isActive={priorityFilter.includes(priorityName)}
                            onClick={() => setPriorityFilter(prev => prev.includes(priorityName) ? prev.filter(p => p !== priorityName) : [...prev, priorityName])}
                        />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">Tipo de Tarefa</p>
                <div className="flex flex-wrap gap-2">
                    {['Tarefa', 'Bug', 'Epic', 'História'].map(type => (
                        <FilterChip
                            key={type}
                            label={type}
                            count={counts.type(type)}
                            isActive={typeFilter.includes(type)}
                            onClick={() => setTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                        />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">Status de Teste</p>
                <div className="flex flex-wrap gap-2">
                    {TEST_STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                        <FilterChip
                            key={value}
                            label={label}
                            count={counts.testStatus(value)}
                            isActive={testStatusFilter.includes(value)}
                            onClick={() => setTestStatusFilter(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value])}
                        />
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">Estado de Qualidade</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'with-bdd', label: 'Com BDD' },
                        { id: 'without-bdd', label: 'Sem BDD' },
                        { id: 'with-tests', label: 'Com Testes' },
                        { id: 'without-tests', label: 'Sem Testes' },
                        { id: 'automated', label: 'Automatizados' },
                        { id: 'manual', label: 'Manuais' },
                    ].map(q => (
                        <FilterChip
                            key={q.id}
                            label={q.label}
                            count={counts.quality(q.id)}
                            isActive={qualityFilter.includes(q.id)}
                            onClick={() => setQualityFilter(prev => prev.includes(q.id) ? prev.filter(i => i !== q.id) : [...prev, q.id])}
                        />
                    ))}
                </div>
            </div>
        </div>
    </>
);
