import { cn } from '../../utils/cn';

/** Trilho inset (faixa clara) — Configurações, glossário, tema, Jira/Salvar. */
export const headerNeuTrackClass = cn(
  'app-header-neu-track leve-neu-surface-inset',
  'flex flex-wrap items-center gap-1.5 overflow-visible rounded-full p-0.5',
  'transition-[background-color,border-color,box-shadow] duration-300 ease-out'
);

/** Chip elevado dentro do trilho cream. */
export const headerNeuChipClass = cn(
  'app-header-neu-chip',
  'relative z-[1] flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center',
  'overflow-visible rounded-full border border-transparent px-2 text-xs font-semibold outline-none',
  'transition-[background-color,box-shadow,color] duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'sm:min-w-0 sm:justify-start sm:gap-1 sm:px-2.5'
);

export const headerNeuChipActiveClass = cn(
  headerNeuChipClass,
  'app-header-neu-chip--active text-[var(--project-card-accent)]'
);

export const headerNeuChipIdleClass = cn(
  headerNeuChipClass,
  'text-[#6B5E5E] hover:text-[#401C31]'
);

/** Separador vertical no trilho. */
export const headerNeuTrackSeparatorClass =
  'app-header-neu-track-separator mx-0.5 h-5 w-px shrink-0';

/** Pill «Projetos» sobre o fundo roxo do header. */
export const headerNeuNavPillClass = cn(
  'app-header-neu-nav-pill app-element-typography',
  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5',
  'text-xs font-semibold transition-[box-shadow,color,background-color,border-color] duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]'
);
