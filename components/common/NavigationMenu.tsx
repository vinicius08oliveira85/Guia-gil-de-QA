import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { headerNeuNavPillClass } from './headerNeuUi';

export interface NavigationMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface NavigationMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavigationMenuItem[];
  panelRef: React.RefObject<HTMLDivElement | null>;
  title?: string;
  /** Conteúdo extra acima da lista (ex.: ações Jira / Salvar). */
  leadingSlot?: React.ReactNode;
  menuId?: string;
  /** Id do item ativo (define `data-active` nas pills). */
  currentId?: string;
}

/**
 * Painel de menu mobile (gaveta) — use com `NavigationMenuHamburger` no Header.
 */
export const NavigationMenuDrawer: React.FC<NavigationMenuDrawerProps> = ({
  open,
  onOpenChange,
  items,
  panelRef,
  title = 'Menu',
  leadingSlot,
  menuId,
  currentId,
}) => {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    el?.focus();
  }, [open, panelRef]);

  /** Fecha a gaveta ao passar de mobile para desktop (Tailwind `md` = 768px). */
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const closeIfDesktop = () => {
      if (mq.matches) onOpenChange(false);
    };
    closeIfDesktop();
    mq.addEventListener('change', closeIfDesktop);
    return () => mq.removeEventListener('change', closeIfDesktop);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="neu-overlay fixed inset-0 z-40 md:hidden"
        aria-label="Fechar menu"
        onClick={close}
      />
      <div
        ref={panelRef}
        id={menuId}
        role="menu"
        aria-label={title}
        className={cn(
          'fixed right-3 z-[130] flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),20rem)] flex-col overflow-y-auto md:hidden',
          'app-surface !max-w-none !rounded-[var(--rounded-box)] p-2 text-[var(--leve-header-text)]'
        )}
        style={{ top: 'calc(var(--app-header-sticky-offset, 4.5rem) + 0.25rem)' }}
      >
        <div className="mb-1 flex items-center justify-between gap-2 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_30%,transparent)]/80 px-1 pb-2">
          <span className="font-heading text-xs font-semibold uppercase tracking-wide text-base-content/70">
            {title}
          </span>
          <button
            type="button"
            className="win-icon-button"
            aria-label="Fechar menu"
            onClick={close}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {leadingSlot ? <div className="border-b border-[color-mix(in_srgb,var(--leve-neu-light)_30%,transparent)]/60 py-2">{leadingSlot}</div> : null}
        <ul className="menu menu-sm rounded-box p-0 font-body" role="none">
          {items.map(item => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="app-nav-pill app-element-typography flex min-h-[44px] w-full items-center gap-2.5 rounded-[var(--radius)] px-2.5 text-left text-sm font-medium max-md:min-h-9 max-md:gap-2 max-md:px-2 max-md:py-1.5 max-md:text-xs sm:gap-3 sm:px-3"
                data-active={currentId === item.id ? 'true' : undefined}
                aria-current={currentId === item.id ? 'page' : undefined}
                onClick={() => {
                  item.onClick();
                  close();
                }}
              >
                {item.icon ? (
                  <span className="shrink-0 text-[oklch(var(--p))]">{item.icon}</span>
                ) : null}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export interface NavigationMenuHamburgerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  controlsId: string;
}

export const NavigationMenuHamburger: React.FC<NavigationMenuHamburgerProps> = ({
  open,
  onOpenChange,
  triggerRef,
  controlsId,
}) => (
  <button
    ref={triggerRef}
    type="button"
    className="win-icon-button md:hidden"
    aria-expanded={open}
    aria-controls={controlsId}
    aria-haspopup="menu"
    aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
    onClick={() => onOpenChange(!open)}
  >
    {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
  </button>
);

export interface NavigationMenuRailProps {
  items: NavigationMenuItem[];
  currentId?: string;
  className?: string;
  neuVariant?: 'default' | 'header';
}

/** Menu horizontal (desktop) — itens como pills. */
export const NavigationMenuRail: React.FC<NavigationMenuRailProps> = ({
  items,
  currentId,
  className,
  neuVariant = 'default',
}) => (
  <nav
    className={cn('hidden flex-wrap items-center gap-1 md:flex', className)}
    aria-label="Menu principal"
  >
    {items.map(item => (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        className={cn(
          neuVariant === 'header'
            ? headerNeuNavPillClass
            : 'app-nav-pill app-element-typography btn btn-ghost btn-sm rounded-[var(--radius)] px-2.5 transition-colors duration-200 sm:px-3'
        )}
        data-active={currentId === item.id ? 'true' : 'false'}
        aria-current={currentId === item.id ? 'page' : undefined}
      >
        {item.icon ? <span className="mr-1.5 inline-flex shrink-0">{item.icon}</span> : null}
        {item.label}
      </button>
    ))}
  </nav>
);

/** Menu mobile autossuficiente (hambúrguer + gaveta) — útil fora do Header. */
export const NavigationMenu: React.FC<{
  items: NavigationMenuItem[];
  currentPath?: string;
}> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId().replace(/:/g, '');
  return (
    <div className="relative md:hidden">
      <NavigationMenuHamburger
        open={isOpen}
        onOpenChange={setIsOpen}
        triggerRef={triggerRef}
        controlsId={menuId}
      />
      <NavigationMenuDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        items={items}
        panelRef={panelRef}
        menuId={menuId}
      />
    </div>
  );
};
