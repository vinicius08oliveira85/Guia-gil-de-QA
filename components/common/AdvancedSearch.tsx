import React, { useMemo } from 'react';
import { Project } from '../../types';
import { useSearch, type SearchResult } from '../../hooks/useSearch';
import { cn } from '../../utils/cn';

interface AdvancedSearchProps {
  projects: Project[];
  onResultSelect: (result: { type: string; id: string; projectId?: string }) => void;
  onClose: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  projects,
  onResultSelect,
  onClose,
}) => {
  const { searchQuery, setSearchQuery, searchResults } = useSearch(projects);

  const getTypeIcon = (type: SearchResult['type']) => {
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
  };

  // Filtrar resultados baseado na query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const operators = {
      'status:': (result: any) => {
        const status = query.split('status:')[1]?.split(' ')[0];
        return (
          result.type === 'task' &&
          (result.status ?? '').toLowerCase().includes((status ?? '').toLowerCase())
        );
      },
      'type:': (result: any) => {
        const type = query.split('type:')[1]?.split(' ')[0];
        return (result.type ?? '').toLowerCase() === (type ?? '').toLowerCase();
      },
      'tag:': (result: any) => {
        const tag = query.split('tag:')[1]?.split(' ')[0];
        return result.tags?.some((t: string) =>
          (t ?? '').toLowerCase().includes((tag ?? '').toLowerCase())
        );
      },
      'project:': (result: any) => {
        const projectName = query.split('project:')[1]?.split(' ')[0];
        return (result.projectName ?? '').toLowerCase().includes((projectName ?? '').toLowerCase());
      },
    };

    // Verificar se há operadores
    const hasOperator = Object.keys(operators).some(op => query.includes(op));

    if (hasOperator) {
      return searchResults.filter(result => {
        return Object.entries(operators).some(([op, fn]) => query.includes(op) && fn(result));
      });
    }

    // Busca normal
    return searchResults.filter(
      result =>
        result.title?.toLowerCase().includes(query) ||
        result.description?.toLowerCase().includes(query) ||
        result.id?.toLowerCase().includes(query)
    );
  }, [searchQuery, searchResults]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_srgb,var(--foreground)_22%,transparent)] p-4 pt-20 backdrop-blur-sm">
      <div
        className={cn(
          'mica w-full max-w-3xl overflow-hidden rounded-[var(--rounded-box)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]',
          'text-[var(--foreground)] [font-family:var(--font-sans)] tracking-[var(--letter-spacing)]'
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Busca Avançada</h2>
            <button
              onClick={onClose}
              type="button"
              className="win-icon-button shrink-0 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]"
              aria-label="Fechar busca avançada"
            >
              <span className="text-lg leading-none" aria-hidden>
                ✕
              </span>
            </button>
          </div>
        </div>
        <div className="space-y-2 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4">
          <label htmlFor="advanced-search-input" className="sr-only">
            Buscar por status, tipo, tag, projeto ou texto livre
          </label>
          <input
            id="advanced-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar... (use: status:, type:, tag:, project:)"
            aria-describedby="search-operators-description"
            className="input input-bordered w-full rounded-[var(--radius)]"
            autoFocus
          />

          <div
            id="search-operators-description"
            className="space-y-1 text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]"
          >
            <div>
              <strong>Operadores disponíveis:</strong>
            </div>
            <div>
              •{' '}
              <code className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-1.5 py-0.5 text-[var(--foreground)]">
                status:done
              </code>{' '}
              - Filtrar por status
            </div>
            <div>
              •{' '}
              <code className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-1.5 py-0.5 text-[var(--foreground)]">
                type:bug
              </code>{' '}
              - Filtrar por tipo
            </div>
            <div>
              •{' '}
              <code className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-1.5 py-0.5 text-[var(--foreground)]">
                tag:crítico
              </code>{' '}
              - Filtrar por tag
            </div>
            <div>
              •{' '}
              <code className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-1.5 py-0.5 text-[var(--foreground)]">
                project:nome
              </code>{' '}
              - Filtrar por projeto
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 sm:max-h-96">
          {filteredResults.length > 0 ? (
            <div className="space-y-2">
              {filteredResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onResultSelect(result);
                    onClose();
                  }}
                  aria-label={`Selecionar resultado: ${result.title}, tipo ${result.type}`}
                  className="w-full rounded-[var(--radius)] border border-base-300 bg-base-100 p-3 text-left transition-colors hover:bg-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,oklch(var(--p))_35%,transparent)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <span className="font-semibold text-base-content">{result.title}</span>
                        {result.type && (
                          <span className="badge badge-outline badge-sm">{result.type}</span>
                        )}
                      </div>
                      {result.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-base-content/70">
                          {result.description}
                        </p>
                      )}
                      {result.projectName && (
                        <p className="mt-1 text-xs text-base-content/70">
                          Projeto: {result.projectName}
                        </p>
                      )}
                    </div>
                    <span className="text-base-content/40">→</span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="py-8 text-center text-base-content/70">Nenhum resultado encontrado</div>
          ) : (
            <div className="py-8 text-center text-base-content/70">Digite para buscar...</div>
          )}
        </div>
      </div>
    </div>
  );
};
