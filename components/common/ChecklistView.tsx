import React, { useState, useEffect, useRef } from 'react';
import { ChecklistItem } from '../../types';
import { getChecklistProgress, canMoveToNextPhase } from '../../utils/checklistService';
import { cn } from '../../utils/cn';

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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItemId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingItemId]);

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingText('');
  };

  const handleSaveEdit = () => {
    if (editingItemId && onEditItem && editingText.trim()) {
      onEditItem(editingItemId, editingText.trim());
    }
    handleCancelEdit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      {showProgress && (
        <div className="p-4 bg-base-100 border border-base-300 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-base-content">Progresso</span>
            <span className="text-sm text-base-content/70">
              {progress.completed} / {progress.total} ({Math.round((progress.completed / progress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          {progress.required > 0 && (
            <div className="mt-2 text-xs text-base-content/70">
              Obrigatórios: {progress.requiredCompleted} / {progress.required}
            </div>
          )}
        </div>
      )}

      {showValidation && !validation.canMove && (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-warning mb-1">
                Não é possível avançar para a próxima fase
              </div>
              <div className="text-sm text-base-content/70">
                Itens obrigatórios pendentes:
              </div>
              <ul className="list-disc list-inside mt-1 text-sm text-base-content/70">
                {validation.missingRequired.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showValidation && validation.canMove && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="text-sm font-semibold text-success">
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
              item.checked
                ? 'bg-success/10 border-success/30 shadow-sm'
                : 'bg-base-100 border-base-300'
            )}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggleItem(item.id)}
              className="checkbox checkbox-sm mt-1 [--chkfg:theme(colors.base-100)]"
            />
            <div className="flex-1">
              {editingItemId === item.id && onEditItem ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  className="input input-sm w-full bg-base-200"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`${item.checked ? 'line-through text-base-content/60' : 'text-base-content'}`}>
                    {item.text}
                  </span>
                  {item.required && (
                    <span className="badge badge-error badge-outline badge-sm">
                      Obrigatório
                    </span>
                  )}
                </div>
              )}
            </div>
            {(onEditItem || onDeleteItem) && (
              <div className="flex gap-2">
                {onEditItem && !editingItemId && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    ✏️
                  </button>
                )}
                {onDeleteItem && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="btn btn-ghost btn-xs btn-circle text-error"
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
        <p className="text-center text-base-content/70 py-4">
          Nenhum item no checklist
        </p>
      )}
    </div>
  );
};
