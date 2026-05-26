import { cn } from '../../utils/cn';

/** Shell compartilhado — ProjectCard e NewProjectCard (neumorfismo + roxo/laranja Leve). */
export const projectCardShellClass = cn(
  'group project-card-neu-shell relative flex h-full flex-col overflow-hidden font-sans',
  'rounded-[var(--project-card-radius)]',
  'bg-[var(--project-card-bg)]',
  'transition-all duration-300 ease-out',
  'hover:-translate-y-0.5 hover:bg-[var(--project-card-bg-hover)]',
  'motion-reduce:transform-none motion-reduce:hover:translate-y-0'
);

/** Destaque sutil no hover — laranja marca (neumorfismo) */
export const projectCardAccentBarClass = cn(
  'pointer-events-none absolute inset-x-4 top-3 h-px origin-left scale-x-0 rounded-full',
  'bg-[color-mix(in_srgb,var(--project-card-accent)_55%,transparent)]',
  'shadow-[0_0_12px_color-mix(in_srgb,var(--project-card-accent)_40%,transparent)]',
  'transition-transform duration-300 group-hover:scale-x-100'
);

export const projectCardOrbCtaClass =
  'pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[var(--project-card-accent)] opacity-[0.06] blur-xl transition-opacity duration-300 group-hover:opacity-[0.1]';

export const projectCardOrbHighlightClass =
  'pointer-events-none absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-[var(--project-card-neu-light)] opacity-[0.35] blur-xl transition-opacity duration-300 group-hover:opacity-[0.5]';

/** Painel interno das métricas — fundo rebaixado */
export const projectCardMetricsPanelClass = 'project-card-neu-metrics';

export const projectCardMetricRowClass = 'space-y-1.5';

export const projectCardMetricTrackClass = 'project-card-neu-track relative h-2 w-full';

export const projectCardMetricFillClass =
  'project-card-neu-fill absolute inset-y-0 left-0 transition-[width] duration-500 ease-out';

export const projectCardMetricKnobClass =
  'project-card-neu-knob pointer-events-none absolute top-1/2 z-[1] h-3 w-3 -translate-y-1/2 rounded-full';

export const projectCardIconWrapClass = cn(
  'project-card-neu-raised flex shrink-0 items-center justify-center',
  'h-10 w-10 sm:h-11 sm:w-11',
  'transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none'
);

export const projectCardChipClass = 'project-card-neu-chip';

/** Painéis laterais — neumorfismo escuro (marrom + creme + laranja Leve). */
export const workspacePanelShellClass = cn(
  'workspace-panel-neu-shell relative flex flex-col overflow-hidden font-sans'
);

/** Título de seção — laranja com sublinhado (como no rodapé Leve). */
export const workspacePanelSectionTitleClass = cn(
  'inline-block font-sans text-[10px] font-extrabold uppercase tracking-wider sm:text-[11px]',
  'text-[var(--workspace-panel-accent)]',
  'border-b border-[var(--workspace-panel-accent)] pb-1'
);

