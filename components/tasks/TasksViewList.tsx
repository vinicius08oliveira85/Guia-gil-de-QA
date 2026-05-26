import React from 'react';
import { X } from 'lucide-react';
import type { TaskTestStatus, TestCase } from '../../types';
import { TEST_STATUS_FILTER_OPTIONS } from './tasksViewHelpers';

export interface TasksViewListProps {
  statusFilter: string[];
  setStatusFilter: (v: string[] | ((prev: string[]) => string[])) => void;
  priorityFilter: string[];
  setPriorityFilter: (v: string[] | ((prev: string[]) => string[])) => void;
  typeFilter: string[];
  setTypeFilter: (v: string[] | ((prev: string[]) => string[])) => void;
  testStatusFilter: TaskTestStatus[];
  setTestStatusFilter: (
    v: TaskTestStatus[] | ((prev: TaskTestStatus[]) => TaskTestStatus[])
  ) => void;
  testCaseExecutionStatusFilter: TestCase['status'][];
  setTestCaseExecutionStatusFilter: (
    v: TestCase['status'][] | ((prev: TestCase['status'][]) => TestCase['status'][])
  ) => void;
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

const CASE_EXECUTION_LABEL: Record<TestCase['status'], string> = {
  'Not Run': 'Caso: Não executado',
  Passed: 'Caso: Passou',
  Failed: 'Caso: Falhou',
  Blocked: 'Caso: Bloqueado',
};

const QUALITY_LABELS: Record<string, string> = {
  'with-bdd': 'Com BDD',
  'without-bdd': 'Sem BDD',
  'with-tests': 'Com Testes',
  'without-tests': 'Sem Testes',
  automated: 'Automatizados',
  manual: 'Manuais',
};

const filterChipClass =
  'leve-neu-pill app-element-typography inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--leve-header-text-muted)]';

const filterChipBtnClass =
  'flex h-5 w-5 items-center justify-center rounded-full text-[var(--leve-header-text-muted)] transition-colors hover:text-[var(--leve-header-accent)]';

export const TasksViewList: React.FC<TasksViewListProps> = ({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  typeFilter,
  setTypeFilter,
  testStatusFilter,
  setTestStatusFilter,
  testCaseExecutionStatusFilter,
  setTestCaseExecutionStatusFilter,
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
      <div className="leve-neu-surface-inset flex flex-wrap items-center gap-2 p-2.5 sm:p-3">
        {statusFilter.map(s => (
          <span
            key={`status-${s}`}
            className={filterChipClass}
          >
            Status: {s}
            <button
              type="button"
              onClick={() => setStatusFilter(prev => prev.filter(x => x !== s))}
              className={filterChipBtnClass}
              aria-label={`Remover filtro Status: ${s}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {priorityFilter.map(p => (
          <span
            key={`priority-${p}`}
            className={filterChipClass}
          >
            Prioridade: {p}
            <button
              type="button"
              onClick={() => setPriorityFilter(prev => prev.filter(x => x !== p))}
              className={filterChipBtnClass}
              aria-label={`Remover filtro Prioridade: ${p}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {typeFilter.map(t => (
          <span
            key={`type-${t}`}
            className={filterChipClass}
          >
            Tipo: {t}
            <button
              type="button"
              onClick={() => setTypeFilter(prev => prev.filter(x => x !== t))}
              className={filterChipBtnClass}
              aria-label={`Remover filtro Tipo: ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {testStatusFilter.map(ts => {
          const opt = TEST_STATUS_FILTER_OPTIONS.find(o => o.value === ts);
          return (
            <span
              key={`testStatus-${ts}`}
              className={filterChipClass}
            >
              Teste: {opt?.label ?? ts}
              <button
                type="button"
                onClick={() => setTestStatusFilter(prev => prev.filter(x => x !== ts))}
                className={filterChipBtnClass}
                aria-label={`Remover filtro Teste: ${opt?.label ?? ts}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        {testCaseExecutionStatusFilter.map(st => (
          <span
            key={`caseExec-${st}`}
            className={filterChipClass}
          >
            {CASE_EXECUTION_LABEL[st]}
            <button
              type="button"
              onClick={() => setTestCaseExecutionStatusFilter(prev => prev.filter(x => x !== st))}
              className={filterChipBtnClass}
              aria-label={`Remover filtro ${CASE_EXECUTION_LABEL[st]}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {qualityFilter.map(q => (
          <span
            key={`quality-${q}`}
            className={filterChipClass}
          >
            Qualidade: {QUALITY_LABELS[q] ?? q}
            <button
              type="button"
              onClick={() => setQualityFilter(prev => prev.filter(x => x !== q))}
              className={filterChipBtnClass}
              aria-label={`Remover filtro Qualidade: ${QUALITY_LABELS[q] ?? q}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {searchQuery && (
          <span className={filterChipClass}>
            Busca: {searchQuery.length > 20 ? `${searchQuery.slice(0, 20)}…` : searchQuery}
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={filterChipBtnClass}
              aria-label="Remover filtro de busca"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={onClearAndCloseFilters}
          className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-error transition-colors hover:bg-error/10"
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
