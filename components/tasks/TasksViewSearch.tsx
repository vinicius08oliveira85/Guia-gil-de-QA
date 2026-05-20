import React, { type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { searchInputClass } from '../common/viewUi';

export interface TasksViewSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export const TasksViewSearch: React.FC<TasksViewSearchProps> = ({
  searchQuery,
  onSearchChange,
  searchInputRef,
}) => (
  <div className="py-1">
    <label
      htmlFor="quick-task-search"
      className="app-element-typography mb-2 block text-sm font-medium text-[var(--brand-text-muted)]"
      title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
    >
      Busca rápida
    </label>
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-text-muted)]"
        aria-hidden
      />
      <input
        ref={searchInputRef}
        id="quick-task-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="ID, título ou palavra-chave…"
        className={cn(searchInputClass, 'h-11 pr-10 sm:h-10')}
        title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
        aria-label="Busca rápida por tarefa ou teste. Atalho: Ctrl+Shift+F"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="win-icon-button absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
    <p className="app-element-typography mt-1.5 text-xs text-[var(--brand-text-muted)]">
      Filtro instantâneo na lista · Ctrl+Shift+F (Windows) ou Cmd+Shift+F (Mac)
    </p>
  </div>
);