/** Badge contador (abas, alertas). */
export const workspacePanelCountBadgeClass = cn(
  'workspace-panel-neu-value-badge inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1.5',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

/** Badge de filtro / ação. */
export const workspacePanelActionBadgeClass = (active: boolean) =>
  cn(
    'workspace-panel-neu-action-btn px-3 py-1.5',
    active ? 'workspace-panel-neu-action-btn-active' : 'workspace-panel-neu-action-btn-idle'
  );

/** Badge de valor numérico (métricas). */
export const workspacePanelValueBadgeClass = cn(
  'workspace-panel-neu-value-badge inline-flex items-center justify-center px-2 py-0.5',
  'font-sans text-sm font-extrabold tabular-nums sm:text-base'
);

export const workspaceMetricTileClass = cn(
  'workspace-panel-neu-metric-tile flex min-h-0 flex-row items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3'
);

/** Ícone em círculo creme — elevado (neumorfismo). */
export const workspaceMetricIconWrapClass = cn(
  'workspace-panel-neu-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10'
);

/** Link/ação estilo “Saiba mais” (laranja + seta). */
export const workspacePanelLinkClass = cn(
  'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--workspace-panel-accent)]',
  'border-b border-[var(--workspace-panel-accent)] pb-0.5 transition-opacity hover:opacity-80 sm:text-xs'
);

/** Seção RecentActivity (rodapé Leve: marrom + creme + laranja). */
export const recentActivityShellClass = cn(workspacePanelShellClass, 'p-4 sm:p-5');

export const recentActivityEyebrowClass = cn(
  'font-sans text-[10px] font-bold uppercase tracking-widest text-[var(--workspace-panel-text-muted)]'
);

export const recentActivityTitleClass = cn(
  'mt-0.5 inline-block border-b border-[var(--workspace-panel-divider)] pb-1',
  'font-sans text-lg font-bold text-[var(--workspace-panel-text)] sm:text-xl'
);

export const recentActivityHeaderDividerClass =
  'mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--workspace-panel-divider)] pb-3';

export const recentActivityStatusBadgeClass = cn(
  'inline-block max-w-full truncate rounded-[var(--workspace-panel-inner-radius)] px-2 py-0.5',
  'bg-[var(--workspace-panel-badge-bg)] font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--workspace-panel-badge-text)]'
);

export const recentActivityStatusBadgeNeutralClass = cn(
  'inline-block max-w-full truncate rounded-[var(--workspace-panel-inner-radius)] px-2 py-0.5',
  'bg-[var(--workspace-panel-badge-neutral-bg)] font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--workspace-panel-badge-neutral-text)]'
);

export const recentActivityItemClass = cn(
  workspaceMetricTileClass,
  'flex gap-3 hover:shadow-[0_2px_12px_rgba(0,0,0,0.15)]'
);

export const recentActivityDescriptionClass =
  'mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-[var(--workspace-panel-text-muted)]';

export const recentActivityTimeClass =
  'mt-1.5 block font-sans text-[10px] text-[var(--workspace-panel-text-muted)]';

export const recentActivityIconWrapClass = (type: 'pass' | 'fail' | 'pending' | 'report' | 'warning') =>
  cn(
    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9',
    'bg-[var(--workspace-panel-text)] ring-1 ring-[var(--workspace-panel-border)]',
    type === 'fail'
      ? 'text-[var(--workspace-panel-bg)]'
      : 'text-[var(--workspace-panel-accent)]'
  );

/** Cabeçalho ProjectView — fundo claro, títulos roxo, destaque laranja. */
export const projectViewHeaderShellClass = cn(
  'leve-neu-surface mb-3 min-w-0 max-w-full font-sans px-3 py-2 sm:mb-4 sm:px-4 sm:py-3'
);

/** Trilho de breadcrumbs — faixa rebaixada. */
export const projectViewHeaderBreadcrumbsClass = cn(
  'leve-neu-surface-inset rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2',
  '[&_button]:rounded-full [&_button]:font-sans [&_button]:font-medium [&_button]:text-[var(--leve-header-text-muted)]',
  '[&_button:hover]:text-[var(--leve-header-accent)] [&_button:hover]:shadow-[var(--leve-neu-raised)]',
  '[&_span[aria-current=page]]:font-sans [&_span[aria-current=page]]:font-bold [&_span[aria-current=page]]:text-[var(--leve-header-text)]',
  '[&_svg]:text-[var(--leve-header-text-muted)]'
);

export const projectViewHeaderToolbarClass = cn(
  'leve-neu-surface-inset flex shrink-0 items-center rounded-full'
);

export const projectViewHeaderToolbarDividerClass =
  'mx-0.5 h-5 w-px shrink-0 bg-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';

export const projectViewHeaderTabsDividerClass = 'relative mt-2.5 sm:mt-3';

export const projectViewHeaderTabsNavClass = cn(
  'leve-neu-surface-inset no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-full p-1.5'
);

export const projectViewHeaderTabClass = (active: boolean) =>
  active
    ? cn(
        'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center whitespace-nowrap rounded-full px-3 py-2 sm:min-h-0',
        'font-sans text-sm font-semibold text-white shadow-[0_2px_8px_rgba(252,76,2,0.22)]',
        'bg-[var(--leve-header-accent)]'
      )
    : cn(
        'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center whitespace-nowrap rounded-full px-3 py-2 sm:min-h-0',
        'font-sans text-sm font-medium text-[var(--leve-header-text-muted)] transition-colors',
        'hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-bg))] hover:text-[var(--leve-header-text)]'
      );

export const projectViewHeaderScrollFadeFromClass =
  'pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 rounded-l-full bg-gradient-to-r from-[var(--leve-neu-bg)] to-transparent';

export const projectViewHeaderScrollFadeToClass =
  'pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 rounded-r-full bg-gradient-to-l from-[var(--leve-neu-bg)] to-transparent';

export const projectViewHeaderScrollHintClass =
  'mt-1 text-center font-sans text-[11px] text-[var(--leve-header-text-muted)] md:hidden';

export const projectViewHeaderBacklogBtnClass = (active: boolean) =>
  cn(
    'leve-neu-pill mb-0.5 inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1',
    'font-sans text-xs font-semibold transition-all duration-150 min-h-[40px] sm:min-h-7',
    active
      ? 'leve-neu-pill-active text-[var(--leve-header-accent)]'
      : 'text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-accent)]'
  );

export const projectViewHeaderBacklogCountClass = (active: boolean) =>
  active
    ? cn(leveTaskModalTabBadgeActiveClass, 'px-1.5 py-0')
    : cn(leveTaskModalTabBadgeIdleClass, 'px-1.5 py-0');

export const projectViewHeaderSyncBtnClass = cn(
  'leve-neu-pill inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5',
  'font-sans text-xs font-semibold text-[var(--leve-header-accent)]',
  'shadow-[var(--leve-neu-raised)] transition-[box-shadow,color]',
  'hover:shadow-[var(--leve-neu-hover)] disabled:opacity-50 sm:min-h-0'
);

export const projectViewHeaderDangerBtnClass = cn(
  'leve-neu-pill inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5',
  'font-sans text-xs font-semibold text-error',
  'shadow-[var(--leve-neu-raised)] transition-[box-shadow,color]',
  'hover:shadow-[var(--leve-neu-hover)] hover:text-error sm:min-h-0'
);

/** Cabeçalho QADashboardHeaderToolbar. */
export const qaDashboardHeaderShellClass = cn('flex flex-col gap-4 font-sans sm:gap-5');

export const qaDashboardHeaderTitleClass = cn(
  'font-sans text-2xl font-bold tracking-tight text-[var(--leve-header-text)] sm:text-[1.65rem]'
);

export const qaDashboardHeaderJiraBadgeClass = cn(
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_5%,var(--leve-neu-bg))]',
  'font-sans text-xs font-bold text-[var(--leve-header-accent)] shadow-[var(--leve-neu-inset)]'
);

