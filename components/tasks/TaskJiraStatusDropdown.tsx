import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ensureJiraHexColor, getJiraStatusColor } from '../../utils/jiraStatusColors';
import { cn } from '../../utils/cn';

type JiraStatusEntry = { name: string; color?: string } | string;

interface TaskJiraStatusDropdownProps {
  currentLabel: string;
  currentStatusColor?: string;
  statusTextColor?: string;
  jiraStatuses?: JiraStatusEntry[];
  className?: string;
  onSelectStatus: (statusName: string) => void;
}

const FALLBACK_STATUS_OPTIONS = [
  { label: 'A Fazer', value: 'To Do', colorClassName: 'bg-base-content/35' },
  { label: 'Em Andamento', value: 'In Progress', colorClassName: 'bg-info' },
  { label: 'Concluído', value: 'Done', colorClassName: 'bg-success' },
] as const;

/**
 * Dropdown autocontido para alterar o status Jira da tarefa.
 */
export const TaskJiraStatusDropdown: React.FC<TaskJiraStatusDropdownProps> = ({
  currentLabel,
  currentStatusColor,
  statusTextColor,
  jiraStatuses,
  className,
  onSelectStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative flex-shrink-0', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setIsOpen(current => !current);
        }}
        className="inline-flex w-full min-h-[44px] min-w-0 shrink-0 items-center justify-between gap-2 rounded-full border-0 bg-primary px-3 py-2 text-[10px] font-bold text-primary-content sm:min-h-0 sm:min-w-[120px] sm:px-4 sm:py-1.5 sm:text-xs"
        style={
          currentStatusColor
            ? {
                backgroundColor: currentStatusColor,
                color: statusTextColor || 'oklch(var(--pc))',
              }
            : undefined
        }
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Status: ${currentLabel}. Clique para mudar.`}
      >
        <span className="truncate max-w-[5rem] sm:max-w-none min-w-0">{currentLabel}</span>
        <ChevronDown
          className={cn('w-4 h-4 flex-shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="mica absolute right-0 z-50 mt-1 max-w-[calc(100vw-2rem)] w-40 overflow-hidden !rounded-[var(--rounded-box)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] sm:w-48">
          {jiraStatuses && jiraStatuses.length > 0 ? (
            jiraStatuses.map(status => {
              const statusName = typeof status === 'string' ? status : status.name;
              const statusColor =
                typeof status === 'string'
                  ? getJiraStatusColor(statusName)
                  : status.color
                    ? ensureJiraHexColor(status.color, status.name)
                    : getJiraStatusColor(statusName);
              const isSelected = currentLabel === statusName;

              return (
                <button
                  key={statusName}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectStatus(statusName);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors',
                    isSelected && 'bg-base-200 font-semibold'
                  )}
                  style={
                    isSelected
                      ? {
                          borderLeft: `3px solid ${statusColor || 'oklch(var(--b3))'}`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: statusColor || 'oklch(var(--b3))' }}
                  />
                  <span>{statusName}</span>
                </button>
              );
            })
          ) : (
            <>
              {FALLBACK_STATUS_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectStatus(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                >
                  <div className={cn('h-3 w-3 shrink-0 rounded-full', option.colorClassName)} />
                  <span>{option.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
