import { cn } from '../../utils/cn';

/**
 * Modelo Filtrar/Exportar — trilho inset + pills elevados + ícone laranja (#E65100).
 * Estilos globais em `styles/app-global-dark-neu.css`.
 */

/** Trilho rebaixado (agrupa botões). */
export const appNeuActionTrackClass = cn(
  'workspace-chrome-inset app-neu-action-track',
  'inline-flex items-stretch gap-0.5 rounded-full p-0.5'
);

export const appNeuActionTrackWrapClass = cn(
  appNeuActionTrackClass,
  'flex-wrap items-center'
);

export const appNeuActionDividerClass = cn(
  'app-neu-action-divider my-1.5 w-px shrink-0 self-stretch',
  'bg-base-300/80'
);

/**
 * Botão elevado no trilho. A cor do texto segue o token da superfície
 * (`.workspace-chrome-pill`), garantindo contraste em telas claras e escuras.
 */
export const appNeuActionBtnClass = cn(
  'workspace-chrome-pill app-neu-action-btn',
  'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-sm font-semibold',
  'transition-[box-shadow,color,border-color] duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

/** Botão ativo / primário (laranja) — texto de contraste via `primary-content`. */
export const appNeuActionBtnActiveClass = cn(
  'workspace-chrome-pill-active app-neu-action-btn--active',
  'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-sm font-bold',
  'transition-[filter,transform,box-shadow] duration-150',
  'hover:brightness-110',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

/** Círculo do ícone com borda e glow laranja. */
export const appNeuActionIconWrapClass = cn(
  'app-neu-action-icon-wrap dashboard-neu-filter-icon-wrap',
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary'
);

export const appNeuActionIconClass = 'h-3.5 w-3.5 shrink-0';

/** Destrutivo (Excluir) — pill elevado + glow vermelho suave. */
export const appNeuActionBtnDangerClass = cn(
  appNeuActionBtnClass,
  'app-neu-action-btn--danger',
  'text-error hover:text-error',
  'focus-visible:ring-[color-mix(in_srgb,oklch(var(--er))_35%,transparent)]'
);
