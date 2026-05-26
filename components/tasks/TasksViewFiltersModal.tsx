import React, { useState } from 'react';
import { X, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import type { TaskTestStatus, TestCase } from '../../types';
import { TEST_STATUS_FILTER_OPTIONS, type TaskSortBy, type TaskGroupBy } from './tasksViewHelpers';
import {
  getSavedFilters,
  saveFilter,
  deleteFilter,
  type SavedFilterPreset,
} from '../../utils/savedFiltersService';
import { cn } from '../../utils/cn';
import { filterPillClass, outlineActionBtn, primaryActionBtn, searchInputClass } from '../common/viewUi';
import { taskCardFieldLabelClass } from './taskActionLayout';

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
    type="button"
    onClick={onClick}
    className={cn(
      filterPillClass(isActive),
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:gap-2 sm:px-3 sm:py-1.5',
      !isActive &&
        'hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]'
    )}
  >
    {label}
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]'}`}
    >
      {count}
    </span>
  </button>
);

export interface TasksViewFiltersModalCounts {
  status: (statusName: string) => number;
  priority: (priorityName: string) => number;
  type: (type: string) => number;
  testStatus: (status: TaskTestStatus) => number;
  caseExecution: (status: TestCase['status']) => number;
  quality: (type: string) => number;
}