export const qaDashboardHeaderSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-[var(--leve-header-text-muted)]'
);

export const qaDashboardHeaderMutedClass =
  'font-sans text-[var(--leve-header-text-muted)]';

export const qaDashboardHeaderActionBtnClass = cn(
  'leve-neu-pill inline-flex min-h-[44px] items-center gap-2 px-3 py-2',
  'font-sans text-sm font-semibold text-[var(--leve-header-text)]',
  'shadow-[var(--leve-neu-raised)] transition-[box-shadow,color] duration-200',
  'hover:shadow-[var(--leve-neu-hover)] hover:text-[var(--leve-header-accent)] disabled:opacity-50 sm:min-h-9'
);

export const qaDashboardHeaderFilterChipClass = cn(
  'inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1 py-1 font-sans text-xs',
  'border-[var(--leve-header-border)] bg-[var(--leve-header-cream)] text-[var(--leve-header-text)]',
  '[&_button]:text-[var(--leve-header-accent)] [&_button:hover]:opacity-80'
);

/** Painel de abas (Tarefas, Documentos, Regras) — fundo claro Leve. */
export const leveViewPagePanelClass = cn('leve-neu-surface p-3 font-sans sm:p-4');

export const leveViewPageHeaderShellClass = qaDashboardHeaderShellClass;
export const leveViewPageTitleClass = qaDashboardHeaderTitleClass;
export const leveViewPageJiraBadgeClass = qaDashboardHeaderJiraBadgeClass;
export const leveViewPageSubtitleClass = qaDashboardHeaderSubtitleClass;
export const leveViewPageMutedClass = qaDashboardHeaderMutedClass;
export const leveViewPageSectionDividerClass = 'mt-4 pt-3';

