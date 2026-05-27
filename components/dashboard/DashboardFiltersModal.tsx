import React, { useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Project } from '../../types';
import { X } from 'lucide-react';
import {
  tasksPanelActiveFiltersClearClass,
  tasksPanelFiltersModalChipClass,
  tasksPanelFiltersModalChipCountClass,
  tasksPanelFiltersModalSectionLabelClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from '../tasks/tasksPanelNeuStyles';

export interface DashboardFilters {
  period?: 'week' | 'month' | 'quarter' | 'all';
  taskType?: ('Epic' | 'História' | 'Tarefa' | 'Bug')[];
  testStatus?: ('Not Run' | 'Passed' | 'Failed' | 'Blocked')[];
  phase?: string[];
}

interface DashboardFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

const FilterChip = ({
  label,
  count,
  isActive,
  onClick,
  showCount = true,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  showCount?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={tasksPanelFiltersModalChipClass(isActive)}
    aria-pressed={isActive}
  >
    {label}
    {showCount && <span className={tasksPanelFiltersModalChipCountClass(isActive)}>{count}</span>}
  </button>
);

/**
 * Modal de filtros para o Dashboard — paleta neumórfica escura (mesmo padrão da aba Tarefas).
 */
export const DashboardFiltersModal: React.FC<DashboardFiltersModalProps> = ({
  isOpen,
  onClose,
  project,
  filters,
  onFiltersChange,
}) => {
  const tasks = project.tasks || [];

  const availablePhases = useMemo(() => {
    const phases = new Set<string>();
    project.phases?.forEach(phase => {
      if (phase.name) phases.add(phase.name);
    });
    return Array.from(phases).sort();
  }, [project.phases]);

  const counts = useMemo(
    () => ({
      type: (type: string) => tasks.filter(t => t.type === type).length,
      testStatus: (status: string) =>
        tasks.filter(t => (t.testCases || []).some(tc => tc.status === status)).length,
    }),
    [tasks]
  );

  const handleToggleArrayFilter = (key: 'taskType' | 'testStatus' | 'phase', value: string) => {
    const current = (filters[key] as string[] | undefined) || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: newValue });
  };

  const handlePeriodChange = (value: 'week' | 'month' | 'quarter' | 'all') => {
    onFiltersChange({ ...filters, period: value });
  };

  const handleClear = () => {
    onFiltersChange({});
    onClose();
  };

  const activeFiltersCount =
    (filters.period && filters.period !== 'all' ? 1 : 0) +
    (filters.taskType?.length ?? 0) +
    (filters.testStatus?.length ?? 0) +
    (filters.phase?.length ?? 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtros"
      size="2xl"
      panelClassName={tasksPanelNeuModalPanelClass}
      titleClassName={tasksPanelNeuModalTitleClass}
    >
      {activeFiltersCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={handleClear} className={tasksPanelActiveFiltersClearClass}>
            <X className="mr-1 h-3 w-3" aria-hidden />
            Limpar todos
          </button>
        </div>
      )}
      <div className="space-y-5">
        <div>
          <p className={tasksPanelFiltersModalSectionLabelClass}>Período</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { value: 'all' as const, label: 'Todos' },
              { value: 'week' as const, label: 'Última Semana' },
              { value: 'month' as const, label: 'Último Mês' },
              { value: 'quarter' as const, label: 'Último Trimestre' },
            ].map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                count={0}
                showCount={false}
                isActive={(filters.period ?? 'all') === option.value}
                onClick={() => handlePeriodChange(option.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className={tasksPanelFiltersModalSectionLabelClass}>Tipo de tarefa</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Tarefa', 'Bug', 'Epic', 'História'].map(type => (
              <FilterChip
                key={type}
                label={type}
                count={counts.type(type)}
                isActive={filters.taskType?.includes(type as 'Epic' | 'História' | 'Tarefa' | 'Bug') ?? false}
                onClick={() => handleToggleArrayFilter('taskType', type)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className={tasksPanelFiltersModalSectionLabelClass}>Status de teste</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { value: 'Not Run', label: 'Não Executado' },
              { value: 'Passed', label: 'Aprovado' },
              { value: 'Failed', label: 'Reprovado' },
              { value: 'Blocked', label: 'Bloqueado' },
            ].map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                count={counts.testStatus(option.value)}
                isActive={
                  filters.testStatus?.includes(
                    option.value as 'Not Run' | 'Passed' | 'Failed' | 'Blocked'
                  ) ?? false
                }
                onClick={() => handleToggleArrayFilter('testStatus', option.value)}
              />
            ))}
          </div>
        </div>

        {availablePhases.length > 0 && (
          <div>
            <p className={tasksPanelFiltersModalSectionLabelClass}>Fase</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availablePhases.map(phase => (
                <FilterChip
                  key={phase}
                  label={phase}
                  count={0}
                  isActive={filters.phase?.includes(phase) ?? false}
                  onClick={() => handleToggleArrayFilter('phase', phase)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
