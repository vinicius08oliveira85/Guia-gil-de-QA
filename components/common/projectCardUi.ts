import { cn } from '../../utils/cn';

/** Shell compartilhado — ProjectCard e NewProjectCard. */
export const projectCardShellClass = cn(
  'group relative flex h-full flex-col overflow-hidden rounded-[var(--rounded-box)]',
  'border border-[var(--brand-surface-border)]',
  'bg-[color-mix(in_srgb,var(--brand-surface-strong)_92%,transparent)] backdrop-blur-sm',
  'shadow-[0_1px_0_color-mix(in_srgb,white_50%,transparent),0_10px_28px_-14px_var(--brand-surface-shadow)]',
  'transition-all duration-300 ease-out',
  'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-cta)_38%,transparent)]',
  'hover:shadow-[0_16px_40px_-18px_var(--brand-surface-shadow)]',
  'motion-reduce:transform-none motion-reduce:hover:translate-y-0'
);

/** Faixa superior animada no hover (acento marca). */
export const projectCardAccentBarClass = cn(
  'pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0',
  'bg-gradient-to-r from-[var(--brand-cta)] via-[var(--brand-highlight)] to-[var(--brand-cta)]',
  'transition-transform duration-300 group-hover:scale-x-100'
);

export const projectCardOrbCtaClass =
  'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14]';

export const projectCardOrbHighlightClass =
  'pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.11]';

/** Painel interno das três métricas. */
export const projectCardMetricsPanelClass = cn(
  'grid grid-cols-3 gap-0 overflow-hidden rounded-xl',
  'border border-[var(--brand-surface-border)] bg-[var(--brand-chip)]'
);

export const projectCardMetricCellClass = cn(
  'flex flex-col items-center justify-center gap-0.5 px-1 py-2 sm:py-2.5',
  'border-r border-[var(--brand-surface-border)] last:border-r-0'
);

/** Painéis estáticos da sidebar (alertas, métricas globais). */
export const workspacePanelShellClass = cn(
  'relative flex flex-col overflow-hidden rounded-[var(--rounded-box)]',
  'border border-[var(--brand-surface-border)]',
  'bg-[color-mix(in_srgb,var(--brand-surface-strong)_92%,transparent)] backdrop-blur-sm',
  'shadow-[0_1px_0_color-mix(in_srgb,white_50%,transparent),0_10px_28px_-14px_var(--brand-surface-shadow)]'
);

export const workspacePanelSectionTitleClass = cn(
  'font-heading text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-strong)] sm:text-[11px]'
);

export const workspaceMetricTileClass = cn(
  'flex min-h-0 flex-row items-center gap-2.5 rounded-xl border p-2.5 transition-[border-color,box-shadow] duration-200 sm:gap-3 sm:p-3',
  'hover:shadow-[0_4px_14px_-8px_var(--brand-surface-shadow)]'
);

export const workspaceMetricIconWrapClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10';

/** Cards compactos da faixa superior (Projetos, Sucesso, etc.). */
export const workspaceStatCardClass = cn(
  'flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-[var(--rounded-box)] px-2 py-2.5 text-center sm:min-h-[4.25rem] sm:px-3 sm:py-3',
  'border border-[var(--brand-surface-border)]',
  'bg-[color-mix(in_srgb,var(--brand-surface-strong)_92%,transparent)] backdrop-blur-sm',
  'shadow-[0_1px_0_color-mix(in_srgb,white_50%,transparent),0_8px_22px_-12px_var(--brand-surface-shadow)]',
  'transition-[border-color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)]'
);

export const workspaceStatLabelClass =
  'text-[9px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)] sm:text-[10px]';

export const workspaceStatValueClass =
  'font-heading text-lg font-bold tabular-nums leading-none sm:text-xl';
