import React, { type RefObject } from 'react';

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
  <div className="mb-tasks-panel sm:mb-tasks-panel-loose">
    <label
      htmlFor="quick-task-search"
      className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-base-content"
      title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
    >
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      Busca rápida por tarefa ou teste
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60">🔍</span>
      <input
        ref={searchInputRef}
        id="quick-task-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Digite ID, título ou palavra-chave..."
        className="input input-bordered h-auto min-h-[44px] w-full rounded-lg border-base-300 bg-base-100 py-2 pl-10 pr-12 text-base text-base-content placeholder:text-base-content/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:min-h-[42px]"
        title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
        aria-label="Busca rápida por tarefa ou teste. Atalho: Ctrl+Shift+F"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content p-2 rounded-full hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Limpar busca"
        >
          ✕
        </button>
      )}
    </div>
    <p className="mt-1.5 text-sm leading-snug text-base-content/75">
      Filtro instantâneo na lista. Atalho: Ctrl+Shift+F (Windows) ou Cmd+Shift+F (Mac).
    </p>
  </div>
);
