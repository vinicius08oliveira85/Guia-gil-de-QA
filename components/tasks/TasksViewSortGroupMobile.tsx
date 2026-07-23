import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AppSelect } from '../common/AppSelect';
import { tasksPanelToolbarFieldClass, tasksPanelToolbarLabelClass, tasksPanelToolbarSelectClass } from './tasksPanelNeuStyles';

interface TasksViewSortGroupMobileProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  groupBy: string;
  onGroupChange: (value: string) => void;
}

export const TasksViewSortGroupMobile: React.FC<TasksViewSortGroupMobileProps> = ({
  sortBy,
  onSortChange,
  groupBy,
  onGroupChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'tasks-panel-toolbar-export-btn inline-flex min-h-7 items-center gap-1 rounded-selector px-2 py-0.5 text-[11px] font-semibold',
          'text-base-content/72 hover:text-primary border border-base-300/55',
          open && 'bg-primary/10 text-primary'
        )}
        aria-label="Opções de ordenação e agrupamento"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        <span className="max-sm:hidden">Ordenar</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 flex min-w-[13rem] flex-col gap-2 rounded-[var(--rounded-box,1rem)] border border-base-300/55 bg-[var(--leve-neu-bg,oklch(100% 0 0))] p-3 shadow-[var(--neu-flat-shadow)]">
          <div className={tasksPanelToolbarFieldClass}>
            <label htmlFor="mobile-sort-by" className={tasksPanelToolbarLabelClass}>
              Ordenar
            </label>
            <AppSelect
              id="mobile-sort-by"
              value={sortBy}
              onChange={onSortChange}
              className={cn(tasksPanelToolbarSelectClass, 'w-full')}
              aria-label="Ordenação da lista de tarefas"
            >
              <option value="id">ID</option>
              <option value="status">Status</option>
              <option value="priority">Prioridade</option>
              <option value="createdAt">Data de criação</option>
              <option value="updatedAt">Data de atualização</option>
              <option value="title">Título</option>
            </AppSelect>
          </div>
          <div className={tasksPanelToolbarFieldClass}>
            <label htmlFor="mobile-group-by" className={tasksPanelToolbarLabelClass}>
              Agrupar
            </label>
            <AppSelect
              id="mobile-group-by"
              value={groupBy}
              onChange={onGroupChange}
              className={cn(tasksPanelToolbarSelectClass, 'w-full')}
              aria-label="Agrupar lista de tarefas por"
            >
              <option value="none">Nenhum</option>
              <option value="status">Status</option>
              <option value="priority">Prioridade</option>
              <option value="type">Tipo</option>
            </AppSelect>
          </div>
        </div>
      )}
    </div>
  );
};
