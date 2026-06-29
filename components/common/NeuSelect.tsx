import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { appMenuItemClass, appMenuPanelClass, neuSelectTriggerClass } from './viewUi';

export type NeuSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface NeuSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: NeuSelectOption[];
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  placeholder?: string;
  title?: string;
}

export const NeuSelect: React.FC<NeuSelectProps> = ({
  id,
  value,
  onChange,
  options,
  disabled = false,
  className,
  'aria-label': ariaLabel,
  placeholder = 'Selecionar…',
  title,
}) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find(opt => opt.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 160);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    setMenuPosition({ top: rect.bottom + 4, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [isOpen, updateMenuPosition, displayLabel]);

  useEffect(() => {
    if (!isOpen) return;
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    const timerId = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointerDownOutside);
    }, 0);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('mousedown', onPointerDownOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const menuPortal =
    isOpen &&
    menuPosition &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        className={cn(appMenuPanelClass, 'max-h-[min(16rem,70vh)] overscroll-contain p-1.5')}
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          zIndex: 10000,
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {options.map(opt => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={opt.disabled}
              onClick={() => {
                if (opt.disabled) return;
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                appMenuItemClass,
                isSelected && 'app-menu-item-active',
                opt.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="block min-w-0 truncate text-left" title={opt.label}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <>
      <div ref={rootRef} className={cn('relative min-w-0', className?.includes('w-full') && 'w-full')}>
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-label={ariaLabel}
          title={title}
          onClick={() => {
            if (disabled) return;
            setIsOpen(open => !open);
          }}
          className={cn(neuSelectTriggerClass, className)}
        >
          <span className="min-w-0 truncate">{displayLabel}</span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 opacity-70 transition-transform', isOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
      </div>
      {menuPortal}
    </>
  );
};