export const leveViewPrimaryBtnClass = cn(
  'app-btn-primary-inline inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 py-2',
  'font-sans text-sm font-bold shadow-[2px_2px_8px_color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] sm:min-h-9',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const leveViewOutlineBtnClass = cn(
  qaDashboardHeaderActionBtnClass,
  'rounded-full border-0'
);

export const leveViewSecondaryToolbarClass = cn(
  'leve-neu-surface-inset inline-flex items-stretch gap-0.5 rounded-full p-1'
);

export const leveViewSecondaryToolbarDividerClass =
  'my-1.5 w-px shrink-0 self-stretch bg-[color-mix(in_srgb,var(--leve-neu-dark)_14%,transparent)]';

export const leveViewSecondaryToolbarBtnClass = cn(
  'inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm font-semibold transition-[box-shadow,color] sm:min-h-0',
  'text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-text)] disabled:opacity-50'
);

export const leveViewSecondaryToolbarBtnActiveClass = cn(
  leveViewSecondaryToolbarBtnClass,
  'leve-neu-pill-active text-[var(--leve-header-accent)]'
);

export const leveViewModeTabsClass = cn(
  'leve-neu-surface-inset inline-flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1.5 rounded-full p-1.5'
);

export const leveViewModeTabActiveClass = cn(
  'inline-flex min-h-[2rem] items-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-xs font-semibold text-white shadow-[0_2px_8px_rgba(252,76,2,0.22)]',
  'bg-[var(--leve-header-accent)] transition-colors disabled:opacity-50'
);

export const leveViewModeTabIdleClass = cn(
  'inline-flex min-h-[2rem] items-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-xs font-medium text-[var(--leve-header-text-muted)] transition-colors',
  'hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-bg))] hover:text-[var(--leve-header-text)]',
  'disabled:opacity-50'
);

export const leveViewModeCountActiveClass = cn(
  'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border px-1 py-0',
  'border-[color-mix(in_srgb,white_55%,transparent)]',
  '!bg-[color-mix(in_srgb,var(--leve-header-cream)_82%,white)]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-[var(--leve-header-text)]',
  'shadow-[2px_2px_6px_color-mix(in_srgb,black_28%,var(--leve-header-accent)),-1px_-1px_4px_color-mix(in_srgb,white_36%,var(--leve-header-accent))]'
);

export const leveViewModeCountIdleClass = cn(
  'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0 px-1 py-0',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  'text-[var(--leve-header-text-muted)] shadow-[var(--leve-neu-inset)]'
);

export const leveViewSearchLabelClass =
  'mb-2 block font-sans text-sm font-medium text-[var(--leve-header-text-muted)]';

export const leveViewSearchInputClass = cn(
  'app-input h-11 w-full rounded-full border-0 py-2 pl-10 pr-10 font-sans text-sm shadow-[var(--leve-neu-inset)] sm:h-10',
  'text-[var(--leve-header-text)] placeholder:text-[var(--leve-header-text-muted)]',
  'focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_28%,transparent)]'
);

export const leveViewSearchClearBtnClass = cn(
  'absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
  'border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]',
  'bg-[var(--leve-neu-surface)] text-[var(--leve-header-text-muted)] shadow-[var(--leve-neu-raised)]',
  'transition-[box-shadow,color] hover:text-[var(--leve-header-accent)] hover:shadow-[var(--leve-neu-hover)]'
);

export const leveViewSearchHintClass =
  'mt-1.5 font-sans text-xs text-[var(--leve-header-text-muted)]';

/** Modal Exportar Dados — formato e ações. */
export const leveExportModalContentClass = 'space-y-4 p-1 font-sans';

export const leveExportModalInfoClass = 'text-sm text-[var(--leve-header-text-muted)]';

export const leveExportModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-[var(--leve-header-text)]';

export const leveExportFormatStripClass = cn(
  'leve-neu-surface-inset grid gap-1 rounded-[var(--leve-header-radius)] p-1.5',
  'grid-cols-2 sm:grid-cols-3'
);

export const leveExportFormatOptionClass = (active: boolean) =>
  cn(
    'min-h-[44px] rounded-full px-3 py-2 text-center font-sans text-sm font-semibold transition-[box-shadow,color] sm:min-h-9',
    active
      ? 'bg-[var(--leve-header-accent)] text-white shadow-[0_2px_8px_rgba(252,76,2,0.22)]'
      : 'text-[var(--leve-header-text-muted)] hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-neu-bg))] hover:text-[var(--leve-header-text)]'
  );

export const leveExportModalHintClass = 'text-xs text-[var(--leve-header-text-muted)]';

export const leveExportModalSubmitClass = cn(
  leveViewPrimaryBtnClass,
  'inline-flex w-full min-h-[44px] items-center justify-center gap-2 sm:min-h-10'
);

export const leveViewFiltersBarClass = cn(
  'leve-neu-surface-inset flex flex-col gap-3 p-3 font-sans sm:flex-row sm:flex-wrap sm:items-end lg:gap-4'
);

export const leveViewFilterLabelClass =
  'mb-1.5 block font-sans text-xs font-medium text-[var(--leve-header-text-muted)]';

export const leveViewFilterSelectClass = cn(
  'select h-10 min-h-0 w-full rounded-full border border-[var(--leve-header-border)]',
  'bg-[var(--leve-header-cream)] font-sans text-sm text-[var(--leve-header-text)] shadow-sm'
);

export const leveViewManageLinkClass =
  'shrink-0 font-sans text-xs font-semibold text-[var(--leve-header-accent)] hover:underline';

export const leveViewFilterPillClass = (active: boolean) =>
  cn(
    'px-3 py-1.5 font-sans text-xs transition-[box-shadow,color]',
    active
      ? 'leve-neu-pill leve-neu-pill-active rounded-full border-0 font-semibold text-white !bg-[var(--leve-header-accent)] !shadow-[2px_2px_6px_var(--leve-neu-dark)]'
      : 'leve-neu-pill rounded-full font-medium text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-text)]'
  );

export const leveViewInlineCodeClass = cn(
  'rounded bg-[var(--leve-header-cream)] px-1.5 py-0.5 font-mono text-xs text-[var(--leve-header-text)]'
);

/** Tela Configurações — identidade Leve (todas as abas). */
export const leveSettingsPageClass = 'app-page flex min-h-screen flex-col font-sans';

export const leveSettingsHeaderStickyClass = cn(
  'leve-neu-surface sticky top-0 z-20 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]'
);

export const leveSettingsTabsNavClass = cn(
  'no-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--leve-header-border)] sm:gap-2'
);

export const leveSettingsTabClass = cn(
  'inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-t-[var(--leve-header-radius)] px-4 py-2.5',
  'font-sans text-sm font-semibold transition-colors sm:min-h-0',
  'text-[color-mix(in_srgb,var(--leve-header-text)_70%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--leve-header-text)_6%,var(--leve-header-cream))] hover:text-[var(--leve-header-text)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] focus-visible:ring-offset-2',
  'data-[active=true]:bg-[color-mix(in_srgb,var(--leve-header-text)_12%,var(--leve-header-cream))] data-[active=true]:text-[var(--leve-header-text)]'
);

export const leveSettingsContentAreaClass = 'app-page flex-1 overflow-y-auto';

export const leveSettingsPanelClass = leveViewPagePanelClass;

export const leveSettingsSectionRowClass = 'flex items-start justify-between gap-4';

export const leveSettingsSectionMainClass = 'flex min-w-0 flex-1 items-start gap-4';

export const leveSettingsSectionIconWrapClass = cn(
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--leve-header-radius)]',
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_14%,var(--leve-header-cream))] text-[var(--leve-header-accent)]'
);

export const leveSettingsSectionTitleClass =
  'mb-2 font-sans text-xl font-bold text-[var(--leve-header-text)]';

export const leveSettingsSectionSubtitleClass =
  'font-sans text-sm leading-relaxed text-[var(--leve-header-text-muted)]';

export const leveSettingsInsetPanelClass = cn('leve-neu-surface-inset p-4 sm:p-5');

export const leveSettingsCardClass = leveSettingsPanelClass;

