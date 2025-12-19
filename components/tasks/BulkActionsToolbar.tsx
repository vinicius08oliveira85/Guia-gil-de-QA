import React from 'react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onCopySelected?: () => void;
  onExportSelected?: () => void;
  onClearSelection?: () => void;
}

/**
 * Toolbar de ações em massa que aparece quando testes são selecionados
 */
export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onCopySelected,
  onExportSelected,
  onClearSelection
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-20 bg-primary/10 border-b border-primary/30 px-md py-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <span className="text-sm font-semibold text-base-content">
            {selectedCount} {selectedCount === 1 ? 'teste selecionado' : 'testes selecionados'}
          </span>
        </div>

        <div className="flex items-center gap-xs">
          {onCopySelected && (
            <button
              type="button"
              onClick={onCopySelected}
              className="btn btn-sm btn-ghost"
              aria-label="Copiar testes selecionados"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copiar</span>
            </button>
          )}

          {onExportSelected && (
            <button
              type="button"
              onClick={onExportSelected}
              className="btn btn-sm btn-ghost"
              aria-label="Exportar testes selecionados"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M8 12h8m-8 4h5" />
              </svg>
              <span>Exportar</span>
            </button>
          )}

          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="btn btn-sm btn-ghost text-error"
              aria-label="Limpar seleção"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

