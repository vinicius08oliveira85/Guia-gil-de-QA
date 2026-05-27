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
import {
  tasksPanelActiveFiltersClearClass,
  tasksPanelFiltersModalCancelIconBtnClass,
  tasksPanelFiltersModalChipClass,
  tasksPanelFiltersModalChipCountClass,
  tasksPanelFiltersModalDividerClass,
  tasksPanelFiltersModalEmptyClass,
  tasksPanelFiltersModalHintClass,
  tasksPanelFiltersModalInputClass,
  tasksPanelFiltersModalPresetClass,
  tasksPanelFiltersModalPresetDeleteClass,
  tasksPanelFiltersModalPresetNameClass,
  tasksPanelFiltersModalSaveBtnClass,
  tasksPanelFiltersModalSaveLinkClass,
  tasksPanelFiltersModalSectionLabelClass,
} from './tasksPanelNeuStyles';

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
    className={tasksPanelFiltersModalChipClass(isActive)}
    aria-pressed={isActive}
  >
    {label}
    <span className={tasksPanelFiltersModalChipCountClass(isActive)}>{count}</span>
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
      {projectId && (
        <div className={tasksPanelFiltersModalDividerClass}>
          <div className="mb-3 flex items-center justify-between">
            <p className={tasksPanelFiltersModalSectionLabelClass}>
              <Bookmark className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Filtros salvos
            </p>
            {!isSavingPreset && (
              <button
                type="button"
                onClick={() => setIsSavingPreset(true)}
                className={tasksPanelFiltersModalSaveLinkClass}
              >
                <BookmarkCheck className="h-3 w-3 shrink-0" aria-hidden />
                Salvar filtros atuais
              </button>
            )}
          </div>

          {isSavingPreset && (
            <div className="mb-3 flex gap-2">
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
                className={tasksPanelFiltersModalInputClass}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className={tasksPanelFiltersModalSaveBtnClass}
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSavingPreset(false);
                  setPresetName('');
                }}
                className={tasksPanelFiltersModalCancelIconBtnClass}
                aria-label="Cancelar salvamento"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          )}

          {savedPresets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {savedPresets.map(preset => (
                <div key={preset.id} className={tasksPanelFiltersModalPresetClass}>
                  <button
                    type="button"
                    onClick={() => onLoadPreset?.(preset)}
                    className={tasksPanelFiltersModalPresetNameClass}
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(preset.id)}
                    className={tasksPanelFiltersModalPresetDeleteClass}
                    aria-label={`Excluir filtro "${preset.name}"`}
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={tasksPanelFiltersModalEmptyClass}>
              Nenhum filtro salvo. Configure os filtros e clique em &quot;Salvar filtros atuais&quot;.
            </p>
          )}
        </div>
      )}

      {activeFiltersCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClearAll}
            className={tasksPanelActiveFiltersClearClass}
          >
            <X className="mr-1 h-3 w-3" aria-hidden />
            Limpar todos
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <p className={tasksPanelFiltersModalSectionLabelClass}>Status</p>
          <div className="mt-2 flex flex-wrap gap-2">
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
          <p className={tasksPanelFiltersModalSectionLabelClass}>Prioridade</p>
          <div className="mt-2 flex flex-wrap gap-2">
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
          <p className={tasksPanelFiltersModalSectionLabelClass}>Tipo de tarefa</p>
          <div className="mt-2 flex flex-wrap gap-2">
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
          <p className={tasksPanelFiltersModalSectionLabelClass}>Status de teste</p>
          <div className="mt-2 flex flex-wrap gap-2">
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
          <p className={tasksPanelFiltersModalSectionLabelClass}>Resultado do caso de teste</p>
          <p className={tasksPanelFiltersModalHintClass}>
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
          <p className={tasksPanelFiltersModalSectionLabelClass}>Estado de qualidade</p>
          <div className="mt-2 flex flex-wrap gap-2">
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
