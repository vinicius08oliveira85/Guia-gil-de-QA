import { cn } from '../../utils/cn';

/**
 * Card escuro neumórfico (#4a423e) — cabeçalho + KPIs / filtros rápidos.
 * Usado em Dashboard, Tarefas, Documentos, Regras e Meus Projetos (áreas impressas).
 */
export const viewHeroChromeClass = cn(
  'dashboard-hero-chrome project-chrome-neu-shell tasks-panel-dark-surface',
  'rounded-[var(--leve-header-radius)] px-3 py-3 sm:px-4 sm:py-4',
  'flex flex-col gap-4 sm:gap-5'
);

export const viewHeroHeaderShellClass = 'flex flex-col gap-4 font-sans sm:gap-5';

export const viewHeroTitleClass = cn(
  'font-sans text-2xl font-bold tracking-tight text-[var(--workspace-panel-text)] sm:text-[1.65rem]'
);

export const viewHeroJiraBadgeClass = cn(
  'workspace-chrome-badge inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold'
);

export const viewHeroSubtitleClass =
  'max-w-2xl font-sans text-sm leading-relaxed text-[var(--workspace-panel-text-muted)]';

export const viewHeroMutedClass = 'font-sans text-[var(--workspace-panel-text-muted)]';

export const viewHeroFilterChipClass = cn(
  'workspace-chrome-pill inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 font-sans text-xs',
  'text-[var(--workspace-panel-text)]',
  '[&_button]:text-[var(--workspace-panel-accent)] [&_button:hover]:text-[var(--workspace-panel-text)]'
);

export const viewHeroToolbarClass = cn(
  'dashboard-neu-filter-toolbar workspace-chrome-inset',
  'inline-flex items-stretch gap-0.5 p-0.5'
);

export const viewHeroToolbarDividerClass =
  'my-1.5 w-px shrink-0 self-stretch bg-[var(--workspace-panel-divider)]';

export const viewHeroToolbarBtnClass = cn(
  'dashboard-neu-filter-btn workspace-chrome-pill',
  'inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm font-semibold sm:min-h-0',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const viewHeroToolbarBtnActiveClass = cn(
  'dashboard-neu-filter-btn dashboard-neu-filter-btn--active workspace-chrome-pill-active',
  'inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm font-semibold sm:min-h-0',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const viewHeroToolbarIconWrapClass = cn(
  'dashboard-neu-filter-icon-wrap workspace-chrome-badge',
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--workspace-panel-accent)]'
);

export const viewHeroToolbarIconClass = 'h-3.5 w-3.5 shrink-0';

export const viewHeroToolbarCountClass = cn(
  'dashboard-neu-filter-count workspace-chrome-count-active',
  'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

export const viewHeroPrimaryBtnClass = cn(
  'workspace-chrome-pill-active inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 py-2',
  'font-sans text-sm font-bold sm:min-h-9',
  'transition-[filter,transform,box-shadow] duration-150',
  'hover:brightness-110 hover:-translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_45%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const viewHeroMobileActionBtnClass = cn(
  'workspace-chrome-pill inline-flex min-h-[44px] items-center gap-2 px-3 py-2',
  'font-sans text-sm font-semibold text-[var(--workspace-panel-text-muted)] sm:min-h-9',
  'disabled:opacity-50'
);
