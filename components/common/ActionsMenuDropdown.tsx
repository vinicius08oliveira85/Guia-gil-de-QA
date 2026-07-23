import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  show?: boolean;
}

interface ActionsMenuDropdownProps {
  actions: ActionItem[];
  triggerLabel?: string;
  align?: 'left' | 'right';
  className?: string;
}

export const ActionsMenuDropdown: React.FC<ActionsMenuDropdownProps> = ({
  actions,
  triggerLabel = 'Mais ações',
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleActions = actions.filter(a => a.show !== false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (visibleActions.length === 0) return null;

  return (
    <div ref={menuRef} className={cn('relative inline-block', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">{triggerLabel}</span>
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-base-300 bg-base-100 py-1 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          {visibleActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { action.onClick(); setIsOpen(false); }}
              disabled={action.disabled}
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                action.variant === 'danger'
                  ? 'text-error hover:bg-error/10'
                  : 'text-base-content hover:bg-base-200',
                action.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {action.icon && <span className="h-4 w-4 shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
