import React, { useMemo } from 'react';
import { Project } from '../../types';
import { useSearch, type SearchResult } from '../../hooks/useSearch';
import { Modal } from './Modal';
import { cn } from '../../utils/cn';
import {
  modalNeuEmptyClass,
  modalNeuKbdClass,
  modalNeuListClass,
  modalNeuListRowClass,
  modalNeuMutedTextClass,
  modalNeuSearchInputClass,
  modalNeuStrongTextClass,
  modalNeuTipClass,
  modalNeuTypeBadgeClass,
} from './modalListNeuUi';

interface AdvancedSearchProps {
  projects: Project[];
  onResultSelect: (result: { type: string; id: string; projectId?: string }) => void;
  onClose: () => void;
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

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  projects,
  onResultSelect,
  onClose,
}) => {
  const { searchQuery, setSearchQuery, searchResults } = useSearch(projects);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
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
      'tag:': (result: SearchResult & { tags?: string[] }) => {
        const tag = query.split('tag:')[1]?.split(' ')[0];
        return result.tags?.some(t => (t ?? '').toLowerCase().includes((tag ?? '').toLowerCase()));
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
    <Modal isOpen onClose={onClose} title="Busca avançada" size="2xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="advanced-search-input" className="sr-only">
            Buscar por status, tipo, tag, projeto ou texto livre
          </label>
          <input
            id="advanced-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar… (use: status:, type:, tag:, project:)"
            aria-describedby="search-operators-description"
            className={modalNeuSearchInputClass}
            autoFocus
          />

          <div
            id="search-operators-description"
            className={cn('space-y-1 text-xs', modalNeuMutedTextClass)}
          >
            <p>
              <strong>Operadores:</strong>{' '}
              <code className={modalNeuKbdClass}>status:done</code>,{' '}
              <code className={modalNeuKbdClass}>type:bug</code>,{' '}
              <code className={modalNeuKbdClass}>tag:crítico</code>,{' '}
              <code className={modalNeuKbdClass}>project:nome</code>
            </p>
          </div>
        </div>

        {filteredResults.length > 0 ? (
          <ul className={modalNeuListClass} role="listbox" aria-label="Resultados da busca avançada">
            {filteredResults.map((result, index) => (
              <li key={`${result.type}-${result.id}-${index}`}>
                <button
                  type="button"
                  role="option"
                  onClick={() => {
                    onResultSelect(result);
                    onClose();
                  }}
                  aria-label={`Selecionar resultado: ${result.title}, tipo ${result.type}`}
                  className={modalNeuListRowClass}
                >
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{getTypeIcon(result.type)}</span>
                      <span className={cn('font-semibold', modalNeuStrongTextClass)}>
                        {result.title}
                      </span>
                      {result.type ? (
                        <span className={modalNeuTypeBadgeClass}>{result.type}</span>
                      ) : null}
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
            Digite para buscar…
          </p>
        )}
      </div>
    </Modal>
  );
};
