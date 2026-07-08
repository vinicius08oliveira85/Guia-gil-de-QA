import { cn } from '../../utils/cn';
import { settingsViewScopeClass, workspaceSurfaceLightClass } from './appPageNeuUi';
import {
  appNeuActionBtnActiveClass,
  appNeuActionBtnClass,
  appNeuActionTrackClass,
} from './workspaceChromeActionUi';
import {
  neuFilterPillClass,
  neuPillActiveClass,
  neuPillClass,
  neuSegmentedTabBadgeActiveClass,
  neuSegmentedTabBadgeIdleClass,
  neuSegmentedTabClass,
  neuSegmentedTrackClass,
} from './neuUi';

/** Shell compartilhado — ProjectCard e NewProjectCard (neumorfismo + skin-color Leve na listagem). */
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

/** Tile compacto de métrica secundária (Exec. / Sucesso) — relevo rebaixado. */
export const projectCardStatTileClass = cn(
  'project-card-neu-chip flex min-w-0 flex-1 flex-col gap-1 px-2.5 py-2'
);

/** Mini-barra de progresso dentro do tile. */
export const projectCardStatTileTrackClass = cn(
  'project-card-neu-track relative h-1.5 w-full overflow-hidden'
);

export const projectCardStatTileFillClass = cn(
  'project-card-neu-fill absolute inset-y-0 left-0 transition-[width] duration-500 ease-out'
);

type HealthTone = 'healthy' | 'attention' | 'critical';

/** Pill de saúde do projeto — verde/âmbar/vermelho sobre o creme neumórfico. */
export const projectCardHealthPillClass = (tone: HealthTone) =>
  cn(
    'project-card-neu-chip inline-flex items-center gap-1.5 px-2.5 py-1',
    'font-sans text-[10px] font-bold uppercase tracking-wide sm:text-[11px]',
    tone === 'healthy' &&
      'text-[color-mix(in_srgb,#16a34a_82%,var(--project-card-text))]',
    tone === 'attention' &&
      'text-[color-mix(in_srgb,#d97706_82%,var(--project-card-text))]',
    tone === 'critical' && 'text-[color-mix(in_srgb,#dc2626_82%,var(--project-card-text))]'
  );

export const projectCardHealthDotClass = (tone: HealthTone) =>
  cn(
    'h-1.5 w-1.5 shrink-0 rounded-full',
    tone === 'healthy' && 'bg-[#16a34a]',
    tone === 'attention' && 'bg-[#d97706]',
    tone === 'critical' && 'bg-[#dc2626]'
  );

/** Painéis laterais — neumorfismo via `--workspace-panel-*` (claro ou escuro conforme o escopo). */
export const workspacePanelShellClass = cn(
  'workspace-panel-neu-shell relative flex flex-col overflow-hidden font-sans',
  'rounded-box'
);

/** Faixa rebaixada das métricas no painel lateral. */
export const workspacePanelMetricTileClass = cn(
  'workspace-panel-neu-metric-tile flex min-h-0 flex-row items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3',
  'rounded-box'
);

