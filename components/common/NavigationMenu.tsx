import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../utils/cn';

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
        className="fixed inset-0 z-40 bg-base-content/30 backdrop-blur-sm md:hidden"
        aria-label="Fechar menu"
        onClick={close}
      />
      <div
        ref={panelRef}
        id={menuId}
        role="menu"
        aria-label={title}
        className="absolute right-0 top-full z-50 mt-1 flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),20rem)] flex-col overflow-y-auto rounded-box border border-base-300 bg-base-100/95 p-2 shadow-xl backdrop-blur-md md:hidden"
      >
        <div className="mb-1 flex items-center justify-between gap-2 border-b border-base-200/80 px-1 pb-2">
          <span className="font-heading text-xs font-semibold uppercase tracking-wide text-base-content/70">{title}</span>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-xs min-h-8 min-w-8"
            aria-label="Fechar menu"
            onClick={close}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {leadingSlot ? <div className="border-b border-base-200/60 py-2">{leadingSlot}</div> : null}
        <ul className="menu menu-sm rounded-box p-0 font-body" role="none">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg text-left text-sm font-medium text-base-content hover:bg-base-200/80"
                onClick={() => {
                  item.onClick();
                  close();
                }}
              >
                {item.icon ? <span className="shrink-0 text-primary">{item.icon}</span> : null}
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
}

/** Menu horizontal (desktop) — itens como pills. */
export const NavigationMenuRail: React.FC<NavigationMenuRailProps> = ({ items, currentId, className }) => (
  <nav className={cn('hidden flex-wrap items-center gap-1 md:flex', className)} aria-label="Menu principal">
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        className={cn(
          'btn btn-ghost btn-sm rounded-full border border-transparent px-3',
          currentId === item.id && 'border-primary/30 bg-primary/10 text-primary'
        )}
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
      <NavigationMenuHamburger open={isOpen} onOpenChange={setIsOpen} triggerRef={triggerRef} controlsId={menuId} />
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