const CASE_EXECUTION_OPTIONS: { value: TestCase['status']; label: string }[] = [
  { value: 'Not Run', label: 'Não executado' },
  { value: 'Passed', label: 'Passou' },
  { value: 'Failed', label: 'Falhou' },
  { value: 'Blocked', label: 'Bloqueado' },
];

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
  setTestStatusFilter: (
    v: TaskTestStatus[] | ((prev: TaskTestStatus[]) => TaskTestStatus[])
  ) => void;
  testCaseExecutionStatusFilter: TestCase['status'][];
  setTestCaseExecutionStatusFilter: (
    v: TestCase['status'][] | ((prev: TestCase['status'][]) => TestCase['status'][])
  ) => void;
  qualityFilter: string[];
  setQualityFilter: (v: string[] | ((prev: string[]) => string[])) => void;
  activeFiltersCount: number;
  onClearAll: () => void;
  /** Necessário para filtros salvos */
  projectId?: string;
  sortBy?: TaskSortBy;
  groupBy?: TaskGroupBy;
  onLoadPreset?: (preset: SavedFilterPreset) => void;
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
  testCaseExecutionStatusFilter,
  setTestCaseExecutionStatusFilter,
  qualityFilter,
  setQualityFilter,
  activeFiltersCount,
  onClearAll,
  projectId,
  sortBy,
  groupBy,
  onLoadPreset,
}) => {
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(() =>
    projectId ? getSavedFilters(projectId) : []
  );
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const refreshPresets = () => {
    if (projectId) setSavedPresets(getSavedFilters(projectId));
  };

  const handleSavePreset = () => {
    if (!projectId || !presetName.trim()) return;
    saveFilter(projectId, presetName, {
      statusFilter,
      priorityFilter,
      typeFilter,
      testStatusFilter,
      testCaseExecutionStatusFilter,
      qualityFilter,
      sortBy: sortBy ?? 'id',
      groupBy: groupBy ?? 'none',
    });
    setPresetName('');
    setIsSavingPreset(false);
    refreshPresets();
  };

  const handleDeletePreset = (id: string) => {
    if (!projectId) return;
    deleteFilter(projectId, id);
    refreshPresets();
  };

  return (
    <>
      {/* Seção de Filtros Salvos */}
      {projectId && (
        <div className="mb-5 pb-5 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]">
          <div className="flex items-center justify-between mb-3">
            <p className={cn(taskCardFieldLabelClass, 'flex items-center gap-1.5')}>
              <Bookmark className="w-3.5 h-3.5" />
              Filtros Salvos
            </p>
            {!isSavingPreset && (
              <button
                type="button"
                onClick={() => setIsSavingPreset(true)}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <BookmarkCheck className="w-3 h-3" /> Salvar filtros atuais
              </button>
            )}
          </div>

          {isSavingPreset && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSavePreset();
                  if (e.key === 'Escape') {
                    setIsSavingPreset(false);
                    setPresetName('');
                  }
                }}
                placeholder="Nome do preset (ex: Meus bugs)"
                className={cn(searchInputClass, 'input-sm flex-1 h-9 pl-3 text-xs')}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className={cn(primaryActionBtn, 'btn-sm min-h-9 px-4 text-xs')}
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSavingPreset(false);
                  setPresetName('');
                }}
                className={cn(outlineActionBtn, 'btn-sm min-h-9 px-2 text-xs')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {savedPresets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {savedPresets.map(preset => (
                <div
                  key={preset.id}
                  className="app-filter-pill group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] sm:px-3 sm:py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => onLoadPreset?.(preset)}
                    className="text-base-content/80 hover:text-base-content"
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(preset.id)}
                    className="text-base-content/40 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Excluir filtro "${preset.name}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-base-content/50 italic">
              Nenhum filtro salvo. Configure os filtros e clique em "Salvar filtros atuais".
            </p>
          )}
        </div>
      )}

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
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <p className={cn(taskCardFieldLabelClass, 'mb-2')}>
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(statusName => (
              <FilterChip
                key={statusName}
                label={statusName}
                count={counts.status(statusName)}
                isActive={statusFilter.includes(statusName)}
                onClick={() =>
                  setStatusFilter(prev =>
                    prev.includes(statusName)
                      ? prev.filter(s => s !== statusName)
                      : [...prev, statusName]
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className={cn(taskCardFieldLabelClass, 'mb-2')}>
            Prioridade
          </p>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map(priorityName => (
              <FilterChip
                key={priorityName}
                label={priorityName}
                count={counts.priority(priorityName)}
                isActive={priorityFilter.includes(priorityName)}
                onClick={() =>
                  setPriorityFilter(prev =>
                    prev.includes(priorityName)
                      ? prev.filter(p => p !== priorityName)
                      : [...prev, priorityName]
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className={cn(taskCardFieldLabelClass, 'mb-2')}>
            Tipo de Tarefa
          </p>
          <div className="flex flex-wrap gap-2">
            {['Tarefa', 'Bug', 'Epic', 'História'].map(type => (
              <FilterChip
                key={type}
                label={type}
                count={counts.type(type)}
                isActive={typeFilter.includes(type)}
                onClick={() =>
                  setTypeFilter(prev =>
                    prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className={cn(taskCardFieldLabelClass, 'mb-2')}>
            Status de Teste
          </p>
          <div className="flex flex-wrap gap-2">
            {TEST_STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <FilterChip
                key={value}
                label={label}
                count={counts.testStatus(value)}
                isActive={testStatusFilter.includes(value)}
                onClick={() =>
                  setTestStatusFilter(prev =>
                    prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 md:col-span-2 xl:col-span-3">
          <p className={cn(taskCardFieldLabelClass, 'mb-2')}>
            Resultado do caso de teste
          </p>
          <p className="text-[11px] text-base-content/50 mb-2">
            Filtra tarefas que possuem ao menos um caso neste status (Passou, Falhou, etc.).
          </p>
          <div className="flex flex-wrap gap-2">
            {CASE_EXECUTION_OPTIONS.map(({ value, label }) => (
              <FilterChip
                key={value}
                label={label}
                count={counts.caseExecution(value)}
                isActive={testCaseExecutionStatusFilter.includes(value)}
                onClick={() =>
                  setTestCaseExecutionStatusFilter(prev =>
                    prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 md:col-span-2 xl:col-span-3">
          <p className={cn(taskCardFieldLabelClass, 'mb-2')}>
            Estado de Qualidade
          </p>
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
                onClick={() =>
                  setQualityFilter(prev =>
                    prev.includes(q.id) ? prev.filter(i => i !== q.id) : [...prev, q.id]
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
