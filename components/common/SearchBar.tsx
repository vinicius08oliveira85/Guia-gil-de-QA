import React, { useState, useRef, useEffect } from 'react';
import { SearchResult } from '../../hooks/useSearch';

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
  placeholder = 'Buscar projetos, tarefas, documentos... (Ctrl+K)'
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
      case 'project': return '📁';
      case 'task': return '📋';
      case 'document': return '📄';
      case 'testcase': return '✅';
      default: return '🔍';
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">🔍</span>
        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && searchQuery && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-surface border border-surface-border rounded-lg shadow-xl max-h-96 overflow-y-auto"
        >
          {searchResults.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                onSelectResult(result);
                setIsOpen(false);
                inputRef.current?.blur();
              }}
              className={`w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors ${
                index === selectedIndex ? 'bg-surface-hover' : ''
              } ${index > 0 ? 'border-t border-surface-border' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getTypeIcon(result.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary truncate">{result.title}</div>
                  <div className="text-sm text-text-secondary truncate">{result.description}</div>
                  {result.projectName && (
                    <div className="text-xs text-text-secondary mt-1">Projeto: {result.projectName}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery && searchResults.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-surface-border rounded-lg shadow-xl p-4 text-center text-text-secondary">
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  );
};

