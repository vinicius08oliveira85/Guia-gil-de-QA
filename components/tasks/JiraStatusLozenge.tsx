import React from 'react';
import { getJiraStatusLozengeStyles } from '../../utils/jiraStatusColors';
import { cn } from '../../utils/cn';
import { taskCardBadgePillShape, taskCardBadgePillTypography } from './taskActionLayout';

export interface JiraStatusLozengeProps {
  label: string;
  statusColor?: string;
  className?: string;
}

/**
 * Badge compacto alinhado ao lozenge de status do Jira (indicador + fundo na cor do workflow).
 */
export const JiraStatusLozenge: React.FC<JiraStatusLozengeProps> = ({
  label,
  statusColor,
  className,
}) => {
  const lozenge = getJiraStatusLozengeStyles(statusColor);

  return (
    <span
      className={cn(
        'task-list-neu-badge badge-task-format min-w-0 shrink-0 gap-0.5',
        taskCardBadgePillShape,
        taskCardBadgePillTypography,
        className
      )}
      style={{ backgroundColor: lozenge.backgroundColor, color: lozenge.color }}
      title={label}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-[2px]"
        style={{ backgroundColor: lozenge.indicatorColor }}
        aria-hidden
      />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};
