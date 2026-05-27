import React, { type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  tasksPanelSearchClearBtnClass,
  tasksPanelSearchHintClass,
  tasksPanelSearchIconClass,
  tasksPanelSearchInputClass,
  tasksPanelSearchLabelClass,
} from './tasksPanelNeuStyles';

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
      className={tasksPanelSearchLabelClass}
      title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
    >
      Busca rápida
    </label>
    <div className="relative">
      <Search className={tasksPanelSearchIconClass} aria-hidden />
      <input
        ref={searchInputRef}
        id="quick-task-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="ID, título ou palavra-chave…"
        className={cn(tasksPanelSearchInputClass, 'pr-10')}
        title="Atalho: Ctrl+Shift+F (ou Cmd+Shift+F no Mac)"
        aria-label="Busca rápida por tarefa ou teste. Atalho: Ctrl+Shift+F"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className={tasksPanelSearchClearBtnClass}
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
    <p className={tasksPanelSearchHintClass}>
      Filtro instantâneo na lista · Ctrl+Shift+F (Windows) ou Cmd+Shift+F (Mac)
    </p>
  </div>
);