export const leveSettingsMutedTextClass =
  'font-sans text-sm leading-relaxed text-[var(--leve-header-text-muted)]';

export const leveSettingsMutedTextXsClass =
  'font-sans text-xs leading-relaxed text-[var(--leve-header-text-muted)]';

export const leveSettingsStrongTextClass = 'font-semibold text-[var(--leve-header-text)]';

export const leveSettingsListClass = cn(
  'ml-4 list-disc space-y-2 font-sans text-sm text-[var(--leve-header-text-muted)]'
);

export const leveSettingsPrimaryBtnFullClass = cn(
  leveViewPrimaryBtnClass,
  'mt-4 w-full justify-center'
);

export const leveSettingsOutlineBtnClass = leveViewOutlineBtnClass;

export const leveSettingsSubTabClass = (active: boolean) =>
  cn(
    'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-sans text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] focus-visible:ring-offset-2',
    active
      ? 'border-[var(--leve-header-accent)] font-semibold text-[var(--leve-header-text)]'
      : 'border-transparent text-[var(--leve-header-text-muted)] hover:border-[var(--leve-header-border)] hover:text-[var(--leve-header-text)]'
  );

export const leveSettingsInputClass = cn(
  'app-input h-10 w-full px-3 font-sans text-sm text-[var(--leve-header-text)]'
);

export const leveSettingsSelectClass = cn(
  'app-select select h-10 min-h-0 w-full font-sans text-sm text-[var(--leve-header-text)]'
);

export const leveSettingsCheckboxPanelClass = cn(
  'leve-neu-surface-inset flex cursor-pointer items-start gap-3 px-3 py-2.5'
);

export const leveSettingsHeadingSmClass =
  'font-sans text-lg font-semibold text-[var(--leve-header-text)]';

export const leveSettingsToggleTrackClass = cn(
  'peer h-6 w-11 rounded-full bg-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)]',
  'after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[color-mix(in_srgb,var(--leve-header-text)_15%,transparent)] after:bg-white after:transition-all after:content-[""]',
  'peer-checked:bg-[var(--leve-header-accent)] peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-[color-mix(in_srgb,var(--leve-header-accent)_40%,transparent)]'
);

export const leveSettingsLinkClass =
  'font-medium text-[var(--leve-header-accent)] underline-offset-2 hover:underline';

export const leveSettingsHeadingXsClass =
  'mb-3 font-sans text-sm font-semibold text-[var(--leve-header-text)]';

/** Glossário — modal e grade de termos (identidade Leve). */
export const leveGlossaryShellClass = 'font-sans';

export const leveGlossaryToolbarClass = cn(
  leveViewPagePanelClass,
  'mb-4 flex flex-col gap-5 sm:mb-6'
);

export const leveGlossaryCardClass = cn(
  'leve-neu-surface group relative cursor-pointer overflow-hidden p-5',
  'transition-[transform,box-shadow,border-color] duration-200 hover:border-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]'
);

export const leveGlossaryCardTitleClass = cn(
  'flex-1 font-sans text-lg font-semibold text-[var(--leve-header-text)]',
  'transition-colors group-hover:text-[var(--leve-header-accent)]'
);

export const leveGlossaryCardDescClass =
  'mb-3 line-clamp-2 font-sans text-sm leading-relaxed text-[var(--leve-header-text-muted)]';

export const leveGlossaryCardFooterClass =
  'mt-3 flex flex-wrap gap-1.5 border-t border-[var(--leve-header-border)] pt-3';

export const leveGlossaryHashtagClass = cn(
  'font-sans text-xs font-semibold text-[var(--leve-header-accent)]',
  'hover:underline'
);

export const leveGlossaryCategoryBadgeBaseClass = cn(
  'shrink-0 rounded-full border px-2 py-0.5 font-sans text-[10px] font-semibold leading-tight'
);

export const leveGlossaryStatsPanelClass = cn(
  leveViewPagePanelClass,
  'mt-8 p-6 transition-shadow duration-200',
  'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_25%,transparent)]'
);

export const leveGlossaryRelatedTermClass = cn(
  'cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-bg))] px-2.5 py-1',
  'font-sans text-xs font-semibold text-[var(--leve-header-accent)] transition-colors',
  'hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_15%,var(--leve-header-bg))]'
);

/** Modal global — identidade Leve (aplicado em `Modal.tsx` para todos os modais). */
export const leveModalPanelBorderClass = 'leve-modal-neu-shell';

export const leveModalTitleClass =
  'font-bold text-[var(--leve-header-text)] [font-family:var(--font-sans)]';

export const leveModalHeaderClass = cn(
  'leve-modal-neu-header border-b text-[var(--leve-header-text)]'
);

export const leveModalBodyClass = cn(
  'bg-[var(--leve-neu-bg)] text-[var(--leve-header-text)] [font-family:var(--font-sans)]',
  'scrollbar-thumb-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]',
  'hover:scrollbar-thumb-[color-mix(in_srgb,var(--leve-header-accent)_50%,transparent)]'
);

