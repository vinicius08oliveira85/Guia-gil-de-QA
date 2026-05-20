import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { appMenuItemClass, appMenuPanelClass } from '../common/viewUi';

interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
}

/**
 * Menu de ações adicionais (3 pontos)
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({ items, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const defaultTrigger = (
    <button
      type="button"
      className="win-icon-button btn btn-sm btn-ghost"
      aria-label="Menu de ações"
      aria-expanded={isOpen}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
        />
      </svg>
    </button>
  );

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger || defaultTrigger}</div>

      {isOpen && (
        <div className={cn(appMenuPanelClass, 'absolute right-0 mt-xs z-50 w-48')}>
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                appMenuItemClass,
                item.disabled && 'opacity-50 cursor-not-allowed',
                item.variant === 'danger' && 'app-menu-item-danger'
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
