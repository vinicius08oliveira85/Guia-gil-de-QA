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
    <div className="mb-6 lg:mb-8">
        <label
            htmlFor="quick-task-search"
            className="text-sm font-medium text-base-content/80 mb-2 flex items-center gap-2"
            title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
        >
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Digite ID, título ou palavra-chave..."
                className="input input-bordered w-full pl-10 pr-12 py-3 h-auto min-h-[48px] bg-base-100 border-base-300 text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl shadow-sm"
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
        <p className="text-xs text-base-content/70 mt-2">
            Filtre tarefas e casos instantaneamente sem precisar abrir o painel completo de filtros. Atalho: Ctrl+Shift+F.
        </p>
    </div>
);