/** Título de seção — laranja com sublinhado (como no rodapé Leve). */
export const workspacePanelSectionTitleClass = cn(
  'inline-block font-sans text-[10px] font-extrabold uppercase tracking-wider sm:text-[11px]',
  'text-primary',
  'border-b border-primary pb-1'
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

export const workspaceMetricTileClass = workspacePanelMetricTileClass;

/** Ícone em círculo creme — elevado (neumorfismo). */
export const workspaceMetricIconWrapClass = cn(
  'workspace-panel-neu-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10'
);

/** Link/ação estilo “Saiba mais” (laranja + seta). */
export const workspacePanelLinkClass = cn(
  'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary',
  'border-b border-primary pb-0.5 transition-opacity hover:opacity-80 sm:text-xs'
);

/** Seção RecentActivity — shell claro + cards elevados (LandingPage / Jira x Solus). */
export const recentActivityShellClass = cn(
  workspacePanelShellClass,
  'recent-activity-shell',
  'rounded-box border border-base-300 bg-base-100 p-4 sm:p-5'
);

export const recentActivityHeaderDividerClass =
  'mb-4 flex flex-col gap-3 border-b border-base-300 pb-4 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-5';

export const recentActivityEyebrowClass = cn(
  'font-sans text-[10px] font-bold uppercase tracking-widest text-base-content/72'
);

export const recentActivityTitleClass = cn(
  'mt-0.5 inline-block border-b border-base-300 pb-1',
  'font-sans text-lg font-bold text-base-content sm:text-xl'
);

export const recentActivityStatusBadgeClass = cn(
  'inline-block max-w-full truncate rounded-field px-2 py-0.5',
  'bg-primary font-sans text-[10px] font-bold uppercase tracking-wide text-primary-content'
);

export const recentActivityStatusBadgeNeutralClass = cn(
  'inline-block max-w-full truncate rounded-field px-2 py-0.5',
  'bg-base-300/35 font-sans text-[10px] font-bold uppercase tracking-wide text-base-content'
);

export const recentActivityItemClass = cn(
  workspaceMetricTileClass,
  'recent-activity-item flex gap-3 transition-[box-shadow] duration-200',
  'hover:shadow-[var(--leve-neu-raised)]'
);

export const recentActivityDescriptionClass =
  'mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-base-content/72';

export const recentActivityTimeClass =
  'mt-1.5 block font-sans text-[10px] text-base-content/72';

export const recentActivityIconWrapClass = (type: 'pass' | 'fail' | 'pending' | 'report' | 'warning') =>
  cn(
    'workspace-panel-neu-icon-wrap mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9',
    type === 'fail' && '!bg-[#e54b4f] !text-primary-content'
  );

/** Cabeçalho ProjectView — fundo claro, títulos roxo, destaque laranja. */
export const projectViewHeaderShellClass = cn(
  'leve-neu-surface mb-3 min-w-0 max-w-full font-sans px-3 py-2 sm:mb-4 sm:px-4 sm:py-3'
);

/** Trilho de breadcrumbs — faixa rebaixada. */
export const projectViewHeaderBreadcrumbsClass = cn(
  'leve-neu-surface-inset rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2',
  '[&_button]:rounded-full [&_button]:font-sans [&_button]:font-medium [&_button]:text-base-content/72',
  '[&_button:hover]:text-primary [&_button:hover]:shadow-[var(--leve-neu-raised)]',
  '[&_span[aria-current=page]]:font-sans [&_span[aria-current=page]]:font-bold [&_span[aria-current=page]]:text-base-content',
  '[&_svg]:text-base-content/72'
);

export const projectViewHeaderToolbarClass = cn(
  'workspace-chrome-inset flex shrink-0 items-center rounded-full'
);

export const projectViewHeaderToolbarDividerClass =
  'mx-0.5 h-5 w-px shrink-0 bg-base-300/35';

export const projectViewHeaderTabsDividerClass = 'relative mt-2.5 sm:mt-3';

export const projectViewHeaderTabsNavClass = cn(
  'workspace-chrome-inset no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-full p-1.5'
);

export const projectViewHeaderTabClass = (active: boolean) =>
  active
    ? cn(
        'workspace-chrome-tab-active inline-flex min-h-[2.25rem] shrink-0 snap-start items-center whitespace-nowrap px-3 py-2 sm:min-h-0',
        'font-sans text-sm font-semibold'
      )
    : cn(
        'workspace-chrome-tab-idle inline-flex min-h-[2.25rem] shrink-0 snap-start items-center whitespace-nowrap px-3 py-2 sm:min-h-0',
        'font-sans text-sm font-medium'
      );

export const projectViewHeaderScrollFadeFromClass =
  'pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 rounded-l-full bg-gradient-to-r from-base-100 to-transparent';

export const projectViewHeaderScrollFadeToClass =
  'pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 rounded-r-full bg-gradient-to-l from-base-100 to-transparent';

export const projectViewHeaderScrollHintClass =
  'mt-1 text-center font-sans text-[11px] text-base-content/72 md:hidden';

export const projectViewHeaderBacklogBtnClass = (active: boolean) =>
  cn(
    'workspace-chrome-pill mb-0.5 inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1',
    'font-sans text-xs font-semibold min-h-[40px] sm:min-h-7',
    active && 'workspace-chrome-pill-active'
  );

export const projectViewHeaderBacklogCountClass = (active: boolean) =>
  active
    ? cn(
        'workspace-chrome-count-active inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1.5 py-0',
        'font-sans text-[10px] font-bold tabular-nums leading-none'
      )
    : cn(
        'workspace-chrome-count-idle inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1.5 py-0',
        'font-sans text-[10px] font-bold tabular-nums leading-none'
      );

export const projectViewHeaderSyncBtnClass = cn(
  'leve-neu-pill inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5',
  'font-sans text-xs font-semibold text-primary',
  'shadow-[var(--leve-neu-raised)] transition-[box-shadow,color]',
  'hover:shadow-[var(--leve-neu-hover)] disabled:opacity-50 sm:min-h-0'
);

export const projectViewHeaderDangerBtnClass = cn(
  'workspace-chrome-pill workspace-chrome-pill-danger text-error inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5',
  'font-sans text-xs font-semibold sm:min-h-0'
);

/** Cabeçalho QADashboardHeaderToolbar. */
export const qaDashboardHeaderShellClass = cn('flex flex-col gap-4 font-sans sm:gap-5');

export const qaDashboardHeaderTitleClass = cn(
  'font-sans text-2xl font-bold tracking-tight text-base-content sm:text-[1.65rem]'
);

export const qaDashboardHeaderJiraBadgeClass = cn(
  'workspace-chrome-badge inline-flex shrink-0 items-center px-2.5 py-0.5',
  'font-sans text-xs font-bold'
);

export const qaDashboardHeaderSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-base-content/72'
);

