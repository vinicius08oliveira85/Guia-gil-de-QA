import React, { type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  leveViewSearchHintClass,
  leveViewSearchInputClass,
  leveViewSearchLabelClass,
} from '../common/projectCardUi';

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
      className={leveViewSearchLabelClass}
      title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
    >
      Busca rápida
    </label>
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--leve-header-text-muted)]"
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
        className={cn(leveViewSearchInputClass, 'pr-10')}
        title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
        aria-label="Busca rápida por tarefa ou teste. Atalho: Ctrl+Shift+F"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="win-icon-button absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-accent)]"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
    <p className={leveViewSearchHintClass}>
      Filtro instantâneo na lista · Ctrl+Shift+F (Windows) ou Cmd+Shift+F (Mac)
    </p>
  </div>
);
