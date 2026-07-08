import React, { useState } from 'react';
import { JiraTask } from '../../types';
import { suggestEstimation, estimateTaskComplexity } from '../../utils/estimationService';
import { Save } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  leveTaskModalCategoryBadgeClass,
  leveTaskModalFieldLabelClass,
  leveTaskModalInputClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionAccentClass,
  leveTaskModalStrongClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
} from './projectCardUi';

interface EstimationInputProps {
  task: JiraTask;
  onSave: (estimatedHours: number, actualHours?: number) => void;
  onCancel?: () => void;
}

export const EstimationInput: React.FC<EstimationInputProps> = ({ task, onSave, onCancel }) => {
  const [estimatedHours, setEstimatedHours] = useState<number>(task.estimatedHours || 0);
  const [actualHours, setActualHours] = useState<number>(task.actualHours || 0);

  const complexity = estimateTaskComplexity(task);
  const suggestion = suggestEstimation(task);

  const handleUseSuggestion = () => {
    setEstimatedHours(suggestion);
  };

  const handleSave = () => {
    if (estimatedHours > 0) {
      onSave(estimatedHours, actualHours > 0 ? actualHours : undefined);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className={cn(leveTaskModalSectionAccentClass, 'relative overflow-hidden p-5')}>
        <div className="relative z-10 mb-3 flex items-start justify-between">
          <div>
            <span className={leveTaskModalFieldLabelClass}>Sugestão Automática</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={leveTaskModalCategoryBadgeClass}>Complexidade: {complexity}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUseSuggestion}
            className="font-sans text-sm font-bold text-primary underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Usar Sugestão
          </button>
        </div>
        <div className="relative z-10 flex items-baseline gap-2">
          <span className={cn('text-sm font-medium', leveTaskModalMutedClass)}>Estimativa sugerida:</span>
          <span className={cn('text-2xl font-bold text-primary')}>{suggestion}h</span>
        </div>
        <div className="pointer-events-none absolute -bottom-2 -right-2 opacity-[0.06]" aria-hidden>
          <span className="text-8xl">✨</span>
        </div>
      </div>

      <div>
        <label className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Horas Estimadas</label>
        <div className="relative">
          <input
            type="number"
            min={0}
            step={0.5}
            value={estimatedHours || ''}
            onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
            className={cn(leveTaskModalInputClass, 'py-3.5 pr-10')}
            placeholder="Ex: 8"
            aria-label="Horas estimadas"
          />
          <span className={cn('absolute right-4 top-3.5 text-sm', leveTaskModalMutedXsClass)}>h</span>
        </div>
      </div>

      <div>
        <label className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Horas Reais (Opcional)</label>
        <div className="relative">
          <input
            type="number"
            min={0}
            step={0.5}
            value={actualHours || ''}
            onChange={e => setActualHours(parseFloat(e.target.value) || 0)}
            className={cn(leveTaskModalInputClass, 'py-3.5 pr-10')}
            placeholder="Ex: 6.5"
            aria-label="Horas reais"
          />
          <span className={cn('absolute right-4 top-3.5 text-sm', leveTaskModalMutedXsClass)}>h</span>
        </div>
        {actualHours > 0 && estimatedHours > 0 && (
          <div className="mt-2 text-sm">
            <span
              className={cn(
                'font-semibold',
                actualHours <= estimatedHours
                  ? leveTaskModalStrongClass
                  : 'text-primary'
              )}
            >
              {actualHours <= estimatedHours
                ? `Dentro do estimado (${estimatedHours - actualHours}h restantes)`
                : `Acima do estimado (+${actualHours - estimatedHours}h)`}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={estimatedHours <= 0}
          className={cn(
            leveViewPrimaryBtnClass,
            'w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <Save className="h-4 w-4" aria-hidden />
          Salvar Estimativas
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={cn(leveViewOutlineBtnClass, 'w-full justify-center py-4')}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