export const qaDashboardHeaderMutedClass =
  'font-sans text-base-content/72';

export const qaDashboardHeaderActionBtnClass = cn(
  'workspace-chrome-pill inline-flex min-h-[44px] items-center gap-2 px-3 py-2',
  'font-sans text-sm font-semibold disabled:opacity-50 sm:min-h-9'
);

export const qaDashboardHeaderFilterChipClass = cn(
  'dashboard-neu-insight-inset inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 font-sans text-xs',
  'text-base-content',
  '[&_button]:text-primary [&_button:hover]:opacity-80'
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
  'font-sans text-sm font-bold shadow-[2px_2px_8px_color-mix(in_oklch,oklch(var(--p))_35%,transparent)] sm:min-h-9',
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
  'text-base-content/72 hover:text-base-content disabled:opacity-50'
);

export const leveViewSecondaryToolbarBtnActiveClass = cn(
  leveViewSecondaryToolbarBtnClass,
  'leve-neu-pill-active text-primary'
);

export const leveViewModeTabsClass = cn(
  'leve-neu-surface-inset inline-flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1.5 rounded-full p-1.5'
);

export const leveViewModeTabActiveClass = cn(
  'inline-flex min-h-[2rem] items-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-xs font-semibold text-primary-content shadow-[0_2px_8px_rgba(252,76,2,0.22)]',
  'bg-primary transition-colors disabled:opacity-50'
);

export const leveViewModeTabIdleClass = cn(
  'inline-flex min-h-[2rem] items-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-xs font-medium text-base-content/72 transition-colors',
  'hover:bg-primary/8 hover:text-base-content',
  'disabled:opacity-50'
);

export const leveViewModeCountActiveClass = cn(
  'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border px-1 py-0',
  'border-[color-mix(in_srgb,white_55%,transparent)]',
  '!bg-base-200',
  'font-sans text-[10px] font-bold tabular-nums leading-none',
  '!text-base-content',
  'shadow-[2px_2px_6px_color-mix(in_srgb,black_28%,oklch(var(--p))),-1px_-1px_4px_color-mix(in_srgb,white_36%,oklch(var(--p)))]'
);

export const leveViewModeCountIdleClass = cn(
  'dashboard-neu-insight-inset inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0 px-1 py-0',
  'font-sans text-[10px] font-bold tabular-nums leading-none text-base-content/72'
);

export const leveViewSearchLabelClass =
  'mb-2 block font-sans text-sm font-medium text-base-content/72';

export const leveViewSearchInputClass = cn(
  'app-input h-11 w-full rounded-full border py-2 pl-10 pr-10 font-sans text-sm sm:h-10',
  'text-base-content placeholder:text-base-content/72',
  'focus-visible:ring-2 focus-visible:ring-primary/28'
);

export const leveViewSearchClearBtnClass = cn(
  'leve-neu-pill absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
  'text-base-content/72 transition-[box-shadow,color]',
  'hover:text-primary'
);

export const leveViewSearchHintClass =
  'mt-1.5 font-sans text-xs text-base-content/72';

/** Modal Exportar Dados — formato e ações. */
export const leveExportModalContentClass = 'space-y-4 p-1 font-sans';

export const leveExportModalInfoClass = 'text-sm text-base-content/72';

export const leveExportModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-base-content';

