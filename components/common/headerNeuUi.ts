import { cn } from '../../utils/cn';

/** Trilho rebaixado (roxo profundo + inset) — abas, Jira/Salvar no header. */
export const headerNeuTrackClass = cn(
  'app-header-neu-track',
  'flex flex-wrap items-center gap-1.5 overflow-visible rounded-full p-1',
  'transition-[background-color,border-color,box-shadow] duration-300 ease-out'
);

/** Base compartilhada — pills da toolbar (Novo projeto, Sincronizar, Projetos). */
export const headerNeuToolbarPillBaseClass = cn(
  'app-header-neu-toolbar-pill app-element-typography',
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 py-1.5',
  'text-xs font-semibold whitespace-nowrap',
  'border border-transparent',
  'transition-[box-shadow,color,background-color,border-color,transform] duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

/** Ação secundária (ex.: Sincronizar) — inset no roxo do header. */
export const headerNeuToolbarPillSecondaryClass = cn(
  headerNeuToolbarPillBaseClass,
  'app-header-neu-toolbar-pill--secondary'
);

/** CTA primária (ex.: Novo projeto) — mantém gradiente laranja Leve. */
export const headerNeuToolbarPillPrimaryClass = cn(
  headerNeuToolbarPillBaseClass,
  'app-header-neu-toolbar-pill--primary'
);

/** Chip elevado dentro do trilho rebaixado. */
export const headerNeuChipClass = cn(
  'app-header-neu-chip',
  'relative z-[1] flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center',
  'overflow-visible rounded-full border border-transparent px-2 text-xs font-semibold outline-none',
  'transition-[background-color,box-shadow,color] duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'max-md:min-h-9 max-md:min-w-9',
  'sm:min-w-0 sm:justify-start sm:gap-1 sm:px-2.5'
);

export const headerNeuChipActiveClass = cn(
  headerNeuChipClass,
  'app-header-neu-chip--active text-[var(--project-card-accent)]'
);

export const headerNeuChipIdleClass = cn(
  headerNeuChipClass,
  'text-[var(--project-card-text-muted)] hover:text-[var(--project-card-text)]'
);

/** Separador vertical no trilho. */
export const headerNeuTrackSeparatorClass =
  'app-header-neu-track-separator mx-0.5 h-5 w-px shrink-0';

/** Pill «Projetos» — mesma base das ações da toolbar. */
export const headerNeuNavPillClass = cn(
  headerNeuToolbarPillBaseClass,
  'app-header-neu-nav-pill'
);
