import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LAYER_Z_INDEX } from '../../utils/layerZIndex';
import { appMenuItemClass, appMenuPanelClass, neuSelectTriggerClass } from '../common/viewUi';

export interface JiraFilasSearchableMultiSelectOption {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
}

export interface JiraFilasSearchableMultiSelectProps {
  id?: string;
  options: JiraFilasSearchableMultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  'aria-label'?: string;
  summaryLabel?: string;
}

/**
 * Multi-select com busca por texto — usado na seleção de projetos Jira.
 */
export const JiraFilasSearchableMultiSelect: React.FC<JiraFilasSearchableMultiSelectProps> = ({
  id,
  options,
  selectedValues,
  onChange,
  disabled = false,
  className,
  placeholder = 'Selecionar…',
  searchPlaceholder = 'Buscar…',
  'aria-label': ariaLabel,
  summaryLabel,
}) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const searchId = `${selectId}-search`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const displayLabel = useMemo(() => {
    if (summaryLabel) return summaryLabel;
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const match = options.find(opt => opt.value === selectedValues[0]);
      return match?.label ?? selectedValues[0];
    }
    return `${selectedValues.length} selecionados`;
  }, [summaryLabel, selectedValues, options, placeholder]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(opt => {
      const haystack = (opt.searchText ?? `${opt.label} ${opt.value}`).toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 280);
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
      setQuery('');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    const timerId = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointerDownOutside);
      searchRef.current?.focus();
    }, 0);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('mousedown', onPointerDownOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const toggleValue = useCallback(
    (value: string) => {
      const next = new Set(selectedValues);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      onChange(Array.from(next));
    },
    [onChange, selectedValues]
  );

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
        aria-multiselectable="true"
        className={cn(appMenuPanelClass, 'max-h-[min(20rem,70vh)] overscroll-contain p-1.5')}
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          zIndex: LAYER_Z_INDEX.modalPopover,
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="relative mb-1.5 px-0.5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--brand-text-muted)]"
            aria-hidden
          />
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'h-8 w-full rounded-full border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)]',
              'pl-8 pr-8 font-sans text-xs text-[var(--brand-text-strong)] placeholder:text-[var(--brand-text-muted)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
              'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]'
            )}
            aria-label={`${searchPlaceholder} ${ariaLabel ?? ''}`.trim()}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--brand-text-muted)] hover:text-[var(--project-card-accent)]"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="max-h-52 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-2 font-sans text-xs text-[var(--brand-text-muted)]">
              Nenhum resultado para &quot;{query}&quot;.
            </p>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = selectedSet.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return;
                    toggleValue(opt.value);
                  }}
                  className={cn(
                    appMenuItemClass,
                    'w-full justify-start gap-2',
                    isSelected && 'app-menu-item-active',
                    opt.disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-highlight pointer-events-none shrink-0"
                    checked={isSelected}
                    readOnly
                    tabIndex={-1}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-left" title={opt.label}>
                    {opt.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
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
          onClick={() => {
            if (disabled) return;
            setIsOpen(open => !open);
          }}
          className={cn(neuSelectTriggerClass, className)}
        >
          <span className="min-w-0 flex-1 truncate text-left">{displayLabel}</span>
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

JiraFilasSearchableMultiSelect.displayName = 'JiraFilasSearchableMultiSelect';
