import React from 'react';
import { ChecklistItem } from '../../types';
import { getChecklistProgress, canMoveToNextPhase } from '../../utils/checklistService';
import { windows12Styles, cn } from '../../utils/windows12Styles';

interface ChecklistViewProps {
  checklist: ChecklistItem[];
  onToggleItem: (itemId: string) => void;
  onEditItem?: (itemId: string, text: string) => void;
  onDeleteItem?: (itemId: string) => void;
  showProgress?: boolean;
  showValidation?: boolean;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  showProgress = true,
  showValidation = true
}) => {
  const progress = getChecklistProgress(checklist);
  const validation = canMoveToNextPhase(checklist);

  return (
    <div className="space-y-4">
      {showProgress && (
        <div className={cn("p-3", windows12Styles.card)}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary">Progresso</span>
            <span className="text-sm text-text-secondary">
              {progress.completed} / {progress.total} ({Math.round((progress.completed / progress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          {progress.required > 0 && (
            <div className="mt-2 text-xs text-text-secondary">
              Obrigatórios: {progress.requiredCompleted} / {progress.required}
            </div>
          )}
        </div>
      )}

      {showValidation && !validation.canMove && (
        <div className={cn("p-3 bg-orange-500/20 border border-orange-500/50 rounded-xl", windows12Styles.transition.all)}>
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-orange-400 mb-1">
                Não é possível avançar para a próxima fase
              </div>
              <div className="text-sm text-text-secondary">
                Itens obrigatórios pendentes:
              </div>
              <ul className="list-disc list-inside mt-1 text-sm text-text-secondary">
                {validation.missingRequired.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showValidation && validation.canMove && (
        <div className={cn("p-3 bg-green-500/20 border border-green-500/50 rounded-xl", windows12Styles.transition.all, windows12Styles.glow('green'))}>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="text-sm font-semibold text-green-400">
              Todos os itens obrigatórios concluídos. Pronto para avançar!
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {checklist.map(item => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border",
              windows12Styles.transition.all,
              item.checked
                ? 'bg-green-500/10 border-green-500/30 shadow-md shadow-green-500/10'
                : windows12Styles.card
            )}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggleItem(item.id)}
              className="mt-1 w-5 h-5 rounded border-surface-border text-accent focus:ring-accent"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`${item.checked ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                  {item.text}
                </span>
                {item.required && (
                  <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                    Obrigatório
                  </span>
                )}
              </div>
            </div>
            {(onEditItem || onDeleteItem) && (
              <div className="flex gap-2">
                {onEditItem && (
                  <button
                    onClick={() => {
                      const newText = prompt('Editar item:', item.text);
                      if (newText) onEditItem(item.id, newText);
                    }}
                    className="text-text-secondary hover:text-text-primary text-sm"
                  >
                    ✏️
                  </button>
                )}
                {onDeleteItem && (
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {checklist.length === 0 && (
        <p className="text-center text-text-secondary py-4">
          Nenhum item no checklist
        </p>
      )}
    </div>
  );
};

