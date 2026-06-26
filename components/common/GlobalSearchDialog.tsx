import React, { useMemo } from 'react';
import type { SearchResult } from '../../hooks/useSearch';
import { Modal } from './Modal';
import { cn } from '../../utils/cn';

export interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
}

function getTypeIcon(type: SearchResult['type']) {
  switch (type) {
    case 'project':
      return '📁';
    case 'task':
      return '📋';
    case 'document':
      return '📄';
    case 'testcase':
      return '✅';
    default:
      return '🔍';
  }
}

/**
 * Busca global em modal — atalho Ctrl+K / evento `open-global-search`.
 */
export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectResult,
}) => {
  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const operators = {
      'status:': (result: SearchResult) => {
        const status = query.split('status:')[1]?.split(' ')[0];
        return (
          result.type === 'task' &&
          (result.description ?? '').toLowerCase().includes((status ?? '').toLowerCase())
        );
      },
      'type:': (result: SearchResult) => {
        const type = query.split('type:')[1]?.split(' ')[0];
        return (result.type ?? '').toLowerCase() === (type ?? '').toLowerCase();
      },
      'project:': (result: SearchResult) => {
        const projectName = query.split('project:')[1]?.split(' ')[0];
        return (result.projectName ?? '').toLowerCase().includes((projectName ?? '').toLowerCase());
      },
    };

    const hasOperator = Object.keys(operators).some(op => query.includes(op));
    if (hasOperator) {
      return searchResults.filter(result =>
        Object.entries(operators).some(([op, fn]) => query.includes(op) && fn(result))
      );
    }

    return searchResults.filter(
      result =>
        result.title?.toLowerCase().includes(query) ||
        result.description?.toLowerCase().includes(query) ||
        result.id?.toLowerCase().includes(query)
    );
  }, [searchQuery, searchResults]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Busca global"
      size="2xl"
      panelClassName="max-h-[min(90vh,40rem)]"
    >
      <div className="space-y-4">
        <label htmlFor="global-search-input" className="sr-only">
          Buscar projetos, tarefas e documentos
        </label>
        <input
          id="global-search-input"
          type="search"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar… (use: status:, type:, project:)"
          className={cn(
            'input input-bordered w-full rounded-[var(--radius)]',
            'bg-[var(--app-neu-bg)] text-[var(--brand-text)]'
          )}
          autoFocus
        />

        <div className="max-h-[min(50vh,24rem)] overflow-y-auto custom-scrollbar">
          {filteredResults.length > 0 ? (
            <ul className="space-y-2" role="listbox" aria-label="Resultados da busca">
              {filteredResults.map(result => (
                <li key={`${result.type}-${result.id}-${result.projectId ?? ''}`}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => {
                      onSelectResult(result);
                      onClose();
                    }}
                    className={cn(
                      'w-full rounded-[var(--project-card-radius)] border border-[var(--project-card-border)]',
                      'bg-[var(--project-card-bg)] p-3 text-left transition-colors',
                      'hover:border-[var(--project-card-accent)] focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[var(--project-card-accent)]'
                    )}
                    aria-label={`Selecionar: ${result.title}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span aria-hidden>{getTypeIcon(result.type)}</span>
                          <span className="truncate font-semibold text-[var(--project-card-text)]">
                            {result.title}
                          </span>
                          <span className="badge badge-outline badge-sm shrink-0">{result.type}</span>
                        </div>
                        {result.description ? (
                          <p className="mt-1 line-clamp-1 text-sm text-[var(--project-card-text-muted)]">
                            {result.description}
                          </p>
                        ) : null}
                        {result.projectName ? (
                          <p className="mt-1 text-xs text-[var(--project-card-text-subtle)]">
                            Projeto: {result.projectName}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-[var(--project-card-text-subtle)]" aria-hidden>
                        →
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim() ? (
            <p className="py-8 text-center text-sm text-[var(--brand-text-muted)]">
              Nenhum resultado encontrado
            </p>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--brand-text-muted)]">
              Digite para buscar projetos, tarefas ou documentos…
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