export const leveExportFormatStripClass = cn(
  'leve-neu-surface-inset grid gap-1 rounded-box p-1.5',
  'grid-cols-2 sm:grid-cols-3'
);

export const leveExportFormatOptionClass = (active: boolean) =>
  cn(
    'min-h-[44px] rounded-full px-3 py-2 text-center font-sans text-sm font-semibold transition-[box-shadow,color] sm:min-h-9',
    active
      ? 'bg-primary text-primary-content shadow-[0_2px_8px_rgba(252,76,2,0.22)]'
      : 'text-base-content/72 hover:bg-primary/8 hover:text-base-content'
  );

export const leveExportModalHintClass = 'text-xs text-base-content/72';

export const leveExportModalSubmitClass = cn(
  leveViewPrimaryBtnClass,
  'inline-flex w-full min-h-[44px] items-center justify-center gap-2 sm:min-h-10'
);

export const leveViewFiltersBarClass = cn(
  'leve-neu-surface-inset flex flex-col gap-3 p-3 font-sans sm:flex-row sm:flex-wrap sm:items-end lg:gap-4'
);

export const leveViewFilterLabelClass =
  'mb-1.5 block font-sans text-xs font-medium text-base-content/72';

export const leveViewFilterSelectClass = cn(
  'app-select select h-10 min-h-0 w-full rounded-full font-sans text-sm text-base-content'
);

export const leveViewManageLinkClass =
  'shrink-0 font-sans text-xs font-semibold text-primary hover:underline';

export const leveViewFilterPillClass = neuFilterPillClass;

export const leveViewInlineCodeClass = cn(
  'rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs text-base-content'
);

/** Tela Configurações — neumorfismo claro (LandingPage / modais). */
export const leveSettingsPageClass = cn(
  settingsViewScopeClass,
  workspaceSurfaceLightClass,
  'app-page flex min-h-screen flex-col font-sans'
);

export const leveSettingsHeaderStickyClass = cn(
  'leve-settings-header-sticky sticky top-0 z-20',
  'border-b border-base-300 bg-base-100'
);

export const leveSettingsTabsNavClass = cn(
  'leve-settings-tabs-track no-scrollbar flex w-full max-w-full flex-wrap gap-0.5 overflow-x-auto sm:flex-nowrap',
  appNeuActionTrackClass
);

export const leveSettingsTabClass = cn(
  'leve-settings-tab shrink-0',
  appNeuActionBtnClass,
  'min-h-[44px] gap-2 rounded-full px-4 py-2 max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:text-xs sm:min-h-9'
);

export const leveSettingsTabActiveClass = cn(
  'leve-settings-tab--active',
  appNeuActionBtnActiveClass,
  'min-h-[44px] gap-2 rounded-full px-4 py-2 max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:text-xs sm:min-h-9'
);

export const leveSettingsContentAreaClass = 'app-page flex-1 overflow-y-auto';

export const leveSettingsPanelClass = cn(
  'leve-settings-panel leve-neu-surface p-3 font-sans sm:p-4'
);

export const leveSettingsSectionRowClass = 'flex items-start justify-between gap-4';

export const leveSettingsSectionMainClass = 'flex min-w-0 flex-1 items-start gap-4';

export const leveSettingsSectionIconWrapClass = cn(
  'leve-settings-section-icon-wrap app-neu-action-icon-wrap',
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-box text-primary',
  '[&_svg]:h-5 [&_svg]:w-5'
);

export const leveSettingsSectionTitleClass =
  'mb-2 font-sans text-xl font-bold text-base-content';

export const leveSettingsSectionSubtitleClass =
  'font-sans text-sm leading-relaxed text-base-content/72';

export const leveSettingsInsetPanelClass = cn(
  'leve-settings-inset-panel leve-neu-surface-inset p-4 sm:p-5'
);

export const leveSettingsCardClass = leveSettingsPanelClass;

export const leveSettingsMutedTextClass =
  'font-sans text-sm leading-relaxed text-base-content/72';

export const leveSettingsMutedTextXsClass =
  'font-sans text-xs leading-relaxed text-base-content/72';

export const leveSettingsStrongTextClass = 'font-semibold text-base-content';

export const leveSettingsListClass = cn(
  'ml-4 list-disc space-y-2 font-sans text-sm text-base-content/72'
);

export const leveSettingsPrimaryBtnFullClass = cn(
  leveViewPrimaryBtnClass,
  'mt-4 w-full justify-center'
);

