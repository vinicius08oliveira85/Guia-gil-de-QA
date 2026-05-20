import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import {
  taskCollapsibleHeaderClass,
  taskCollapsibleShellClass,
  taskLabelMutedClass,
  taskTextStrongClass,
} from './taskActionLayout';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}

/**
 * Seção colapsável reutilizável
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  icon,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={taskCollapsibleShellClass}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={taskCollapsibleHeaderClass}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} seção ${title}`}
      >
        <div className="flex items-center gap-xs">
          {icon && <span className={taskLabelMutedClass}>{icon}</span>}
          <span className={cn('text-sm font-semibold', taskTextStrongClass)}>{title}</span>
        </div>
        <svg
          className={cn(
            'h-4 w-4 transition-transform',
            taskLabelMutedClass,
            isExpanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="p-sm">{children}</div>}
    </div>
  );
};
