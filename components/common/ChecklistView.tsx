import React, { useState, useEffect, useRef } from 'react';
import { ChecklistItem } from '../../types';
import { getChecklistProgress, canMoveToNextPhase } from '../../utils/checklistService';
import { Button } from './Button';
import { cn } from '../../utils/cn';
import {
  neuCardClass,
  neuChecklistItemCheckedClass,
  neuChecklistItemIdleClass,
  neuHoverSubtleClass,
  neuSurfaceInsetClass,
  neuTrackClass,
} from './neuUi';

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
  showValidation = true,
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
        <div className={cn(neuCardClass, 'rounded-xl')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-base-content">Progresso</span>
            <span className="text-sm text-base-content/70">
              {progress.completed} / {progress.total} (
              {Math.round((progress.completed / progress.total) * 100)}%)
            </span>
          </div>
          <div className={cn(neuTrackClass, 'h-2 w-full')}>
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
              <div className="text-sm text-base-content/70">Itens obrigatórios pendentes:</div>
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
              'group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200',
              item.checked ? neuChecklistItemCheckedClass : neuChecklistItemIdleClass
            )}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggleItem(item.id)}
              className="checkbox checkbox-sm mt-0.5 rounded-md border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] transition-all data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <div className="flex-1">
              {editingItemId === item.id && onEditItem ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  className={cn('input input-sm w-full', neuSurfaceInsetClass)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm transition-all duration-200 ${item.checked ? 'line-through text-base-content/50' : 'text-base-content font-medium'}`}
                  >
                    {item.text}
                  </span>
                  {item.required && (
                    <span className="badge badge-error badge-soft badge-xs font-semibold uppercase tracking-wider">
                      Obrigatório
                    </span>
                  )}
                </div>
              )}
            </div>
            {(onEditItem || onDeleteItem) && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {onEditItem && !editingItemId && (
                  <Button
                    onClick={() => handleStartEdit(item)}
                    size="iconSm"
                    variant="ghost"
                    className={cn('rounded-lg text-base-content/60', neuHoverSubtleClass)}
                  >
                    ✏️
                  </Button>
                )}
                {onDeleteItem && (
                  <Button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    size="iconSm"
                    variant="ghost"
                    className="rounded-lg hover:bg-error/10 text-error/70 hover:text-error"
                  >
                    ✕
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {checklist.length === 0 && (
        <p className="text-center text-base-content/70 py-4">Nenhum item no checklist</p>
      )}
    </div>
  );
};