export const leveSettingsOutlineBtnClass = leveViewOutlineBtnClass;

export const leveSettingsPrefsTabsTrackClass = cn(
  'leve-settings-prefs-tabs-track w-fit max-w-full',
  appNeuActionTrackClass
);

export const leveSettingsSubTabClass = (active: boolean) =>
  cn(
    'leve-settings-subtab shrink-0 whitespace-nowrap',
    active ? appNeuActionBtnActiveClass : appNeuActionBtnClass,
    'min-h-9 gap-2 px-4 py-2 text-sm'
  );

export const leveSettingsInputClass = cn(
  'app-input h-10 w-full px-3 font-sans text-sm text-base-content'
);

export const leveSettingsSelectClass = cn(
  'app-select select h-10 min-h-0 w-full font-sans text-sm text-base-content'
);

export const leveSettingsCheckboxPanelClass = cn(
  'leve-neu-surface-inset flex cursor-pointer items-start gap-3 px-3 py-2.5'
);

export const leveSettingsHeadingSmClass =
  'font-sans text-lg font-semibold text-base-content';

export const leveSettingsToggleTrackClass = cn(
  'peer h-6 w-11 rounded-full bg-base-content/12',
  'after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-base-content/15 after:bg-white after:transition-all after:content-[""]',
  'peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/40'
);

export const leveSettingsLinkClass = cn(
  'leve-settings-link font-medium text-primary underline-offset-2 hover:underline'
);

export const leveSettingsHeadingXsClass =
  'mb-3 font-sans text-sm font-semibold text-base-content';

/** Modal global — identidade Leve (aplicado em `Modal.tsx` para todos os modais). */
export const leveModalPanelBorderClass = 'leve-modal-neu-shell';

export const leveModalTitleClass =
  'font-bold text-base-content [font-family:var(--font-sans)]';

export const leveModalHeaderClass = cn(
  'leve-modal-neu-header border-b text-base-content'
);

export const leveModalBodyClass = cn(
  'bg-[var(--leve-neu-bg)] text-base-content [font-family:var(--font-sans)]',
  'scrollbar-thumb-primary/35',
  'hover:scrollbar-thumb-primary/50'
);

export const leveModalFooterClass = cn(
  'leve-modal-neu-footer border-t',
  '[&_.btn-primary]:rounded-full [&_.btn-primary]:border-0 [&_.btn-primary]:bg-primary',
  '[&_.btn-primary]:font-semibold [&_.btn-primary]:text-primary-content',
  '[&_.btn-primary]:shadow-[0_2px_8px_rgba(252,76,2,0.2)]',
  '[&_button.btn-outline]:rounded-full [&_button.btn-outline]:border-base-content/30',
  '[&_button.btn-outline]:text-base-content [&_button.btn-ghost]:text-base-content/72',
  '[&_button.btn-ghost]:hover:text-primary'
);

export const leveModalCloseButtonClass = cn(
  'leve-modal-neu-close text-base-content/72'
);

export const leveModalOverlayClass = 'neu-overlay';

export const leveModalGrabberClass =
  'bg-base-content/18';

/** Seções internas de modais de tarefa / relatório de testes — tokens DaisyUI `leve`. */
export const leveTaskModalSectionClass = cn(
  'task-modal-section task-details-neu-raised font-sans'
);

export const leveTaskModalSectionAccentClass = cn('task-modal-section-accent font-sans');

/** Área de conteúdo das abas do modal de tarefa. */
export const leveTaskModalPanelShellClass = cn(
  'task-details-neu-inset-deep leve-neu-inset-content rounded-box p-2.5 sm:p-3'
);

export const leveTaskModalInsetClass = cn('task-details-neu-inset leve-neu-inset-content');

export const leveTaskModalFormatOptionIdleClass = cn(
  leveTaskModalSectionClass,
  'p-4 text-left text-base-content/72 transition-all duration-200',
  'hover:border-primary/30 hover:bg-primary/5 hover:text-base-content'
);

/** Abas segmentadas — trilho inset, chip raised, ativo inset. */
export const leveTaskModalTabsStripClass = cn(
  'task-details-neu-track flex w-full flex-wrap gap-1 overflow-visible rounded-selector p-1.5'
);

const leveTaskModalTabBaseClass =
  'task-details-neu-tab inline-flex min-h-[2rem] shrink-0 snap-start items-center gap-1.5 rounded-selector px-2.5 py-1.5 font-sans text-sm font-semibold leading-tight transition-[box-shadow,color,transform]';

