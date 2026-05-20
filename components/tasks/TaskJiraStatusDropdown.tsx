import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import {
  ensureJiraHexColor,
  getJiraStatusColor,
  getJiraStatusLozengeStyles,
} from '../../utils/jiraStatusColors';
import { cn } from '../../utils/cn';
import {
  taskCardBadgePillShape,
  taskCardBadgePillTypography,
  taskCardButtonShape,
  taskCardButtonTypography,
} from './taskActionLayout';

type JiraStatusEntry = { name: string; color?: string } | string;

interface TaskJiraStatusDropdownProps {
  currentLabel: string;
  currentStatusColor?: string;
  statusTextColor?: string;
  jiraStatuses?: JiraStatusEntry[];
  /** `lozenge` — metadados do card; `pill` — botão compacto na faixa de ações. */
  variant?: 'pill' | 'lozenge';
  disabled?: boolean;
  className?: string;
  onSelectStatus: (statusName: string) => void;
}

const FALLBACK_STATUS_OPTIONS = [
  { label: 'A Fazer', value: 'To Do', colorClassName: 'bg-base-content/35' },
  { label: 'Em Andamento', value: 'In Progress', colorClassName: 'bg-info' },
  { label: 'Concluído', value: 'Done', colorClassName: 'bg-success' },
] as const;

const MENU_WIDTH_PX = 192;

/**
 * Dropdown autocontido para alterar o status Jira da tarefa.
 * O menu é renderizado em portal para não ser cortado pelo overflow do card.
 */
export const TaskJiraStatusDropdown: React.FC<TaskJiraStatusDropdownProps> = ({
  currentLabel,
  currentStatusColor,
  statusTextColor,
  jiraStatuses,
  variant = 'pill',
  disabled = false,
  className,
  onSelectStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLozenge = variant === 'lozenge';
  const lozengeStyles = getJiraStatusLozengeStyles(currentStatusColor);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(MENU_WIDTH_PX, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);

    setMenuPosition({
      top: rect.bottom + 4,
      left,
      width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [isOpen, currentLabel, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Adia o listener para o clique de abertura não fechar imediatamente o menu.
    const timerId = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDownOutside);
    }, 0);

    document.addEventListener('keydown', handleEscape);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const renderMenuItems = () => {
    if (jiraStatuses && jiraStatuses.length > 0) {
      return jiraStatuses.map(status => {
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
              'flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm tracking-[var(--letter-spacing)] transition-colors hover:bg-base-200',
              isSelected && 'bg-base-200 font-semibold text-[var(--brand-text-strong)]'
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
            <span className="text-[var(--brand-text-strong)]">{statusName}</span>
          </button>
        );
      });
    }

    return FALLBACK_STATUS_OPTIONS.map(option => (
      <button
        key={option.value}
        type="button"
        onClick={e => {
          e.stopPropagation();
          onSelectStatus(option.value);
          setIsOpen(false);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm tracking-[var(--letter-spacing)] text-[var(--brand-text-strong)] transition-colors hover:bg-base-200"
      >
        <div className={cn('h-3 w-3 shrink-0 rounded-full', option.colorClassName)} />
        <span>{option.label}</span>
      </button>
    ));
  };

  const menuPortal =
    isOpen &&
    menuPosition &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        role="listbox"
        aria-label="Opções de status Jira"
        className="mica max-h-[min(16rem,70vh)] overflow-y-auto overscroll-contain rounded-[var(--rounded-box)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[var(--brand-surface-strong)] shadow-[0_12px_32px_-12px_var(--brand-surface-shadow)] backdrop-blur-md"
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          zIndex: 10000,
        }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {renderMenuItems()}
      </div>,
      document.body
    );

  return (
    <>
      <div className={cn('relative flex-shrink-0', className)} ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            if (disabled) return;
            setIsOpen(current => !current);
          }}
          className={cn(
            'inline-flex min-w-0 shrink-0 items-center border-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-wait disabled:opacity-60',
            isLozenge
              ? cn('gap-0.5', taskCardBadgePillShape, taskCardBadgePillTypography)
              : cn(
                  'w-full min-h-[44px] justify-between gap-2 bg-primary text-primary-content sm:min-h-0 sm:min-w-[120px] sm:px-4 sm:py-1.5',
                  taskCardButtonShape,
                  taskCardButtonTypography,
                  'px-3 py-2 sm:text-xs'
                )
          )}
          style={
            isLozenge
              ? {
                  backgroundColor: lozengeStyles.backgroundColor,
                  color: lozengeStyles.color,
                }
              : currentStatusColor
                ? {
                    backgroundColor: currentStatusColor,
                    color: statusTextColor || 'oklch(var(--pc))',
                  }
                : undefined
          }
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Status: ${currentLabel}. Clique para mudar.`}
        >
          {isLozenge ? (
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: lozengeStyles.indicatorColor }}
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              'min-w-0 truncate',
              isLozenge ? 'max-w-[7.5rem] whitespace-nowrap' : 'max-w-[5rem] sm:max-w-none'
            )}
          >
            {currentLabel}
          </span>
          <ChevronDown
            className={cn(
              'flex-shrink-0 transition-transform',
              isLozenge ? 'h-2.5 w-2.5 opacity-70' : 'h-4 w-4',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
      </div>
      {menuPortal}
    </>
  );
};
