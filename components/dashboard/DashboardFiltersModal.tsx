import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Project } from '../../types';

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

/**
 * Modal de filtros para o Dashboard
 */
export const DashboardFiltersModal: React.FC<DashboardFiltersModalProps> = ({
  isOpen,
  onClose,
  project,
  filters,
  onFiltersChange
}) => {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  // Obter fases únicas do projeto
  const availablePhases = useMemo(() => {
    const phases = new Set<string>();
    project.phases?.forEach(phase => {
      if (phase.name) phases.add(phase.name);
    });
    return Array.from(phases).sort();
  }, [project.phases]);

  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleToggleArrayFilter = (key: 'taskType' | 'testStatus' | 'phase', value: string) => {
    const current = localFilters[key] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleFilterChange(key, newValue);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: DashboardFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (localFilters.period && localFilters.period !== 'all') count++;
    if (localFilters.taskType && localFilters.taskType.length > 0) count++;
    if (localFilters.testStatus && localFilters.testStatus.length > 0) count++;
    if (localFilters.phase && localFilters.phase.length > 0) count++;
    return count;
  }, [localFilters]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtros do Dashboard"
      size="lg"
    >
      <div className="space-y-6">
        {/* Período */}
        <div>
          <label className="block text-sm font-semibold text-base-content mb-2">
            Período
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'week', label: 'Última Semana' },
              { value: 'month', label: 'Último Mês' },
              { value: 'quarter', label: 'Último Trimestre' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFilterChange('period', option.value)}
                className={`btn btn-sm ${
                  localFilters.period === option.value
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de Tarefa */}
        <div>
          <label className="block text-sm font-semibold text-base-content mb-2">
            Tipo de Tarefa
          </label>
          <div className="flex flex-wrap gap-2">
            {['Epic', 'História', 'Tarefa', 'Bug'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleToggleArrayFilter('taskType', type)}
                className={`btn btn-sm ${
                  localFilters.taskType?.includes(type)
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Status de Teste */}
        <div>
          <label className="block text-sm font-semibold text-base-content mb-2">
            Status de Teste
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'Not Run', label: 'Não Executado' },
              { value: 'Passed', label: 'Aprovado' },
              { value: 'Failed', label: 'Reprovado' },
              { value: 'Blocked', label: 'Bloqueado' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggleArrayFilter('testStatus', option.value)}
                className={`btn btn-sm ${
                  localFilters.testStatus?.includes(option.value as any)
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fase */}
        {availablePhases.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-base-content mb-2">
              Fase
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePhases.map(phase => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => handleToggleArrayFilter('phase', phase)}
                  className={`btn btn-sm ${
                    localFilters.phase?.includes(phase)
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t border-base-300">
          <div className="text-sm text-base-content/70">
            {activeFiltersCount > 0 ? (
              <span>{activeFiltersCount} filtro(s) ativo(s)</span>
            ) : (
              <span>Nenhum filtro aplicado</span>
            )}
          </div>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-ghost btn-sm"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="btn btn-primary btn-sm"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