export const leveTaskModalTabClass = (active: boolean) =>
  cn(leveTaskModalTabBaseClass, active ? 'task-details-neu-chip--active' : 'task-details-neu-chip');

export const leveTaskModalTabBadgeActiveClass = cn(
  'task-details-neu-tab-count inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0',
  'bg-primary/14 font-sans text-[10px] font-bold tabular-nums leading-none text-primary',
  'task-details-neu-chip--active'
);

export const leveTaskModalTabBadgeIdleClass = cn(
  'task-details-neu-tab-count inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-0',
  'bg-base-300/25 font-sans text-[10px] font-bold tabular-nums leading-none text-base-content/72',
  'task-details-neu-chip'
);

export const leveTaskModalFieldLabelClass = cn(
  'inline-block font-sans text-[10px] font-extrabold uppercase tracking-wider sm:text-[11px]',
  'text-primary border-b border-primary pb-1'
);

export const leveTaskModalSectionHeaderClass = cn(
  'task-details-neu-section-header flex items-center gap-2 border-b p-4 sm:px-5'
);

export const leveTaskModalSectionTitleClass =
  'font-sans text-base font-bold text-base-content';

export const leveTaskModalMutedClass =
  'font-sans text-sm leading-relaxed text-base-content/72';

export const leveTaskModalMutedXsClass =
  'font-sans text-xs leading-relaxed text-base-content/72';

export const leveTaskModalStrongClass = 'font-semibold text-base-content';

export const leveTaskModalNavFooterClass = cn(
  'task-details-neu-nav-footer mt-5 flex items-center justify-between gap-2 rounded-box',
  'border border-base-300/35 bg-base-300/10 p-2.5 sm:p-3',
  'shadow-[var(--leve-neu-inset)]'
);

export const leveTaskModalWatchersBoxClass = cn(
  'task-details-neu-watchers task-details-neu-inset rounded-box p-2.5',
  'border border-primary/18'
);

export const leveTaskModalAvatarClass = cn(
  'task-details-neu-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-selector',
  'font-sans text-sm font-bold text-primary'
);

export const leveTaskModalStatusPillClass = (active: boolean) =>
  cn(
    'task-details-neu-status-pill inline-flex min-h-[2.25rem] items-center justify-center rounded-selector px-3 py-1.5',
    'font-sans text-xs font-semibold transition-[box-shadow,color,transform] sm:min-h-0',
    active ? 'task-details-neu-chip--status-active' : 'task-details-neu-chip'
  );

export const leveTaskModalDescriptionPanelClass = cn(
  'task-details-neu-description leve-neu-inset-content',
  leveTaskModalInsetClass,
  'rounded-field text-sm leading-relaxed text-base-content',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:space-y-1.5 [&_ol]:space-y-1.5'
);

export const leveTaskModalPageTitleClass =
  'font-sans text-xl font-bold text-base-content';

export const leveTaskModalInputClass = cn(
  'app-input h-10 w-full rounded-field px-3 font-sans text-sm text-base-content'
);

export const leveTaskModalTextareaClass = cn(
  leveTaskModalInputClass,
  'min-h-[5rem] font-mono'
);

export const leveTaskModalCollapsibleShellClass = cn(leveTaskModalSectionClass, 'overflow-hidden');

export const leveTaskModalCollapsibleHeaderClass = cn(
  'flex w-full items-center justify-between px-3 py-2 transition-[box-shadow,background-color]',
  'bg-base-300/10 hover:bg-primary/6'
);

/** Blocos internos do roteiro (ação, parâmetros, resultado). */
export const leveTaskModalRoteiroBlockClass = cn(
  leveTaskModalInsetClass,
  'task-details-neu-roteiro-block rounded-box text-xs text-base-content'
);

/** Faixa de alerta contextual (bloqueado / pronto). */
export const leveTaskModalAlertClass = (tone: 'success' | 'warning') =>
  cn(
    'task-details-neu-inset rounded-box px-3 py-2',
    tone === 'success' ? 'border border-success/35' : 'border border-warning/35'
  );

/** Área de upload / drop de anexos. */
export const leveTaskModalDropZoneClass = cn(
  'task-details-neu-inset rounded-box border-2 border-dashed p-4',
  'border-base-300/45 transition-[box-shadow,border-color]',
  'hover:border-primary/35 hover:shadow-[var(--leve-neu-hover)]'
);

