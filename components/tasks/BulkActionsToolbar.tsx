import React from 'react';
import { Copy, FileDown, X } from 'lucide-react';
import { Button } from '../common/Button';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onCopySelected?: () => void;
  onExportSelected?: () => void;
  onClearSelection?: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onCopySelected,
  onExportSelected,
  onClearSelection,
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="leve-neu-surface sticky top-0 z-20 border-0 border-b border-primary/25 px-md py-sm">
      <div className="flex items-center justify-between gap-md">
        <span className="text-sm font-semibold text-base-content">
          {selectedCount} {selectedCount === 1 ? 'teste selecionado' : 'testes selecionados'}
        </span>

        <div className="flex items-center gap-xs">
          {onCopySelected && (
            <Button variant="ghost" size="sm" onClick={onCopySelected} aria-label="Copiar testes selecionados">
              <Copy className="h-4 w-4" />
              <span>Copiar</span>
            </Button>
          )}

          {onExportSelected && (
            <Button variant="ghost" size="sm" onClick={onExportSelected} aria-label="Exportar testes selecionados">
              <FileDown className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          )}

          {onClearSelection && (
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-error" aria-label="Limpar seleção">
              <X className="h-4 w-4" />
              <span>Limpar</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
