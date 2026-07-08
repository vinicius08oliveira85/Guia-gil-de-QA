import React, { useState, useRef, useEffect } from 'react';
import { SearchResult } from '../../hooks/useSearch';
import { cn } from '../../utils/cn';
import {
  appMenuItemClass,
  appMenuPanelClass,
  searchInputClass,
} from './viewUi';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectResult,
  placeholder = 'Buscar projetos, tarefas, documentos... (Ctrl+K)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      if (e.key === 'ArrowDown' && isOpen && searchResults.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      }
      if (e.key === 'ArrowUp' && isOpen && searchResults.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && isOpen && searchResults[selectedIndex]) {
        e.preventDefault();
        onSelectResult(searchResults[selectedIndex]);
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onSelectResult]);

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

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

  const inputId = 'global-search-input';

  return (
    <div className="relative w-full max-w-2xl">
      <label htmlFor={inputId} className="sr-only">
        Buscar em projetos, tarefas, documentos e casos de teste
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => {
            onSearchChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={searchInputClass}
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/72">
          🔍
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setIsOpen(false);
            }}
            className="win-icon-button absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && searchQuery && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className={cn(
            appMenuPanelClass,
            'absolute z-50 w-full mt-2 max-h-[60vh] sm:max-h-96 overflow-y-auto'
          )}
        >
          {searchResults.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => {
                onSelectResult(result);
                setIsOpen(false);
                inputRef.current?.blur();
              }}
              className={cn(
                appMenuItemClass,
                index === selectedIndex && 'app-menu-item-active'
              )}
            >
              <span className="text-xl">{getTypeIcon(result.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{result.title}</div>
                <div className="text-sm text-[var(--app-menu-text-muted)] truncate">
                  {result.description}
                </div>
                {result.projectName && (
                  <div className="text-xs text-[var(--app-menu-text-muted)] mt-1">
                    Projeto: {result.projectName}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery && searchResults.length === 0 && (
        <div
          className={cn(
            appMenuPanelClass,
            'absolute z-50 w-full mt-2 p-4 text-center text-[var(--app-menu-text-muted)]'
          )}
        >
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  );
};