/** Badge meta (Jira, menções, complexidade). */
export const leveTaskModalMetaBadgeClass = cn(
  'task-details-neu-chip rounded-selector px-2 py-0.5 font-sans text-xs font-semibold text-primary'
);

/** Toolbar compacta de ações (editar / status em casos de teste). */
export const leveTaskModalActionToolbarClass = cn(
  'task-details-neu-inset inline-flex shrink-0 items-center rounded-selector p-0.5'
);

/** Barra de ações BDD (gerar IA + adicionar manual). */
export const leveTaskModalBddActionBarClass = cn(
  leveTaskModalTabsStripClass,
  'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3'
);

/** Faixa de KPIs / filtros rápidos (casos de teste). */
export const leveTaskModalKpiStripClass = cn(
  leveTaskModalTabsStripClass,
  'flex flex-wrap items-center gap-1.5'
);

/** Barra de busca + ordenação + filtros. */
export const leveTaskModalToolbarStripClass = cn(
  leveTaskModalTabsStripClass,
  'flex flex-wrap items-center gap-2 p-2'
);

/** Trilha de progresso neumórfica. */
export const leveTaskModalProgressShellClass = cn(
  'task-details-neu-inset rounded-selector p-0.5',
  '[&_progress]:h-2 [&_progress]:w-full [&_progress]:rounded-full [&_progress]:border-0',
  '[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full',
  '[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full'
);

/** Chip de ferramenta (seletor em cartões de estratégia). */
export const leveTaskModalToolChipClass = (selected: boolean, compact?: boolean) =>
  cn(
    'test-strategy-neu-tool-chip',
    selected ? 'task-details-neu-chip--active' : 'task-details-neu-chip',
    'inline-flex items-center gap-1.5 font-semibold rounded-selector',
    compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'
  );

export const leveTaskModalStatPillClass = (active: boolean) =>
  cn(
    active ? 'task-details-neu-chip--active' : 'task-details-neu-chip',
    'inline-flex items-center gap-1.5 rounded-selector px-3 py-1.5 text-xs font-semibold'
  );

export const leveTaskModalStatPillActiveClass = leveTaskModalStatPillClass(true);

export const leveTaskModalStatPillIdleClass = leveTaskModalStatPillClass(false);

export const leveTaskModalCategoryBadgeClass = cn(
  'task-details-neu-chip shrink-0 rounded-selector px-2 py-0.5',
  'font-sans text-[10px] font-semibold text-primary'
);

/** Botões — modal / detalhe expandido da tarefa. */
export const leveTaskModalGhostBtnClass = cn(
  'task-details-neu-ghost-btn task-details-neu-chip',
  'inline-flex min-h-[44px] items-center gap-2 rounded-selector px-4 sm:min-h-9',
  'text-base-content/72 hover:text-primary'
);

export const leveTaskModalPrimaryBtnClass = cn(
  'task-details-neu-primary-cta app-btn-primary-inline',
  'inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-selector px-4 py-2',
  'font-sans text-sm font-bold sm:min-h-9',
  'border border-primary/45 bg-primary text-primary-content',
  'transition-[filter,transform,box-shadow] duration-150 hover:brightness-110',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const leveTaskModalSecondaryBtnClass = cn(
  'task-details-neu-chip inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-selector px-3 py-2',
  'font-sans text-sm font-semibold text-base-content',
  'transition-[box-shadow,color] hover:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9'
);

export const leveTaskModalInfoActionBtnClass = cn(leveTaskModalSecondaryBtnClass, 'text-info');

export const leveTaskModalSuccessActionBtnClass = cn(
  leveTaskModalSecondaryBtnClass,
  'text-success'
);

export const leveTaskModalIconBtnClass = cn(
  'task-details-neu-chip inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-selector',
  'text-base-content/72 transition-[box-shadow,color]',
  'hover:text-primary sm:min-h-9 sm:min-w-9'
);

/** Faixa WorkspaceDaisyStats — fundo claro, valores em laranja Leve. */
export const workspaceDaisyStatCardClass = cn(
  'projects-dash-stat-card flex h-full min-h-[5.25rem] flex-col items-stretch justify-between gap-2 font-sans text-left',
  'px-3 py-3 sm:min-h-[5.5rem] sm:px-4 sm:py-3.5'
);

export const workspaceDaisyStatLabelClass = cn(
  'min-w-0 truncate font-sans text-[9px] font-extrabold uppercase tracking-wider text-[var(--workspace-stat-text)] sm:text-[10px]'
);

export const workspaceDaisyStatValueClass = cn(
  'font-sans text-xl font-extrabold tabular-nums leading-none text-[var(--workspace-stat-accent)] sm:text-2xl'
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
  'dashboard-glass-indicator-card flex min-h-[4rem] flex-col items-center justify-center gap-1.5 font-sans text-center',
  'px-3 py-3 sm:min-h-[4.25rem] sm:px-4 sm:py-3.5',
  'max-md:min-h-[3.25rem] max-md:gap-1 max-md:px-2 max-md:py-2'
);

export const glassIndicatorCardActiveClass = 'dashboard-glass-indicator-card--active';

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
  'dashboard-neu-insight-inset inline-flex items-center justify-center rounded-full px-1.5 py-0.5',
  'font-sans text-[10px] font-bold tabular-nums text-[var(--workspace-stat-accent)]'
);

