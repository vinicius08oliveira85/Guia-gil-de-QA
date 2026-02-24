import React, { useState } from 'react';
import { JiraTask } from '../../types';
import { suggestEstimation, estimateTaskComplexity } from '../../utils/estimationService';

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
    <div className="space-y-4 p-4 bg-surface border border-surface-border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Estimativas</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        )}
      </div>

      {/* Sugestão automática */}
      <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-semibold text-text-primary">Sugestão Automática</span>
            <span className="text-xs text-text-secondary ml-2">(Complexidade: {complexity})</span>
          </div>
          <button
            onClick={handleUseSuggestion}
            className="text-sm text-accent hover:text-accent-light"
          >
            Usar Sugestão
          </button>
        </div>
        <div className="text-sm text-text-secondary">
          Estimativa sugerida:{' '}
          <span className="font-semibold text-text-primary">{suggestion}h</span>
        </div>
      </div>

      {/* Input de estimativa */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Horas Estimadas
        </label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={estimatedHours || ''}
          onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-black/20 border border-surface-border rounded-md text-text-primary"
          placeholder="Ex: 8"
        />
      </div>

      {/* Input de horas reais */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Horas Reais (Opcional)
        </label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={actualHours || ''}
          onChange={e => setActualHours(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-black/20 border border-surface-border rounded-md text-text-primary"
          placeholder="Ex: 6.5"
        />
        {actualHours > 0 && estimatedHours > 0 && (
          <div className="mt-2 text-sm">
            <span
              className={`font-semibold ${
                actualHours <= estimatedHours ? 'text-green-400' : 'text-orange-400'
              }`}
            >
              {actualHours <= estimatedHours
                ? `✅ Dentro do estimado (${estimatedHours - actualHours}h restantes)`
                : `⚠️ Acima do estimado (+${actualHours - estimatedHours}h)`}
            </span>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={estimatedHours <= 0}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Salvar Estimativas
        </button>
      </div>
    </div>
  );
};
