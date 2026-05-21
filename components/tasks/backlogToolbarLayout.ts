import { cn } from '../../utils/cn';

/** Painel de filtros do backlog — abaixo das abas Todas / Backlog. */
export const backlogToolbarPanelClass = cn(
  'app-element-typography w-full min-w-0 rounded-[var(--rounded-box)] border border-[var(--brand-surface-border)]',
  'bg-[var(--brand-surface-strong)] px-2 py-1.5 shadow-sm sm:px-2.5'
);

export const backlogToolbarHelpClass = cn(
  'text-[10px] leading-snug text-[var(--brand-text-muted)] sm:text-[11px]'
);

/** Grade responsiva: 2 → 3 → 6 colunas (uma linha em telas largas). */
export const backlogToolbarGridClass = cn(
  'grid w-full grid-cols-2 gap-x-1.5 gap-y-1.5 sm:grid-cols-3 sm:gap-x-2 xl:grid-cols-6 xl:gap-x-1.5 xl:gap-y-1'
);

export const backlogToolbarSelectClass = cn(
  'backlog-toolbar-select app-element-typography h-7 w-full min-w-0 cursor-pointer',
  'rounded-full border border-[color-mix(in_srgb,var(--brand-text-muted)_22%,transparent)]',
  'bg-[var(--brand-surface-strong)] py-0.5 pl-2 pr-6 text-[11px] font-semibold leading-tight',
  'text-[var(--brand-text-strong)] shadow-sm transition-[border-color,box-shadow] duration-150',
  'hover:border-[color-mix(in_srgb,var(--brand-highlight)_40%,transparent)]',
  'focus:border-[color-mix(in_srgb,var(--brand-highlight)_55%,transparent)]',
  'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-highlight)_18%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const backlogToolbarLabelClass =
  'text-[10px] font-medium leading-none text-[var(--brand-text-muted)]';

export const backlogToolbarFieldClass = 'flex min-w-0 w-full flex-col gap-0.5';

export const backlogToolbarFieldHeaderClass = 'flex min-w-0 items-center justify-between gap-1';

export const backlogToolbarClearLinkClass = cn(
  'shrink-0 text-[10px] font-medium leading-none text-[var(--brand-text-muted)]',
  'underline-offset-2 hover:text-[var(--brand-text-strong)] hover:underline disabled:opacity-50'
);

export const backlogListSurfaceClass = cn(
  'backlog-list-surface app-element-typography overflow-hidden rounded-[var(--rounded-box)]',
  'border border-[var(--brand-surface-border)] bg-[var(--brand-chip)] shadow-sm'
);

export const backlogListSurfaceHeaderClass = cn(
  'flex flex-wrap items-center justify-between gap-2 border-b border-[var(--brand-surface-border)]',
  'bg-[color-mix(in_srgb,var(--brand-text-muted)_6%,var(--brand-chip))] px-3 py-2 sm:px-4'
);

export const backlogActiveChipClass = cn(
  'inline-flex items-center gap-0.5 rounded-full border border-[var(--brand-surface-border)]',
  'bg-[var(--brand-surface-strong)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-text-muted)]'
);

export const backlogToolbarChipsRowClass = cn(
  'flex flex-wrap items-center gap-1 border-t border-[var(--brand-surface-border)] pt-1 mt-1'
);
