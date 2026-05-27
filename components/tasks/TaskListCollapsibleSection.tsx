import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { taskListSectionPanelClass } from './backlogToolbarLayout';
import {
  tasksPanelSectionChevronClass,
  tasksPanelSectionCountClass,
  tasksPanelSectionToggleClass,
} from './tasksPanelNeuStyles';

export interface TaskListCollapsibleSectionProps {
  sectionId: string;
  title: string;
  icon: React.ReactNode;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  titleClassName?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Seção da lista de tarefas com cabeçalho neumórfico expansível (Favoritos, Outras tarefas).
 */
export const TaskListCollapsibleSection: React.FC<TaskListCollapsibleSectionProps> = ({
  sectionId,
  title,
  icon,
  count,
  isOpen,
  onToggle,
  titleClassName,
  children,
  className,
}) => {
  const panelId = `${sectionId}-panel`;
  const buttonId = `${sectionId}-toggle`;

  return (
    <section className={cn('min-w-0', className)} aria-label={title}>
      <button
        type="button"
        id={buttonId}
        className={cn(tasksPanelSectionToggleClass, 'mb-2')}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider',
            titleClassName
          )}
        >
          {icon}
          <span className="truncate">{title}</span>
          <span className={tasksPanelSectionCountClass}>({count})</span>
        </span>
        <ChevronDown
          className={cn(tasksPanelSectionChevronClass, isOpen && 'rotate-180')}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className={taskListSectionPanelClass}>
          {children}
        </div>
      ) : null}
    </section>
  );
};
