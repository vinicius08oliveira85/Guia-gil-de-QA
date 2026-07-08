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
export const neuMutedTextClass = 'text-base-content/72';
export const neuStrongTextClass = 'text-base-content';

export const neuCardClass = cn(neuSurfaceClass, 'p-4 sm:p-5', 'max-md:p-3');
export const neuCardCompactClass = cn(neuSurfaceClass, 'p-3 sm:p-4', 'max-md:p-2');
export const neuCardInsetClass = cn(neuSurfaceInsetClass, neuInsetContentClass);
export const neuListPanelClass = cn(neuSurfaceInsetClass, 'divide-y divide-[color-mix(in_srgb,var(--leve-neu-light)_30%,transparent)]');

/** Itens de lista / menu flutuante (ver também `.app-menu-item` em index.css). */
export const neuListItemClass = 'app-menu-item';
export const neuListItemActiveClass = 'app-menu-item-active';
export const neuListPanelMenuClass = 'app-menu-panel';

/** Linha elevada em painéis claros (feed, histórico, atividade). */
export const appNeuListRowClass = 'app-neu-list-row';

/** Substitui combinações legadas base-* + border-base-* */
export const neuLegacyPanelClass = neuSurfaceClass;
export const neuLegacyInsetClass = neuSurfaceInsetClass;

/** Substitui `bg-surface border border-surface-border rounded-lg` (painéis legados). */
export const neuLegacySurfacePanelClass = cn(
  neuSurfaceClass,
  'rounded-box border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] p-3 sm:p-4'
);

/** Substitui `bg-surface border border-surface-border rounded-lg` em itens de lista. */
export const neuLegacyListItemPanelClass = cn(
  neuSurfaceClass,
  'rounded-lg border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] transition-[box-shadow] duration-200'
);

/** Substitui `hover:bg-surface-hover` em linhas de menu legadas. */
export const neuLegacyMenuRowHoverClass =
  'hover:bg-base-300/25 hover:text-base-content';

/** Chip de filtro ativo (listas, tarefas). */
export const neuFilterChipClass = cn(
  'leve-neu-pill app-element-typography inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-base-content/72'
);

export const neuFilterChipBtnClass =
  'flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:text-primary';

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

export const neuBrandTextMutedClass = 'text-base-content/72';
export const neuBrandTextStrongClass = 'text-base-content';

export const neuHoverSubtleClass =
  'hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_10%,var(--leve-neu-bg))]';

export const neuHeaderDividerClass = cn('border-b', neuDividerClass);

export const neuInsetTileClass = cn(
  neuCardInsetClass,
  'rounded-2xl transition-[box-shadow] duration-200'
);

export const neuBrandChipActiveClass =
  'bg-primary/12';

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

/** Trilho segmentado — inset claro/escuro conforme `--workspace-panel-*`. */
export const appSegmentedTrackClass = cn(
  'workspace-chrome-inset no-scrollbar flex flex-wrap gap-1 overflow-x-auto rounded-full p-1',
  'max-md:gap-0.5 max-md:p-0.5'
);

export const appSegmentedTabBaseClass =
  'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 font-sans text-sm transition-[box-shadow,color,background-color] duration-200 sm:min-h-0 max-md:min-h-7 max-md:px-2 max-md:py-0.5 max-md:text-[11px]';

/** Aba/botão segmentado — ativo: pill + texto claro; inativo: texto muted sem fundo. */
export function appSegmentedTabClass(active: boolean): string {
  return cn(
    appSegmentedTabBaseClass,
    active
      ? cn('workspace-chrome-tab-active font-semibold')
      : cn('workspace-chrome-tab-idle font-medium')
  );
}

/** Contador em abas segmentadas (backlog, filtros, badges). */
export function appSegmentedTabCountClass(active: boolean): string {
  return cn(
    'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1.5 font-sans text-[10px] font-bold tabular-nums leading-none',
    active ? 'workspace-chrome-count-active' : 'workspace-chrome-count-idle'
  );
}

/** Trilho segmentado — inset; delega para appSegmentedTrackClass. */
export const neuSegmentedTrackClass = cn(appSegmentedTrackClass, 'sm:gap-1.5 sm:p-1.5');

export const neuSegmentedTabBaseClass =
  'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center gap-2 px-3 py-2 font-sans text-xs font-semibold transition-[box-shadow,color] sm:min-h-0 sm:text-sm';

export const neuSegmentedTabClass = (active: boolean) => appSegmentedTabClass(active);

export const neuSegmentedTabBadgeActiveClass = cn(
  'task-details-neu-tab-count inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-base-content leve-neu-pill-active'
);

export const neuSegmentedTabBadgeIdleClass = cn(
  'task-details-neu-tab-count inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-base-content/72 leve-neu-pill'
);

/** Chip de filtro compacto — mesmo padrão das abas do ProjectView. */
export const neuFilterPillClass = (active: boolean) => appSegmentedTabClass(active);
