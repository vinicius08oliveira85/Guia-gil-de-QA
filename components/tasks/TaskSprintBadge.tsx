import React from 'react';
import type { JiraSprint } from '../../types';
import { cn } from '../../utils/cn';
import { isActiveSprint } from '../../utils/taskSprintDisplay';

export interface TaskSprintBadgeProps {
  sprint: JiraSprint;
  className?: string;
}

export const TaskSprintBadge: React.FC<TaskSprintBadgeProps> = ({ sprint, className }) => {
  const active = isActiveSprint(sprint);
  const name = sprint.name?.trim() || 'Sprint';

  return (
    <span
      className={cn(
        'badge-task-format shrink-0 border px-2 py-0.5 normal-case tracking-wide',
        active
          ? 'border-[color-mix(in_srgb,var(--brand-highlight)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_12%,transparent)] text-[var(--brand-highlight)]'
          : 'border-base-300/70 bg-base-200/60 text-base-content/70',
        className
      )}
      title={active ? `Sprint ativa: ${name}` : `Sprint: ${name}`}
    >
      {name}
    </span>
  );
};
