import React, { useMemo } from 'react';
import type { SearchResult } from '../../hooks/useSearch';
import { Modal } from './Modal';
import { cn } from '../../utils/cn';
import {
  modalNeuEmptyClass,
  modalNeuListClass,
  modalNeuListRowClass,
  modalNeuMutedTextClass,
  modalNeuSearchInputClass,
  modalNeuStrongTextClass,
  modalNeuTypeBadgeClass,
} from './modalListNeuUi';

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
          className={modalNeuSearchInputClass}
          autoFocus
        />

        {filteredResults.length > 0 ? (
          <ul className={modalNeuListClass} role="listbox" aria-label="Resultados da busca">
            {filteredResults.map(result => (
              <li key={`${result.type}-${result.id}-${result.projectId ?? ''}`}>
                <button
                  type="button"
                  role="option"
                  onClick={() => {
                    onSelectResult(result);
                    onClose();
                  }}
                  className={modalNeuListRowClass}
                  aria-label={`Selecionar: ${result.title}`}
                >
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{getTypeIcon(result.type)}</span>
                      <span className={cn('truncate font-semibold', modalNeuStrongTextClass)}>
                        {result.title}
                      </span>
                      <span className={modalNeuTypeBadgeClass}>{result.type}</span>
                    </div>
                    {result.description ? (
                      <p className={cn('mt-1 line-clamp-1 text-sm', modalNeuMutedTextClass)}>
                        {result.description}
                      </p>
                    ) : null}
                    {result.projectName ? (
                      <p className={cn('mt-1 text-xs', modalNeuMutedTextClass)}>
                        Projeto: {result.projectName}
                      </p>
                    ) : null}
                  </div>
                  <span className={modalNeuMutedTextClass} aria-hidden>
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : searchQuery.trim() ? (
          <p className={modalNeuEmptyClass} role="status">
            Nenhum resultado encontrado
          </p>
        ) : (
          <p className={modalNeuEmptyClass} role="status">
            Digite para buscar projetos, tarefas ou documentos…
          </p>
        )}
      </div>
    </Modal>
  );
};
