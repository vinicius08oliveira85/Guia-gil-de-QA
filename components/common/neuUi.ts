import { cn } from '../../utils/cn';

/** Superfícies neumórficas — relevo via classes em index.css (leve-neu-*). */
export const neuSurfaceClass = 'leve-neu-surface';
export const neuSurfaceInsetClass = 'leve-neu-surface-inset';

/** Padding interno padrão em trilhos / blocos rebaixados (evita texto colado na sombra). */
export const neuInsetContentClass = 'leve-neu-inset-content';
export const neuPillClass = 'leve-neu-pill';
export const neuPillActiveClass = 'leve-neu-pill leve-neu-pill-active';
export const neuDashedPanelClass = 'neu-dashed-panel';
export const neuTrackClass = 'workspace-stat-neu-track';
export const neuFillClass = 'workspace-stat-neu-fill';
export const neuKnobClass = 'workspace-stat-neu-knob';
export const neuDividerClass = 'border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';
export const neuMutedTextClass = 'text-[var(--leve-header-text-muted)]';
export const neuStrongTextClass = 'text-[var(--leve-header-text)]';

export const neuCardClass = cn(neuSurfaceClass, 'p-4 sm:p-5', 'max-md:p-3');
export const neuCardCompactClass = cn(neuSurfaceClass, 'p-3 sm:p-4', 'max-md:p-2');
export const neuCardInsetClass = cn(neuSurfaceInsetClass, neuInsetContentClass);
export const neuListPanelClass = cn(neuSurfaceInsetClass, 'divide-y divide-[color-mix(in_srgb,var(--leve-neu-light)_30%,transparent)]');

/** Itens de lista / menu flutuante (ver também `.app-menu-item` em index.css). */
export const neuListItemClass = 'app-menu-item';
export const neuListItemActiveClass = 'app-menu-item-active';
export const neuListPanelMenuClass = 'app-menu-panel';

/** Substitui combinações legadas base-* + border-base-* */
export const neuLegacyPanelClass = neuSurfaceClass;
export const neuLegacyInsetClass = neuSurfaceInsetClass;

/** Substitui `bg-surface border border-surface-border rounded-lg` (painéis legados). */
export const neuLegacySurfacePanelClass = cn(
  neuSurfaceClass,
  'rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] p-3 sm:p-4'
);

/** Substitui `bg-surface border border-surface-border rounded-lg` em itens de lista. */
export const neuLegacyListItemPanelClass = cn(
  neuSurfaceClass,
  'rounded-lg border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] transition-[box-shadow] duration-200'
);

/** Substitui `hover:bg-surface-hover` em linhas de menu legadas. */
export const neuLegacyMenuRowHoverClass =
  'hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_14%,var(--leve-neu-bg))] hover:text-[var(--leve-header-text)]';

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
  'rounded-2xl transition-[box-shadow] duration-200'
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
  'hover:border-primary/30'
);

export const neuTimelineCardClass = cn(
  neuSurfaceClass,
  'flex flex-col rounded-2xl border p-4 transition-all duration-300'
);

export const neuTimelineCardActiveClass = 'border-primary/30';

export const neuTimelineCardIdleClass = neuBrandBorderClass;

export const neuTimelineIconIdleClass =
  'rounded-lg bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))] text-base-content/60';

/** Trilho segmentado — inset; chips raised; ativo inset (padrão ProjectCard / modais). */
export const neuSegmentedTrackClass = cn(
  neuSurfaceInsetClass,
  'flex w-full flex-wrap gap-1.5 overflow-x-auto rounded-full p-1.5'
);

export const neuSegmentedTabBaseClass =
  'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center gap-2 px-3 py-2 font-sans text-xs font-semibold transition-[box-shadow,color] sm:min-h-0 sm:text-sm';

export const neuSegmentedTabClass = (active: boolean) =>
  cn(
    neuSegmentedTabBaseClass,
    active
      ? cn(neuPillActiveClass, 'text-[var(--leve-header-text)]')
      : cn(neuPillClass, 'text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-text)]')
  );

export const neuSegmentedTabBadgeActiveClass = cn(
  'task-details-neu-tab-count inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-[var(--leve-header-text)] leve-neu-pill-active'
);

export const neuSegmentedTabBadgeIdleClass = cn(
  'task-details-neu-tab-count inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-[var(--leve-header-text-muted)] leve-neu-pill'
);

/** Chip de filtro compacto (KPIs, preferências) — raised / ativo inset. */
export const neuFilterPillClass = (active: boolean) =>
  cn(
    'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 font-sans text-xs transition-[box-shadow,color]',
    active
      ? cn(neuPillActiveClass, 'font-semibold text-[var(--leve-header-text)]')
      : cn(
          neuPillClass,
          'font-medium text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-text)]'
        )
  );