export const leveModalFooterClass = cn(
  'leve-modal-neu-footer border-t',
  '[&_.btn-primary]:rounded-full [&_.btn-primary]:border-0 [&_.btn-primary]:bg-[var(--leve-header-accent)]',
  '[&_.btn-primary]:font-semibold [&_.btn-primary]:text-white',
  '[&_.btn-primary]:shadow-[0_2px_8px_rgba(252,76,2,0.2)]',
  '[&_button.btn-outline]:rounded-full [&_button.btn-outline]:border-[color-mix(in_srgb,var(--leve-header-text)_30%,transparent)]',
  '[&_button.btn-outline]:text-[var(--leve-header-text)] [&_button.btn-ghost]:text-[var(--leve-header-text-muted)]',
  '[&_button.btn-ghost]:hover:text-[var(--leve-header-accent)]'
);

export const leveModalCloseButtonClass = cn(
  'leve-modal-neu-close text-[var(--leve-header-text-muted)]'
);

export const leveModalOverlayClass = 'neu-overlay';

export const leveModalGrabberClass =
  'bg-[color-mix(in_srgb,var(--leve-header-text)_18%,transparent)]';

/** Seções internas de modais de tarefa / relatório de testes. */
export const leveTaskModalSectionClass = cn('leve-neu-surface font-sans');

export const leveTaskModalSectionAccentClass = cn(
  'rounded-[var(--leve-header-radius)] border-2 border-[var(--leve-header-accent)]',
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_6%,var(--leve-header-bg))] font-sans',
  'ring-2 ring-[color-mix(in_srgb,var(--leve-header-accent)_18%,transparent)]',
  'text-[var(--leve-header-text)]'
);

export const leveTaskModalInsetClass = cn('leve-neu-surface-inset px-3 py-3');

export const leveTaskModalFormatOptionIdleClass = cn(
  leveTaskModalSectionClass,
  'p-4 text-left text-[var(--leve-header-text-muted)] transition-all duration-200',
  'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_4%,var(--leve-header-bg))]',
  'hover:text-[var(--leve-header-text)]'
);

/** Modal de detalhe da tarefa (Resumo, BDD, Testes…) — abas e painéis internos. */
export const leveTaskModalTabsStripClass = cn(
  'leve-neu-surface-inset flex w-full flex-wrap gap-1.5 overflow-x-auto p-1.5'
);

export const leveTaskModalTabClass = (active: boolean) =>
  active
    ? cn(
        'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center gap-2 rounded-full px-3 py-2',
        'font-sans text-xs font-semibold text-white shadow-[0_2px_8px_rgba(252,76,2,0.22)] sm:text-sm',
        'bg-[var(--leve-header-accent)]'
      )
    : cn(
        'inline-flex min-h-[2.25rem] shrink-0 snap-start items-center gap-2 rounded-full px-3 py-2',
        'font-sans text-xs font-medium text-[var(--leve-header-text-muted)] transition-colors sm:text-sm',
        'hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-bg))] hover:text-[var(--leve-header-text)]'
      );

/** Contador na aba ativa (laranja) — relevo neumórfico + texto legível. */
export const leveTaskModalTabBadgeActiveClass = cn(
  'min-h-[1.125rem] min-w-[1.125rem] justify-center rounded-full border',
  'border-[color-mix(in_srgb,white_55%,transparent)]',
  '!bg-[color-mix(in_srgb,var(--leve-header-cream)_82%,white)]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-[var(--leve-header-text)]',
  'shadow-[2px_2px_6px_color-mix(in_srgb,black_28%,var(--leve-header-accent)),-1px_-1px_4px_color-mix(in_srgb,white_36%,var(--leve-header-accent))]'
);

export const leveTaskModalTabBadgeIdleClass = cn(
  'min-h-[1.125rem] min-w-[1.125rem] justify-center rounded-full border-0',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  'text-[var(--leve-header-text-muted)] shadow-[var(--leve-neu-inset)]'
);

export const leveTaskModalFieldLabelClass = workspacePanelSectionTitleClass;

export const leveTaskModalSectionHeaderClass = cn(
  'flex items-center gap-2 border-b border-[var(--leve-header-border)] p-4'
);

export const leveTaskModalSectionTitleClass =
  'font-sans text-base font-bold text-[var(--leve-header-text)]';

export const leveTaskModalMutedClass = leveSettingsMutedTextClass;

export const leveTaskModalMutedXsClass = leveSettingsMutedTextXsClass;

export const leveTaskModalStrongClass = leveSettingsStrongTextClass;

export const leveTaskModalNavFooterClass = cn(
  'mt-5 flex items-center justify-between gap-2 border-t border-[var(--leve-header-border)] pt-3'
);

export const leveTaskModalWatchersBoxClass = cn(
  'rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,var(--leve-header-accent)_25%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-bg))] p-2'
);

export const leveTaskModalAvatarClass = cn(
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_14%,var(--leve-header-cream))]',
  'font-sans text-sm font-bold text-[var(--leve-header-accent)]'
);

export const leveTaskModalStatusPillClass = leveViewFilterPillClass;

export const leveTaskModalDescriptionPanelClass = cn(
  leveTaskModalInsetClass,
  'text-sm leading-relaxed text-[var(--leve-header-text)]'
);

export const leveTaskModalPageTitleClass =
  'font-sans text-xl font-bold text-[var(--leve-header-text)]';

export const leveTaskModalInputClass = cn(leveSettingsInputClass, 'w-full');

