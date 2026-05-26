import { cn } from '../../utils/cn';

/** Superfícies neumórficas — use em todo o app (reexporta classes CSS globais). */
export const neuSurfaceClass = 'leve-neu-surface';
export const neuSurfaceInsetClass = 'leve-neu-surface-inset';
export const neuPillClass = 'leve-neu-pill';
export const neuPillActiveClass = 'leve-neu-pill leve-neu-pill-active';
export const neuDashedPanelClass = 'neu-dashed-panel';
export const neuTrackClass = 'workspace-stat-neu-track';
export const neuFillClass = 'workspace-stat-neu-fill';
export const neuKnobClass = 'workspace-stat-neu-knob';
export const neuDividerClass = 'border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';
export const neuMutedTextClass = 'text-[var(--leve-header-text-muted)]';
export const neuStrongTextClass = 'text-[var(--leve-header-text)]';

export const neuCardClass = cn(neuSurfaceClass, 'p-4 sm:p-5');
export const neuCardCompactClass = cn(neuSurfaceClass, 'p-3 sm:p-4');
export const neuCardInsetClass = cn(neuSurfaceInsetClass, 'p-3 sm:p-4');
export const neuListPanelClass = cn(neuSurfaceInsetClass, 'divide-y divide-[color-mix(in_srgb,var(--leve-neu-light)_30%,transparent)]');

/** Itens de lista / menu flutuante (ver também `.app-menu-item` em index.css). */
export const neuListItemClass = 'app-menu-item';
export const neuListItemActiveClass = 'app-menu-item-active';
export const neuListPanelMenuClass = 'app-menu-panel';

/** Substitui combinações legadas base-* + border-base-* */
export const neuLegacyPanelClass = neuSurfaceClass;
export const neuLegacyInsetClass = neuSurfaceInsetClass;

/** Chip de filtro ativo (listas, tarefas). */
export const neuFilterChipClass = cn(
  'leve-neu-pill app-element-typography inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--leve-header-text-muted)]'
);

export const neuFilterChipBtnClass =
  'flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:text-[var(--leve-header-accent)]';

export const neuSkeletonShellClass = cn(neuSurfaceClass, 'relative overflow-hidden');
export const neuSkeletonBlockClass =
  'rounded-lg bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]';

/** Substitui tokens brand-surface legados. */
export const neuBrandBorderClass =
  'border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';

export const neuBrandChipClass =
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]';

export const neuBrandChipHoverClass =
  'hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]';

export const neuBrandTextMutedClass = 'text-[var(--leve-header-text-muted)]';
export const neuBrandTextStrongClass = 'text-[var(--leve-header-text)]';

export const neuHoverSubtleClass =
  'hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_10%,var(--leve-neu-bg))]';

export const neuHeaderDividerClass = cn('border-b', neuDividerClass);

export const neuInsetTileClass = cn(
  neuCardInsetClass,
  'rounded-2xl transition-[box-shadow] duration-200 hover:shadow-[var(--leve-neu-hover)]'
);

export const neuBrandChipActiveClass =
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_12%,var(--leve-neu-bg))]';

export const neuChecklistItemCheckedClass = cn(
  'rounded-xl border opacity-75',
  neuBrandBorderClass,
  'bg-[color-mix(in_srgb,var(--leve-neu-bg)_88%,transparent)]'
);

export const neuChecklistItemIdleClass = cn(
  neuSurfaceClass,
  'rounded-xl border transition-all duration-200',
  neuBrandBorderClass,
  'hover:border-primary/30 hover:shadow-[var(--leve-neu-hover)]'
);

export const neuTimelineCardClass = cn(
  neuSurfaceClass,
  'flex flex-col rounded-2xl border p-4 transition-all duration-300'
);

export const neuTimelineCardActiveClass =
  'border-primary/30 shadow-[var(--leve-neu-hover)]';

export const neuTimelineCardIdleClass = cn(neuBrandBorderClass, 'shadow-[var(--leve-neu-raised)]');

export const neuTimelineIconIdleClass =
  'rounded-lg bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))] text-base-content/60';
