import React from 'react';
import { getJiraStatusLozengeStyles } from '../../utils/jiraStatusColors';
import { cn } from '../../utils/cn';

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
        'inline-flex min-h-4 min-w-0 shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight',
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
      <span className="truncate">{label}</span>
    </span>
  );
};