export const leveTaskModalTextareaClass = cn(
  leveSettingsInputClass,
  'min-h-[5rem] w-full font-mono text-sm'
);

export const leveTaskModalCollapsibleShellClass = cn(leveTaskModalSectionClass, 'overflow-hidden');

export const leveTaskModalCollapsibleHeaderClass = cn(
  'flex w-full items-center justify-between px-3 py-2 transition-colors',
  'bg-[color-mix(in_srgb,var(--leve-header-text)_4%,var(--leve-header-bg))]',
  'hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_6%,var(--leve-header-bg))]'
);

export const leveTaskModalStatPillActiveClass = cn(
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
  'rounded-full border-0 bg-[var(--leve-header-accent)] px-3 py-1.5 font-sans text-xs font-semibold text-white',
  'shadow-[0_2px_8px_rgba(252,76,2,0.18)] transition-all'
);

export const leveTaskModalStatPillIdleClass = cn(
  leveViewFilterPillClass(false),
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap py-1.5 font-medium transition-all',
  'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]'
);

export const leveTaskModalCategoryBadgeClass = cn(
  'shrink-0 rounded-full border border-[color-mix(in_srgb,var(--leve-header-accent)_22%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_10%,var(--leve-header-bg))] px-2 py-0.5',
  'font-sans text-[10px] font-semibold text-[var(--leve-header-accent)]'
);

/** Botões — modal / detalhe expandido da tarefa (neumorfismo Leve). */
export const leveTaskModalGhostBtnClass = cn(
  leveViewOutlineBtnClass,
  'min-h-[44px] rounded-full border-0 shadow-[var(--leve-neu-raised)]',
  'hover:shadow-[var(--leve-neu-hover)] hover:text-[var(--leve-header-accent)] sm:min-h-9'
);

export const leveTaskModalPrimaryBtnClass = cn(
  leveViewPrimaryBtnClass,
  'shadow-[2px_2px_8px_color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]'
);

export const leveTaskModalSecondaryBtnClass = cn(
  'leve-neu-pill inline-flex min-h-[44px] cursor-pointer items-center gap-2 px-3 py-2',
  'font-sans text-sm font-semibold text-[var(--leve-header-text)]',
  'shadow-[var(--leve-neu-raised)] transition-[box-shadow,color]',
  'hover:shadow-[var(--leve-neu-hover)] hover:text-[var(--leve-header-accent)]',
  'disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9'
);

export const leveTaskModalInfoActionBtnClass = cn(
  leveTaskModalSecondaryBtnClass,
  'text-[color-mix(in_srgb,#0284c7_88%,var(--leve-header-text))]'
);

export const leveTaskModalSuccessActionBtnClass = cn(
  leveTaskModalSecondaryBtnClass,
  'text-[color-mix(in_srgb,#16a34a_88%,var(--leve-header-text))]'
);

export const leveTaskModalIconBtnClass = cn(
  'inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full',
  'border border-[color-mix(in_srgb,var(--leve-neu-light)_40%,transparent)]',
  'bg-[var(--leve-neu-surface)] text-[var(--leve-header-text-muted)] shadow-[var(--leve-neu-raised)]',
  'transition-[box-shadow,color] hover:text-[var(--leve-header-accent)] hover:shadow-[var(--leve-neu-hover)]',
  'sm:min-h-9 sm:min-w-9'
);

/** Faixa WorkspaceDaisyStats — fundo claro, valores em laranja Leve. */
export const workspaceDaisyStatCardClass = cn(
  'projects-dash-stat-card flex min-h-[4rem] flex-col items-center justify-center gap-1.5 font-sans text-center',
  'px-3 py-3 sm:min-h-[4.25rem] sm:px-4 sm:py-3.5'
);

export const workspaceDaisyStatLabelClass = cn(
  'font-sans text-[9px] font-extrabold uppercase tracking-wider text-[var(--workspace-stat-text)] sm:text-[10px]'
);

export const workspaceDaisyStatValueClass = cn(
  'font-sans text-xl font-extrabold tabular-nums leading-none text-[var(--workspace-stat-accent)] sm:text-2xl'
);

export const leveGlossaryStatsItemClass = cn(
  workspaceDaisyStatCardClass,
  'text-center transition-transform duration-200 hover:scale-[1.02]'
);

/** Percentual no padrão pt-BR (ex.: 66,2%) — alinhado ao site Leve. */
export function formatWorkspaceStatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
}

/** Inteiro com separador de milhar pt-BR quando aplicável. */
export function formatWorkspaceStatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}

/** Cards GlassIndicatorCards / KPI — relevo neumórfico (Tarefas, dashboard). */
export const glassIndicatorCardClass = cn(
  'flex min-h-[4rem] flex-col items-center justify-center gap-1.5 rounded-[var(--leve-header-radius)] font-sans text-center',
  'border border-[color-mix(in_srgb,var(--leve-neu-light)_38%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_5%,var(--leve-neu-bg))]',
  'px-3 py-3 shadow-[var(--leve-neu-raised)] transition-[box-shadow] duration-200',
  'hover:shadow-[var(--leve-neu-hover)] sm:min-h-[4.25rem] sm:px-4 sm:py-3.5'
);

export const glassIndicatorLabelClass = workspaceDaisyStatLabelClass;

