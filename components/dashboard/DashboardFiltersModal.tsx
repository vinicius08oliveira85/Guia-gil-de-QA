import React, { useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Project } from '../../types';
import { X } from 'lucide-react';

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
    className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
      ${isActive
        ? 'bg-primary text-primary-content border-primary shadow-sm'
        : 'bg-base-100 text-base-content/70 border-base-300 hover:border-primary/50 hover:text-base-content'
      }
    `}
  >
    {label}
    {showCount && (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-base-200'}`}>
        {count}
      </span>
    )}
  </button>
);

/**
 * Modal de filtros para o Dashboard — mesmo padrão visual do modal de filtros da aba de tarefas.
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

  const counts = useMemo(() => ({
    type: (type: string) => tasks.filter(t => t.type === type).length,
    testStatus: (status: string) =>
      tasks.filter(t => (t.testCases || []).some(tc => tc.status === status)).length,
  }), [tasks]);

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
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros" size="lg">
      {activeFiltersCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-error hover:text-error/80 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar todos
          </button>
        </div>
      )}
      <div className="space-y-5">
        {/* Período */}
        <div>
          <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">
            Período
          </p>
          <div className="flex flex-wrap gap-2">
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

        {/* Tipo de Tarefa */}
        <div>
          <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">
            Tipo de Tarefa
          </p>
          <div className="flex flex-wrap gap-2">
            {['Tarefa', 'Bug', 'Epic', 'História'].map(type => (
              <FilterChip
                key={type}
                label={type}
                count={counts.type(type)}
                isActive={filters.taskType?.includes(type as any) ?? false}
                onClick={() => handleToggleArrayFilter('taskType', type)}
              />
            ))}
          </div>
        </div>

        {/* Status de Teste (caso de teste) */}
        <div>
          <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">
            Status de Teste
          </p>
          <div className="flex flex-wrap gap-2">
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
                isActive={filters.testStatus?.includes(option.value as any) ?? false}
                onClick={() => handleToggleArrayFilter('testStatus', option.value)}
              />
            ))}
          </div>
        </div>

        {/* Fase */}
        {availablePhases.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase tracking-wider">
              Fase
            </p>
            <div className="flex flex-wrap gap-2">
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

