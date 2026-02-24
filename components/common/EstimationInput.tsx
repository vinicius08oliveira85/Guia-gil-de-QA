import React, { useState } from 'react';
import { JiraTask } from '../../types';
import { suggestEstimation, estimateTaskComplexity } from '../../utils/estimationService';
import { Save } from 'lucide-react';

interface EstimationInputProps {
  task: JiraTask;
  onSave: (estimatedHours: number, actualHours?: number) => void;
  onCancel?: () => void;
}

export const EstimationInput: React.FC<EstimationInputProps> = ({
  task,
  onSave,
  onCancel
}) => {
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
    <div className="space-y-6">
      {/* Sugestão automática */}
      <div className="bg-base-200/50 dark:bg-base-300/30 border border-base-300 rounded-xl p-5 relative overflow-hidden">
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div>
            <span className="text-xs font-bold text-base-content uppercase tracking-wide">Sugestão Automática</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-base-content/60 bg-base-300/50 dark:bg-base-200 px-1.5 py-0.5 rounded">Complexidade: {complexity}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUseSuggestion}
            className="text-sm font-bold text-brand-orange hover:text-brand-orange/80 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded"
          >
            Usar Sugestão
          </button>
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-base-content/70 text-sm font-medium">Estimativa sugerida:</span>
          <span className="text-2xl font-bold text-base-content">{suggestion}h</span>
        </div>
        <div className="absolute -right-2 -bottom-2 opacity-[0.05] dark:opacity-10 pointer-events-none" aria-hidden>
          <span className="text-8xl">✨</span>
        </div>
      </div>

      {/* Horas Estimadas */}
      <div>
        <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
          Horas Estimadas
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            step={0.5}
            value={estimatedHours || ''}
            onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
            className="w-full bg-base-200 dark:bg-base-300/50 border-none rounded-xl py-3.5 px-4 text-sm text-base-content focus:ring-2 focus:ring-brand-orange/20 placeholder:text-base-content/50 transition-all"
            placeholder="Ex: 8"
            aria-label="Horas estimadas"
          />
          <span className="absolute right-4 top-3.5 text-base-content/50 text-sm">h</span>
        </div>
      </div>

      {/* Horas Reais (Opcional) */}
      <div>
        <label className="block text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
          Horas Reais (Opcional)
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            step={0.5}
            value={actualHours || ''}
            onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
            className="w-full bg-base-200 dark:bg-base-300/50 border-none rounded-xl py-3.5 px-4 text-sm text-base-content focus:ring-2 focus:ring-brand-orange/20 placeholder:text-base-content/50 transition-all"
            placeholder="Ex: 6.5"
            aria-label="Horas reais"
          />
          <span className="absolute right-4 top-3.5 text-base-content/50 text-sm">h</span>
        </div>
        {actualHours > 0 && estimatedHours > 0 && (
          <div className="mt-2 text-sm">
            <span className={`font-semibold ${
              actualHours <= estimatedHours ? 'text-success' : 'text-error'
            }`}>
              {actualHours <= estimatedHours
                ? `✅ Dentro do estimado (${estimatedHours - actualHours}h restantes)`
                : `⚠️ Acima do estimado (+${actualHours - estimatedHours}h)`}
            </span>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex flex-col gap-3 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={estimatedHours <= 0}
          className="w-full bg-primary text-primary-content font-bold py-4 rounded-xl text-sm shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <Save className="w-4 h-4" aria-hidden />
          Salvar Estimativas
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-4 border border-base-300 text-base-content font-bold rounded-xl text-sm hover:bg-base-200 dark:hover:bg-base-300 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
