import React from 'react';
import { X } from 'lucide-react';
import type { BugSeverity, TaskTestStatus, TestCase } from '../../types';
import {
  tasksPanelActiveFilterChipBtnClass,
  tasksPanelActiveFilterChipClass,
  tasksPanelActiveFiltersBarClass,
  tasksPanelActiveFiltersClearClass,
  tasksPanelListCountClass,
} from './tasksPanelNeuStyles';
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
  bugSeverityFilter: BugSeverity[];
  setBugSeverityFilter: (v: BugSeverity[] | ((prev: BugSeverity[]) => BugSeverity[])) => void;
  bugModuleFilter: string[];
  setBugModuleFilter: (v: string[] | ((prev: string[]) => string[])) => void;
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
  devMode?: boolean;
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

const DEV_GUIDANCE_LABELS: Record<string, string> = {
  'with-guidance': 'Com guia IA',
  'without-guidance': 'Sem guia IA',
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
  testCaseExecutionStatusFilter,
  setTestCaseExecutionStatusFilter,
  bugSeverityFilter,
  setBugSeverityFilter,
  bugModuleFilter,
  setBugModuleFilter,
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
  devMode = false,
}) => (
  <>
    {hasActiveFiltersOrSearch && (
      <div className="flex flex-col gap-2">
        <div className={tasksPanelActiveFiltersBarClass}>
        {statusFilter.map(s => (
          <span
            key={`status-${s}`}
            className={tasksPanelActiveFilterChipClass}
          >
            Status: {s}
            <button
              type="button"
              onClick={() => setStatusFilter(prev => prev.filter(x => x !== s))}
              className={tasksPanelActiveFilterChipBtnClass}
              aria-label={`Remover filtro Status: ${s}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {priorityFilter.map(p => (
          <span
            key={`priority-${p}`}
            className={tasksPanelActiveFilterChipClass}
          >
            Prioridade: {p}
            <button
              type="button"
              onClick={() => setPriorityFilter(prev => prev.filter(x => x !== p))}
              className={tasksPanelActiveFilterChipBtnClass}
              aria-label={`Remover filtro Prioridade: ${p}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {typeFilter.map(t => (
          <span
            key={`type-${t}`}
            className={tasksPanelActiveFilterChipClass}
          >
            Tipo: {t}
            <button
              type="button"
              onClick={() => setTypeFilter(prev => prev.filter(x => x !== t))}
              className={tasksPanelActiveFilterChipBtnClass}
              aria-label={`Remover filtro Tipo: ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {!devMode &&
          testStatusFilter.map(ts => {
            const opt = TEST_STATUS_FILTER_OPTIONS.find(o => o.value === ts);
            return (
              <span
                key={`testStatus-${ts}`}
                className={tasksPanelActiveFilterChipClass}
              >
                Teste: {opt?.label ?? ts}
                <button
                  type="button"
                  onClick={() => setTestStatusFilter(prev => prev.filter(x => x !== ts))}
                  className={tasksPanelActiveFilterChipBtnClass}
                  aria-label={`Remover filtro Teste: ${opt?.label ?? ts}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        {!devMode &&
          testCaseExecutionStatusFilter.map(st => (
            <span
              key={`caseExec-${st}`}
              className={tasksPanelActiveFilterChipClass}
            >
              {CASE_EXECUTION_LABEL[st]}
              <button
                type="button"
                onClick={() => setTestCaseExecutionStatusFilter(prev => prev.filter(x => x !== st))}
                className={tasksPanelActiveFilterChipBtnClass}
                aria-label={`Remover filtro ${CASE_EXECUTION_LABEL[st]}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        {!devMode &&
          bugSeverityFilter.map(sev => (
            <span key={`bugSev-${sev}`} className={tasksPanelActiveFilterChipClass}>
              Severidade: {sev}
              <button
                type="button"
                onClick={() => setBugSeverityFilter(prev => prev.filter(x => x !== sev))}
                className={tasksPanelActiveFilterChipBtnClass}
                aria-label={`Remover filtro Severidade: ${sev}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        {!devMode &&
          bugModuleFilter.map(mod => (
            <span key={`bugMod-${mod}`} className={tasksPanelActiveFilterChipClass}>
              Módulo: {mod}
              <button
                type="button"
                onClick={() => setBugModuleFilter(prev => prev.filter(x => x !== mod))}
                className={tasksPanelActiveFilterChipBtnClass}
                aria-label={`Remover filtro Módulo: ${mod}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        {qualityFilter.map(q => {
          const qualityLabel = devMode
            ? (DEV_GUIDANCE_LABELS[q] ?? q)
            : (QUALITY_LABELS[q] ?? q);
          return (
          <span
            key={`quality-${q}`}
            className={tasksPanelActiveFilterChipClass}
          >
            {devMode ? qualityLabel : `Qualidade: ${qualityLabel}`}
            <button
              type="button"
              onClick={() => setQualityFilter(prev => prev.filter(x => x !== q))}
              className={tasksPanelActiveFilterChipBtnClass}
              aria-label={`Remover filtro ${qualityLabel}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
        })}
        {searchQuery && (
          <span className={tasksPanelActiveFilterChipClass}>
            Busca: {searchQuery.length > 20 ? `${searchQuery.slice(0, 20)}…` : searchQuery}
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={tasksPanelActiveFilterChipBtnClass}
              aria-label="Remover filtro de busca"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={onClearAndCloseFilters}
          className={tasksPanelActiveFiltersClearClass}
        >
          <X className="mr-1 h-3 w-3" aria-hidden />
          Limpar todos
        </button>
        </div>
        <p className={tasksPanelListCountClass}>
          Exibindo {filteredCount} de {totalCount} tarefas
        </p>
      </div>
    )}

    {children}
  </>
);