/** Cards compactos da faixa superior (legado / outros usos). */
export const workspaceStatCardClass = cn(
  'projects-dash-stat-card flex min-h-[4rem] flex-col items-center justify-center gap-1 px-2 py-2.5 text-center sm:min-h-[4.25rem] sm:px-3 sm:py-3',
  'max-md:min-h-[3.25rem] max-md:px-1.5 max-md:py-1.5'
);

export const workspaceStatLabelClass =
  'text-[9px] font-bold uppercase tracking-wider text-base-content/72 sm:text-[10px]';

export const workspaceStatValueClass =
  'font-heading text-lg font-bold tabular-nums leading-none sm:text-xl';

/** Cards de insight do dashboard QA (grade 3×3). */
export const dashboardInsightCardClass = cn(
  'dashboard-neu-insight-card relative flex h-full min-h-0 w-full flex-col overflow-hidden p-3.5 sm:p-4'
);

export const dashboardInsightHeaderClass =
  'mb-3 space-y-0.5 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pb-2.5';

export const dashboardInsightTitleClass =
  'font-heading text-sm font-semibold tracking-tight text-base-content';

export const dashboardInsightSubtitleClass =
  'text-[11px] leading-snug text-base-content/72';

/** Cards da grade ProjectDashboard (QADashboard) — superfície clara + laranja Leve. */
export const projectDashboardInsightCardClass = cn(
  'dashboard-neu-insight-card relative flex h-full min-h-0 w-full flex-col overflow-hidden font-sans p-4 sm:p-5'
);

export const projectDashboardInsightHeaderClass = cn(
  'mb-3.5 space-y-1 border-b border-[var(--project-dashboard-insight-border)] pb-3'
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

/** Badge contador — rebaixado + destaque laranja. */
export const projectDashboardInsightCountBadgeClass = cn(
  'dashboard-neu-insight-inset inline-flex items-center justify-center px-2.5 py-1',
  'font-sans text-sm font-bold tabular-nums text-[var(--project-dashboard-insight-accent)] sm:text-base'
);

/** Trecho `code` dentro dos cards de insight. */
export const projectDashboardInsightCodeClass = cn(
  'dashboard-neu-insight-inset rounded px-1 py-0.5 font-mono text-[0.7rem]',
  'text-[var(--project-dashboard-insight-text-muted)]'
);

/** Badge métrica secundária (laranja suave). */
export const projectDashboardInsightMetricBadgeClass = cn(
  'dashboard-neu-insight-inset inline-flex items-center justify-center px-2 py-0.5',
  'font-sans text-[10px] font-bold tabular-nums text-[var(--project-dashboard-insight-accent)] sm:text-[11px]'
);

export const projectDashboardInsightChipClass = 'dashboard-neu-insight-inset';

export const projectDashboardInsightTrackClass = 'dashboard-neu-insight-track';

export const projectDashboardInsightTrackFillClass = 'dashboard-neu-insight-track-fill';

/** KPIs do topo do QADashboard (pastéis por tom). */
/** Card de categoria de documento (Requisitos, Testes, etc.). */
export const documentCategoryCardClass = cn(
  'leve-neu-surface relative overflow-hidden p-3 transition-[box-shadow,border-color] duration-200 sm:p-3.5'
);

export const dashboardKpiCardBaseClass = cn(
  'leve-neu-surface flex items-center gap-3 p-3 transition-[box-shadow,transform] duration-200 sm:gap-3.5 sm:p-3.5'
);