export const glassIndicatorValueClass = workspaceDaisyStatValueClass;

export const glassIndicatorValueMutedClass = cn(
  'font-sans text-xl font-extrabold tabular-nums leading-none text-[var(--workspace-stat-text)] opacity-45 sm:text-2xl'
);

export const glassIndicatorModifierClass =
  'font-sans text-[10px] font-medium leading-tight text-[var(--workspace-stat-text)] opacity-65 sm:text-[11px]';

export const glassIndicatorIconClass =
  'h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4';

export const glassIndicatorIconMutedClass =
  'h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-text)] opacity-45 sm:h-4 sm:w-4';

/** Badge percentual / tendência (laranja). */
export const glassIndicatorBadgeClass = cn(
  'inline-flex items-center justify-center rounded-full px-1.5 py-0.5',
  'border border-[color-mix(in_srgb,var(--leve-neu-light)_30%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_6%,var(--leve-neu-bg))]',
  'font-sans text-[10px] font-bold tabular-nums text-[var(--leve-header-accent)]',
  'shadow-[var(--leve-neu-inset)]'
);

/** Cards compactos da faixa superior (legado / outros usos). */
export const workspaceStatCardClass = cn(
  'projects-dash-stat-card flex min-h-[4rem] flex-col items-center justify-center gap-1 px-2 py-2.5 text-center sm:min-h-[4.25rem] sm:px-3 sm:py-3'
);

export const workspaceStatLabelClass =
  'text-[9px] font-bold uppercase tracking-wider text-[var(--leve-header-text-muted)] sm:text-[10px]';

export const workspaceStatValueClass =
  'font-heading text-lg font-bold tabular-nums leading-none sm:text-xl';

/** Cards de insight do dashboard QA (grade 3×3). */
export const dashboardInsightCardClass = cn(
  'dashboard-neu-insight-card relative flex h-full min-h-0 w-full flex-col overflow-hidden p-3.5 sm:p-4'
);

export const dashboardInsightHeaderClass =
  'mb-3 space-y-0.5 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pb-2.5';

export const dashboardInsightTitleClass =
  'font-heading text-sm font-semibold tracking-tight text-[var(--leve-header-text)]';

export const dashboardInsightSubtitleClass =
  'text-[11px] leading-snug text-[var(--leve-header-text-muted)]';

/** Cards da grade ProjectDashboard (QADashboard) — identidade Leve creme + roxo + laranja. */
export const projectDashboardInsightCardClass = cn(
  'dashboard-neu-insight-card relative flex h-full min-h-0 w-full flex-col overflow-hidden font-sans p-3.5 sm:p-4'
);

export const projectDashboardInsightHeaderClass = cn(
  'mb-3 space-y-1 border-b border-[var(--project-dashboard-insight-border)] pb-2.5'
);

export const projectDashboardInsightTitleClass = cn(
  'font-sans text-sm font-bold leading-tight tracking-tight text-[var(--project-dashboard-insight-title)] sm:text-[15px]'
);

export const projectDashboardInsightSubtitleClass = cn(
  'font-sans text-[11px] leading-snug text-[var(--project-dashboard-insight-text-muted)]'
);

export const projectDashboardInsightMutedClass =
  'font-sans text-[var(--project-dashboard-insight-text-muted)]';

export const projectDashboardInsightTextClass =
  'font-sans font-semibold text-[var(--project-dashboard-insight-text)]';

export const projectDashboardInsightAccentClass = cn(
  'font-sans font-bold tabular-nums text-[var(--project-dashboard-insight-accent)]'
);

/** Badge contador (roxo + texto creme — referência depoimentos Leve). */
export const projectDashboardInsightCountBadgeClass = cn(
  'inline-flex items-center justify-center rounded-[var(--project-dashboard-insight-inner-radius)] px-2.5 py-1',
  'bg-[var(--project-dashboard-insight-badge-bg)] font-sans text-sm font-bold tabular-nums text-[var(--project-dashboard-insight-badge-text)] sm:text-base'
);

/** Badge métrica secundária (laranja suave). */
export const projectDashboardInsightMetricBadgeClass = cn(
  'inline-flex items-center justify-center rounded-[var(--project-dashboard-insight-inner-radius)] px-2 py-0.5',
  'bg-[color-mix(in_srgb,var(--project-dashboard-insight-accent)_12%,transparent)]',
  'font-sans text-[10px] font-bold tabular-nums text-[var(--project-dashboard-insight-accent)] sm:text-[11px]'
);

export const projectDashboardInsightChipClass = cn(
  'rounded-[var(--project-dashboard-insight-inner-radius)] border border-[var(--project-dashboard-insight-border)]',
  'bg-[var(--project-dashboard-insight-chip)]'
);

/** KPIs do topo do QADashboard (pastéis por tom). */
/** Card de categoria de documento (Requisitos, Testes, etc.). */
export const documentCategoryCardClass = cn(
  'leve-neu-surface relative overflow-hidden p-3 transition-[box-shadow,border-color] duration-200 sm:p-3.5'
);

export const dashboardKpiCardBaseClass = cn(
  'leve-neu-surface flex items-center gap-3 p-3 transition-[box-shadow,transform] duration-200 sm:gap-3.5 sm:p-3.5'
);
