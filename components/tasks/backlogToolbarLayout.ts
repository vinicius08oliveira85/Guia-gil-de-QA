import { cn } from '../../utils/cn';

/** Painel de filtros do backlog — abaixo das abas Todas / Backlog. */
export const backlogToolbarPanelClass = cn(
  'leve-neu-surface app-element-typography w-full min-w-0 px-2 py-1.5 sm:px-2.5'
);

export const backlogToolbarHelpClass = cn(
  'text-[10px] leading-snug text-[var(--leve-header-text-muted)] sm:text-[11px]'
);

/** Grade responsiva: 2 → 3 → 6 colunas (uma linha em telas largas). */
export const backlogToolbarGridClass = cn(
  'grid w-full grid-cols-2 gap-x-1.5 gap-y-1.5 sm:grid-cols-3 sm:gap-x-2 xl:grid-cols-6 xl:gap-x-1.5 xl:gap-y-1'
);

export const backlogToolbarSelectClass = cn(
  'backlog-toolbar-select app-select app-element-typography h-7 w-full min-w-0 cursor-pointer',
  'rounded-full py-0.5 pl-2 pr-6 text-[11px] font-semibold leading-tight',
  'text-[var(--leve-header-text)] transition-[box-shadow,border-color] duration-150',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const backlogToolbarLabelClass =
  'text-[10px] font-medium leading-none text-[var(--leve-header-text-muted)]';

export const backlogToolbarFieldClass = 'flex min-w-0 w-full flex-col gap-0.5';

export const backlogToolbarFieldHeaderClass = 'flex min-w-0 items-center justify-between gap-1';

export const backlogToolbarClearLinkClass = cn(
  'shrink-0 text-[10px] font-medium leading-none text-[var(--leve-header-text-muted)]',
  'underline-offset-2 hover:text-[var(--leve-header-text)] hover:underline disabled:opacity-50'
);

export const backlogListSurfaceClass = cn(
  'backlog-list-surface leve-neu-surface app-element-typography overflow-hidden'
);

export const backlogListSurfaceHeaderClass = cn(
  'leve-neu-surface-inset flex flex-wrap items-center justify-between gap-2 border-0 px-3 py-2 sm:px-4'
);

/** Corpo da lista — fundo creme para os cards neu “saltarem”. */
export const backlogListSurfaceBodyClass = 'min-w-0 bg-[var(--leve-neu-bg)] p-3 sm:p-4';

export const backlogActiveChipClass = cn(
  'leve-neu-pill inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--leve-header-text-muted)]'
);

export const backlogToolbarChipsRowClass = cn(
  'flex flex-wrap items-center gap-1 border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pt-1 mt-1'
);
