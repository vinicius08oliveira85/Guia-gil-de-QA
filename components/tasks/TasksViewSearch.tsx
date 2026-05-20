import React, { type RefObject } from 'react';
import { Search, X } from 'lucide-react';

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
      className="mb-2 block text-sm font-medium text-base-content/80"
      title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
    >
      Busca rápida
    </label>
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/45"
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
        className="h-11 w-full rounded-lg border border-base-300/80 bg-base-100 py-2 pl-10 pr-10 text-sm text-base-content shadow-sm placeholder:text-base-content/45 focus:border-[color-mix(in_srgb,var(--brand-cta)_50%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-cta)_22%,transparent)] sm:h-10"
        title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
        aria-label="Busca rápida por tarefa ou teste. Atalho: Ctrl+Shift+F"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-base-content/55 transition-colors hover:bg-base-200/80 hover:text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)]"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
    <p className="mt-1.5 text-xs text-base-content/55">
      Filtro instantâneo na lista · Ctrl+Shift+F (Windows) ou Cmd+Shift+F (Mac)
    </p>
  </div>
);
