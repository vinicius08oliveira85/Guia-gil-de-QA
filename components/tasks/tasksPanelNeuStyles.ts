import { cn } from '../../utils/cn';
import {
  appNeuActionBtnActiveClass,
  appNeuActionBtnClass,
  appNeuActionDividerClass,
  appNeuActionIconWrapClass,
  appNeuActionTrackClass,
} from '../common/workspaceChromeActionUi';

/**
 * Painel de Tarefas (header, abas, busca, toolbar, seções) — dirigido pelos tokens
 * `--workspace-panel-*`, que assumem paleta CLARA sob `workspace-surface-light`
 * (identidade LandingPage / Jira x Solus) e escura sob `workspace-surface-dark`.
 * Fonte única de verdade: nenhuma cor hardcoded aqui.
 */
const neuRaised = 'shadow-[var(--workspace-panel-neu-raised)]';

const neuInset = 'shadow-[var(--workspace-panel-neu-inset)]';

const neuInsetDeep = 'shadow-[var(--workspace-panel-neu-inset-deep)]';

const badgeRaised =
  'shadow-[2px_2px_6px_color-mix(in_srgb,var(--workspace-panel-neu-dark)_45%,transparent),-1px_-1px_4px_var(--workspace-panel-neu-highlight-raised)]';

/* ── Painel / card ───────────────────────────────────────────── */

export const tasksPanelCardClass = cn(
  'project-chrome-neu-shell tasks-panel-dark-surface tasks-panel-neu-card',
  'relative flex flex-col overflow-hidden rounded-box p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const tasksPanelSectionDividerClass = cn(
  'mt-4 border-t border-base-300 pt-3',
  'max-md:mt-2 max-md:pt-2'
);

/** Envelope da lista (toolbar + Favoritos / Outras) — card claro via --workspace-panel-bg. */
export const tasksPanelListShellClass = cn(
  tasksPanelCardClass,
  'tasks-panel-dark-surface p-2.5 sm:p-3.5 max-md:p-1.5'
);

/* ── Header (3 CTAs) ─────────────────────────────────────────── */

export const tasksViewHeaderPrimaryBtnClass = cn(
  appNeuActionBtnActiveClass,
  'min-h-[44px] gap-2 px-4 py-2 max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:py-1.5 max-md:text-xs sm:min-h-9',
  'hover:-translate-y-px'
);

export const tasksViewHeaderSecondaryToolbarClass = cn(
  appNeuActionTrackClass,
  'inline-flex items-stretch gap-0.5',
  'max-md:w-full max-md:flex-wrap max-md:justify-stretch'
);

export const tasksViewHeaderSecondaryToolbarDividerClass = appNeuActionDividerClass;

export const tasksViewHeaderSecondaryBtnClass = cn(
  appNeuActionBtnClass,
  'min-h-[44px] max-md:min-h-9 max-md:gap-1 max-md:px-2.5 max-md:py-1 max-md:text-xs md:min-h-9'
);

export const tasksViewHeaderSecondaryBtnActiveClass = cn(
  appNeuActionBtnActiveClass,
  'min-h-[44px] font-semibold max-md:min-h-9 max-md:gap-1 max-md:px-2.5 max-md:py-1 max-md:text-xs md:min-h-9'
);

export const tasksViewHeaderIconWrapClass = appNeuActionIconWrapClass;

export const tasksViewHeaderIaIconClass = 'h-3.5 w-3.5';

export const tasksViewHeaderFilterIconClass = 'h-3.5 w-3.5';

export const tasksViewHeaderFilterCountClass = cn(
  'workspace-chrome-count-active inline-flex h-4 min-w-[1rem] items-center justify-center px-0.5 sm:hidden',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

export const tasksViewHeaderProgressTrackClass = cn(
  'h-1 w-full overflow-hidden rounded-full bg-base-300/55',
  'shadow-[inset_2px_2px_4px_var(--workspace-panel-neu-dark)]'
);

export const tasksViewHeaderProgressFillClass =
  'h-1 rounded-full bg-primary transition-all duration-500';

/* ── Abas Todas / Backlog ────────────────────────────────────── */

export const tasksPanelModeTabsClass = cn(
  appNeuActionTrackClass,
  'w-fit max-w-full shrink-0 flex-wrap gap-1'
);

export const tasksPanelModeTabActiveClass = cn(
  'workspace-chrome-tab-active inline-flex min-h-[2rem] items-center gap-1.5 px-3 py-1.5',
  'font-sans text-xs font-semibold max-md:min-h-7 max-md:px-2 max-md:py-1',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const tasksPanelModeTabIdleClass = cn(
  'workspace-chrome-tab-idle inline-flex min-h-[2rem] items-center gap-1.5 px-3 py-1.5',
  'font-sans text-xs font-medium max-md:min-h-7 max-md:px-2 max-md:py-1',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const tasksPanelModeCountActiveClass = cn(
  'workspace-chrome-count-active inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1 py-0',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

export const tasksPanelModeCountIdleClass = cn(
  'workspace-chrome-count-idle inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1 py-0',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

/* ── Busca rápida ────────────────────────────────────────────── */

export const tasksPanelSearchLabelClass =
  'mb-2 block font-sans text-sm font-medium text-base-content/72';

export const tasksPanelSearchInputClass = cn(
  'tasks-panel-neu-search-input workspace-chrome-inset h-11 w-full rounded-field border-0 py-2 pl-10 pr-10 font-sans text-sm',
  'max-md:h-10 max-md:pl-9 max-md:pr-9 max-md:text-xs sm:h-10',
  'text-base-content placeholder:text-base-content/72',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
);

export const tasksPanelSearchIconClass =
  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/72 opacity-80';

export const tasksPanelSearchClearBtnClass = cn(
  'workspace-chrome-pill absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center',
  'text-base-content/72 transition-[box-shadow,color]',
  'hover:text-primary'
);

export const tasksPanelSearchHintClass =
  'mt-1.5 font-sans text-xs text-base-content/72 max-md:hidden';

/* ── Chips de filtros ativos (lista de tarefas) ──────────────── */

export const tasksPanelActiveFiltersBarClass = cn(
  'tasks-panel-dark-surface flex flex-wrap items-center gap-2 rounded-box px-2.5 py-2.5 sm:px-3 sm:py-3',
  'border border-base-300 bg-base-300/30',
  neuInset
);

export const tasksPanelActiveFilterChipClass = cn(
  'inline-flex items-center gap-1 rounded-selector border border-base-300 bg-base-100 px-2.5 py-1',
  'font-sans text-xs font-medium text-base-content/72',
  neuRaised
);

export const tasksPanelActiveFilterChipBtnClass = cn(
  'flex h-5 w-5 items-center justify-center rounded-full text-base-content/55',
  'transition-colors hover:text-primary'
);

export const tasksPanelActiveFiltersClearClass = cn(
  'ml-1 inline-flex items-center gap-1 rounded-selector px-2.5 py-1',
  'font-sans text-xs font-semibold text-primary',
  'transition-colors hover:text-base-content hover:underline'
);

export const tasksPanelListCountClass = 'font-sans text-sm text-base-content/72';

/* ── Modais neumórficos (filtros / exportar) — tokens DaisyUI `leve` ─ */

export const tasksPanelNeuModalPanelClass = cn(
  'tasks-panel-neu-modal tasks-panel-dark-surface',
  'border border-base-300 bg-base-200',
  neuRaised,
  'shadow-[var(--modal-neu-shell-shadow,var(--workspace-panel-neu-raised)),0_20px_50px_color-mix(in_oklch,oklch(var(--bc))_14%,transparent)]',
  '[&_.leve-modal-neu-header]:border-base-300',
  '[&_.leve-modal-neu-header]:bg-base-300/25',
  '[&>div.custom-scrollbar]:bg-base-200 [&>div.custom-scrollbar]:text-base-content/72',
  '[&_.leve-modal-neu-close]:border [&_.leve-modal-neu-close]:border-base-300',
  '[&_.leve-modal-neu-close]:bg-base-300/25 [&_.leve-modal-neu-close]:text-base-content/72',
  '[&_.leve-modal-neu-close:hover]:text-primary',
  '[&_.leve-modal-neu-header>div_span]:bg-base-300'
);

/** @deprecated Use `tasksPanelNeuModalPanelClass` */
export const tasksPanelFiltersModalPanelClass = tasksPanelNeuModalPanelClass;

export const tasksPanelNeuModalTitleClass =
  '!text-base-content font-sans font-bold [font-family:var(--font-sans)]';

/** @deprecated Use `tasksPanelNeuModalTitleClass` */
export const tasksPanelFiltersModalTitleClass = tasksPanelNeuModalTitleClass;

export const tasksPanelFiltersModalSectionLabelClass = cn(
  'mb-2 flex items-center gap-1.5 font-sans text-[10px] font-extrabold uppercase tracking-wider text-primary',
  'border-b border-primary/35 pb-1'
);

export const tasksPanelFiltersModalHintClass =
  'mb-2 font-sans text-[11px] text-base-content/55';

export const tasksPanelFiltersModalDividerClass = 'mb-5 border-b border-base-300 pb-5';

export const tasksPanelFiltersModalSaveLinkClass = cn(
  'inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary',
  'transition-colors hover:text-base-content'
);

export const tasksPanelFiltersModalEmptyClass = 'font-sans text-xs italic text-base-content/55';

export const tasksPanelFiltersModalChipClass = (active: boolean) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-selector px-2.5 py-1 font-sans text-xs transition-[box-shadow,color] sm:gap-2 sm:px-3 sm:py-1.5',
    active
      ? cn(
          'border border-primary/35 bg-primary font-semibold text-primary-content',
          badgeRaised
        )
      : cn(
          'border border-base-300 bg-base-300/25 font-medium text-base-content/72',
          neuInset,
          'hover:text-base-content'
        )
  );

export const tasksPanelFiltersModalChipCountClass = (active: boolean) =>
  cn(
    'rounded-full px-1.5 py-0.5 font-sans text-[10px] font-bold tabular-nums leading-none',
    active
      ? 'bg-primary-content text-primary'
      : 'border border-base-300 bg-primary text-primary-content'
  );

export const tasksPanelFiltersModalPresetClass = cn(
  tasksPanelActiveFilterChipClass,
  'group text-xs sm:text-xs'
);

export const tasksPanelFiltersModalPresetNameClass =
  'text-base-content/72 transition-colors hover:text-base-content';

export const tasksPanelFiltersModalPresetDeleteClass =
  'text-base-content/55 opacity-0 transition-[color,opacity] group-hover:opacity-100 hover:text-error';

export const tasksPanelFiltersModalInputClass = cn(
  'h-9 flex-1 rounded-selector border pl-3 font-sans text-xs',
  'border-base-300 bg-base-300/25 text-base-content placeholder:text-base-content/55',
  neuInset,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
);

export const tasksPanelFiltersModalSaveBtnClass = cn(
  tasksViewHeaderPrimaryBtnClass,
  'min-h-9 px-4 text-xs'
);

export const tasksPanelFiltersModalCancelIconBtnClass = cn(
  tasksViewHeaderSecondaryBtnClass,
  'min-h-9 px-2'
);

/* ── Modal Exportar Dados ────────────────────────────────────── */

export const tasksPanelExportModalContentClass = 'space-y-4 p-1 font-sans';

export const tasksPanelExportModalInfoClass = 'font-sans text-sm text-base-content/72';

export const tasksPanelExportModalInfoStrongClass = 'font-semibold text-base-content';

export const tasksPanelExportModalFieldLabelClass = tasksPanelFiltersModalSectionLabelClass;

export const tasksPanelExportFormatStripClass = cn(
  'grid grid-cols-2 gap-1 rounded-box p-1.5 sm:grid-cols-3',
  'border border-base-300 bg-base-300/25',
  neuInset
);

export const tasksPanelExportFormatOptionClass = (active: boolean) =>
  cn(
    'min-h-[44px] rounded-selector px-3 py-2 text-center font-sans text-sm font-semibold transition-[box-shadow,color] sm:min-h-9',
    active
      ? cn(
          'border border-primary/35 bg-primary text-primary-content',
          badgeRaised
        )
      : 'text-base-content/72 hover:text-base-content'
  );

export const tasksPanelExportModalHintClass = 'font-sans text-xs text-base-content/55';

export const tasksPanelExportModalSubmitClass = cn(
  tasksViewHeaderPrimaryBtnClass,
  'inline-flex w-full min-h-[44px] items-center justify-center gap-2 sm:min-h-10'
);

/* ── Formulários em modais (tarefa, regras) ──────────────────── */

export const tasksPanelFormFieldLabelClass =
  'mb-2 block font-sans text-[10px] font-bold uppercase tracking-widest text-base-content/72';

export const tasksPanelFormFieldLabelAccentClass = cn(
  tasksPanelFormFieldLabelClass,
  'flex items-center gap-2 !text-primary'
);

export const tasksPanelFormInputClass = cn(
  'w-full min-h-[44px] rounded-field border px-3 font-sans text-sm',
  'border-base-300 bg-base-300/25 text-base-content placeholder:text-base-content/55',
  neuInset,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
);

export const tasksPanelFormTextareaClass = cn(
  tasksPanelFormInputClass,
  'min-h-[120px] resize-y font-mono'
);

export const tasksPanelFormSelectClass = cn(
  'tasks-panel-neu-select w-full min-h-[44px] font-sans text-sm text-base-content',
  'border-base-300'
);

export const tasksPanelFormMutedClass = 'font-sans text-xs text-base-content/55';

export const tasksPanelFormLinkAccentClass = 'text-primary';

export const tasksPanelFormDividerClass = 'border-t border-base-300';

export const tasksPanelFormListShellClass = cn(
  'max-h-48 overflow-y-auto divide-y rounded-box',
  'border border-base-300 bg-base-300/25',
  neuInset,
  'divide-base-300'
);

export const tasksPanelFormListItemTitleClass = 'font-medium text-base-content';

export const tasksPanelFormListItemMetaClass = 'block text-xs text-base-content/55';

export const tasksPanelFormFooterClass = cn(
  tasksPanelFormDividerClass,
  'flex flex-wrap justify-end gap-2 pt-4'
);

export const tasksPanelFormCancelBtnClass = cn(tasksViewHeaderSecondaryBtnClass, 'min-h-10 px-5');

export const tasksPanelFormSaveBtnClass = cn(tasksViewHeaderPrimaryBtnClass, 'min-h-10 px-6');

/* ── Toolbar (exportar, ordenar, agrupar) ────────────────────── */

export const tasksPanelToolbarShellClass = cn(
  'tasks-panel-toolbar-compact',
  appNeuActionTrackClass,
  'flex flex-wrap items-center justify-end gap-1 rounded-selector border border-base-300/55 bg-base-300/25 px-1 py-0.5 sm:gap-1.5 sm:px-1.5 sm:py-1',
  'w-full'
);

export const tasksPanelToolbarExportBtnClass = cn(
  appNeuActionBtnClass,
  'tasks-panel-toolbar-export-btn min-h-7 gap-1 px-2 py-0.5 text-[11px] font-semibold text-base-content/72 hover:text-primary',
  '[&_svg]:h-3.5 [&_svg]:w-3.5'
);

export const tasksPanelToolbarFieldClass = cn(
  'tasks-panel-toolbar-field inline-flex min-w-0 items-center gap-1'
);

export const tasksPanelToolbarLabelClass = cn(
  'shrink-0 font-sans text-[9px] font-semibold uppercase leading-none tracking-wide text-base-content/72'
);

export const tasksPanelToolbarSelectClass = cn(
  'tasks-panel-neu-select tasks-panel-toolbar-select app-element-typography h-7 min-h-7 w-auto min-w-[4.75rem]',
  'border-0 px-2 text-[11px] text-base-content'
);

/* ── Seções colapsáveis (Favoritos / Outras) ─────────────────── */

export const tasksPanelSectionToggleClass = cn(
  'app-element-typography flex w-full min-w-0 items-center justify-between gap-2',
  'rounded-box px-3 py-2.5 max-md:px-2 max-md:py-1.5',
  'border border-base-300 bg-base-300/25 text-base-content/72',
  neuInset,
  'transition-[box-shadow,color] duration-200',
  'hover:text-base-content',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
  'active:shadow-[var(--workspace-panel-neu-inset)]'
);

export const tasksPanelSectionTitleClass = 'text-primary';

export const tasksPanelSectionCountClass =
  'shrink-0 font-medium normal-case tracking-normal text-base-content/72';

export const tasksPanelSectionChevronClass =
  'h-4 w-4 shrink-0 text-base-content/55 transition-transform duration-200';

/* ── Chrome do ProjectView (breadcrumbs, abas, backlog) ──────── */

export const projectChromeHeaderShellClass = cn(
  'project-chrome-neu-shell',
  'mb-3 min-w-0 max-w-full font-sans px-3 py-2 sm:mb-4 sm:px-4 sm:py-3',
  'max-md:mb-1.5 max-md:px-1.5 max-md:py-1',
  'rounded-box rounded-[var(--project-card-radius)] border border-base-300 bg-base-100'
);

export const projectChromeHeaderInnerClass = 'max-md:gap-0';

export const projectChromeBreadcrumbsClass = cn(
  'project-chrome-breadcrumbs workspace-chrome-inset',
  'rounded-[0.5rem] px-2.5 py-1.5 sm:px-3 sm:py-2',
  'max-md:rounded-[0.5rem] max-md:px-1.5 max-md:py-0.5'
);

export const projectChromeToolbarClass = cn(
  'project-chrome-toolbar-responsive',
  appNeuActionTrackClass,
  'shrink-0 max-md:w-auto max-md:shrink-0'
);

export const projectChromeToolbarDividerClass = cn(
  'mx-0.5 h-5 w-px shrink-0 bg-base-300',
  'max-md:mx-0 max-md:h-4'
);

export const projectChromeToolbarStatusClass = 'text-base-content/72';

export const projectChromeTabsDividerClass = cn(
  'project-chrome-tabs-divider relative mt-2.5 border-t border-base-300 pt-2.5 sm:mt-3 sm:pt-3',
  'max-md:mt-0.5 max-md:border-t-0 max-md:pt-0.5'
);

export const projectChromeTabsNavClass = cn(
  'project-chrome-tabs-nav workspace-chrome-inset no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory p-1.5',
  '[scroll-padding-inline:0.375rem]',
  'max-md:gap-1 max-md:p-1'
);

const projectChromeFixedTabBaseClass = cn(
  'project-chrome-fixed-tab inline-flex shrink-0 snap-start items-center justify-center whitespace-nowrap',
  'min-h-[2rem] px-3 py-1.5',
  'max-md:min-h-7 max-md:px-2.5 max-md:py-1 max-md:text-[11px]',
  'font-sans text-sm leading-none'
);

export const projectChromeTabActiveClass = cn(
  'workspace-chrome-tab-active',
  projectChromeFixedTabBaseClass,
  'font-semibold'
);

export const projectChromeTabIdleClass = cn(
  'workspace-chrome-tab-idle',
  projectChromeFixedTabBaseClass,
  'font-medium'
);

/** Aba dinâmica de tarefa no workspace (estilo console). */
export const projectChromeTaskTabActiveClass = cn(
  projectChromeTabActiveClass,
  'max-w-[min(14rem,42vw)] gap-1.5 pr-1'
);

export const projectChromeTaskTabIdleClass = cn(
  projectChromeTabIdleClass,
  'max-w-[min(14rem,42vw)] gap-1.5 pr-1'
);

export const projectChromeTaskTabDividerClass =
  'mx-1 h-6 w-px shrink-0 self-center bg-base-300 max-md:mx-0.5';

export const projectChromeTaskTabCloseBtnClass = cn(
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
  'text-base-content/72 hover:bg-base-content/8',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
);

export const projectChromeScrollFadeFromClass =
  'pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 rounded-l-full bg-gradient-to-r from-base-100 to-transparent max-md:hidden';

export const projectChromeScrollFadeToClass =
  'pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 rounded-r-full bg-gradient-to-l from-base-100 to-transparent max-md:hidden';

export const projectChromeScrollHintClass = cn(
  'project-chrome-scroll-hint mt-1 text-center font-sans text-[11px] text-base-content/72 md:hidden',
  'max-md:hidden'
);

export const projectChromeTabsRowClass = 'flex w-full items-end gap-2 max-md:items-center max-md:gap-1';

export const projectChromeBacklogBtnClass = (active: boolean) =>
  cn(
    'workspace-chrome-pill mb-0.5 inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 font-sans text-xs font-semibold min-h-[40px] sm:min-h-7',
    'max-md:mb-0 max-md:min-h-7 max-md:gap-0.5 max-md:px-1.5 max-md:py-0.5',
    active && 'workspace-chrome-pill-active'
  );

export const projectChromeBacklogCountClass = (active: boolean) =>
  cn(
    'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1.5 py-0',
    'font-sans text-[10px] font-bold tabular-nums leading-none',
    active ? 'workspace-chrome-count-active' : 'workspace-chrome-count-idle'
  );

export const projectChromeSyncBtnClass = cn(
  'project-chrome-sync-btn',
  appNeuActionBtnClass,
  'max-md:min-h-8 max-md:min-w-8 max-md:justify-center max-md:gap-0 max-md:p-0 sm:min-h-0',
  'text-xs'
);

export const projectChromeDangerBtnClass = cn(
  'workspace-chrome-pill-danger',
  appNeuActionBtnClass,
  'max-md:min-h-8 max-md:min-w-8 max-md:justify-center max-md:gap-0 max-md:p-0 sm:min-h-0',
  'text-xs text-error'
);

export const projectChromeToolbarStatusWrapClass =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs max-md:gap-0 max-md:px-1 max-md:py-0';

/* ── Cabeçalho da aba Tarefas (título + subtítulo) ───────────── */

export const tasksViewPageHeaderShellClass = cn(
  'tasks-view-header-shell view-hero-header-shell',
  'flex flex-col gap-3 font-sans sm:gap-4',
  'max-md:gap-2'
);

export const tasksViewHeaderActionsClass = cn(
  'tasks-view-header-actions-row flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end'
);

/** CTA principal do cabeçalho de Tarefas (largura total no mobile via CSS). */
export const tasksViewHeaderPrimaryCtaClass = 'tasks-view-header-primary-cta';

export const tasksViewPageTitleClass = cn(
  'app-brand-title font-sans text-2xl font-bold tracking-tight text-[var(--brand-text-strong)] sm:text-[1.65rem]',
  'max-md:text-xl'
);

export const tasksViewPageJiraBadgeClass = cn(
  'project-tab-jira-badge tasks-view-jira-badge inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold'
);

export const tasksViewPageSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]',
  'max-md:text-xs max-md:leading-snug'
);

/* ── Backlog (filtros + lista) — tokens DaisyUI `leve` ───────── */

export const backlogToolbarPanelClass = cn(
  'app-element-typography w-full min-w-0 rounded-box px-2 py-1.5 sm:px-2.5',
  'border border-base-300 bg-base-300/25',
  neuInset
);

export const backlogToolbarHelpClass = cn(
  'text-[10px] leading-snug text-base-content/72 sm:text-[11px]',
  '[&_strong]:font-semibold [&_strong]:text-base-content'
);

export const backlogToolbarGridClass = cn(
  'grid w-full grid-cols-2 gap-x-1.5 gap-y-1.5 sm:grid-cols-3 sm:gap-x-2 xl:grid-cols-6 xl:gap-x-1.5 xl:gap-y-1'
);

export const backlogToolbarSelectClass = cn(
  'tasks-panel-neu-select backlog-toolbar-select app-element-typography h-7 w-full min-w-0',
  'text-[11px] font-semibold leading-tight text-base-content',
  'border-base-300'
);

export const backlogToolbarLabelClass = 'text-[10px] font-medium leading-none text-base-content/72';

export const backlogToolbarFieldClass = 'flex min-w-0 w-full flex-col gap-0.5';

export const backlogToolbarFieldHeaderClass = 'flex min-w-0 items-center justify-between gap-1';

export const backlogToolbarClearLinkClass = cn(
  'shrink-0 text-[10px] font-medium leading-none text-base-content/55',
  'underline-offset-2 hover:text-primary hover:underline disabled:opacity-50'
);

export const backlogListSurfaceClass = cn(
  'backlog-list-surface tasks-panel-dark-surface app-element-typography overflow-hidden',
  'rounded-box border border-base-300 bg-base-100',
  neuRaised
);

export const backlogListSurfaceHeaderClass = cn(
  'flex flex-wrap items-center justify-between gap-2 border-0 px-3 py-2 sm:px-4',
  'border-b border-base-300 bg-base-300/25',
  neuInset
);

export const backlogListSurfaceTitleClass =
  'text-xs font-semibold uppercase tracking-wider text-base-content/72';

export const backlogListSurfaceMetaClass = 'text-xs font-medium text-base-content';

export const backlogListSurfaceMetaMutedClass = 'text-base-content/55';

export const backlogListSurfaceBodyClass = cn('min-w-0 bg-base-300/15 p-2 sm:p-4');

export const backlogActiveChipClass = cn(
  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-base-content/72',
  'border border-base-300 bg-base-100',
  neuRaised
);

export const backlogToolbarChipsRowClass = cn(
  'mt-1 flex flex-wrap items-center gap-1 border-t border-base-300 pt-1'
);

export const backlogClearFiltersLinkClass =
  'text-[11px] font-medium text-error hover:underline disabled:opacity-50';

export const backlogChipRemoveBtnClass = cn(
  'flex h-4 w-4 items-center justify-center rounded-full',
  'hover:bg-base-300/40'
);

export const tasksPanelBacklogSprintHeadingClass = (active: boolean) =>
  cn(
    'mb-3 flex flex-wrap items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider',
    active ? 'text-primary' : 'text-base-content/72'
  );

export const tasksPanelBacklogSprintCountClass =
  'font-medium normal-case tracking-normal text-base-content/55';

export const tasksPanelBacklogSprintActiveBadgeClass = cn(
  'rounded-full border border-primary-content/30',
  'bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-content',
  badgeRaised
);

/* ── Barra de filtros compartilhada (Documentos, Regras) — tokens DaisyUI `leve` ─ */

export const tasksPanelFiltersBarClass = cn(
  'tasks-panel-filters-bar tasks-panel-dark-surface flex flex-col gap-3 rounded-box p-3 font-sans sm:flex-row sm:flex-wrap sm:items-end lg:gap-4',
  'border border-base-300 bg-base-300/25',
  'max-md:gap-2 max-md:p-2',
  neuInset
);

export const tasksPanelFilterLabelClass =
  'mb-1.5 block font-sans text-xs font-medium text-base-content/72';

export const tasksPanelFilterSelectClass = cn(
  'tasks-panel-neu-select app-element-typography h-10 min-h-0 w-full font-sans text-sm text-base-content',
  'border-base-300',
  'max-md:h-9 max-md:text-xs'
);

export const tasksPanelFilterManageLinkClass = cn(
  'shrink-0 font-sans text-xs font-semibold text-primary hover:underline'
);

export const tasksPanelFilterPillClass = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1.5 font-sans text-xs transition-[box-shadow,color]',
    active
      ? cn(
          'border border-primary-content/35 bg-primary font-semibold text-primary-content',
          badgeRaised
        )
      : cn(
          'border border-transparent font-medium text-base-content/72',
          'hover:text-base-content'
        )
  );

/* ── Documentos — tokens DaisyUI `leve` ──────────────────────── */

export const documentsPageHeaderClass = tasksViewPageHeaderShellClass;

export const documentsPageTitleClass = tasksViewPageTitleClass;

export const documentsJiraBadgeClass = tasksViewPageJiraBadgeClass;

export const documentsPageSubtitleClass = tasksViewPageSubtitleClass;

export const documentsPageMutedClass = 'font-sans text-base-content/55';

export const documentsFiltersPanelClass = tasksPanelCardClass;

export const documentsEyebrowClass = cn(
  'inline-block border-b border-primary pb-1',
  'font-sans text-[10px] font-extrabold uppercase tracking-wider text-primary sm:text-[11px]'
);

export const documentsSectionShellClass = cn(
  'tasks-panel-dark-surface rounded-box font-sans p-3 sm:p-3.5',
  'border border-base-300 bg-base-100',
  neuRaised
);

export const documentsSectionHeaderDividerClass = 'border-b border-base-300';

export const documentsSectionHeaderClass = cn(documentsSectionHeaderDividerClass, 'pb-2');

export const documentsSectionTitleClass =
  'mt-1 font-sans text-base font-bold text-base-content sm:text-lg';

export const documentsSummaryStripClass = cn(
  'mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-box px-3 py-2.5 sm:px-3.5',
  'border border-base-300 bg-base-300/25',
  neuInset
);

export const documentsSummaryStatsClass =
  'flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-base-content/72';

export const documentsSummaryStatStrongClass = 'text-base-content';

export const documentsSummaryStatIconAccentClass = 'h-4 w-4 text-primary';

export const documentsSummaryStatIconSuccessClass = 'h-4 w-4 text-success';

export const documentsAlertSuccessClass = cn(
  'flex items-start gap-2 rounded-box px-3 py-2',
  'border border-success/35 bg-success/12',
  neuInset
);

export const documentsAlertInfoClass = cn(
  'flex items-start gap-2 rounded-box px-3 py-2',
  'border border-primary/35 bg-primary/10',
  neuInset
);

export const documentsBodyTextClass = 'font-sans text-sm font-medium leading-snug text-base-content';

export const documentsMutedTextClass = 'font-sans text-xs text-base-content/55';

export const documentsStrongTextClass = 'font-semibold text-base-content';

export const documentsProgressTrackClass = cn(
  'relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-base-300/45',
  neuInset
);

export const documentsProgressFillClass = 'h-full w-full rounded-full bg-success';

export const documentsProgressPercentClass =
  'shrink-0 font-sans text-xs font-bold tabular-nums text-base-content/72';

export const documentsPrimaryBtnClass = tasksViewHeaderPrimaryBtnClass;

export const documentsOutlineBtnClass = cn(
  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 font-sans text-sm font-semibold',
  'border border-base-300 bg-base-300/25 text-base-content/72',
  neuInset,
  'hover:text-base-content'
);

export const documentsSpecRemoveBtnClass = cn(
  documentsOutlineBtnClass,
  'text-error hover:border-error/40 hover:text-error'
);

export const documentsSearchInputClass = cn(tasksPanelSearchInputClass, 'min-w-[200px] flex-1');

export const documentsSearchIconClass = tasksPanelSearchIconClass;

export const documentsFilterPillClass = tasksPanelFilterPillClass;

export const documentsFilterRowClass =
  'flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3';

export const documentsFilterPillsStripClass = cn(
  'inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full p-1.5',
  'border border-base-300 bg-base-300/25',
  neuInsetDeep
);

export const documentsFilterPillsGroupClass = cn(documentsFilterPillsStripClass, 'sm:gap-2');

export const documentsCardClass = cn(
  'tasks-panel-dark-surface rounded-box p-3 sm:p-3.5',
  'border border-base-300 bg-base-100',
  neuRaised,
  'transition-[box-shadow] duration-200 hover:brightness-[1.02]'
);

export const documentsCardTitleClass = cn(
  'line-clamp-2 border-b border-base-300 pb-2',
  'font-heading text-sm font-bold leading-snug text-base-content sm:text-base'
);

export const documentsCardMetaClass = 'mt-1.5 text-[11px] leading-relaxed text-base-content/55';

export const documentsCardActionsClass = cn(
  'mt-2.5 flex flex-wrap gap-1.5 border-t border-base-300 pt-2.5'
);

export const documentsActionOutlineClass = cn(
  documentsOutlineBtnClass,
  'min-h-9 gap-1 px-3 py-1.5 text-xs sm:min-h-0 [&_svg]:h-3.5 [&_svg]:w-3.5'
);

export const documentsActionPrimaryClass = cn(
  documentsPrimaryBtnClass,
  'min-h-9 gap-1 px-3 py-1.5 text-xs sm:min-h-0 [&_svg]:h-3.5 [&_svg]:w-3.5'
);

export const documentsActionRemoveClass = cn(
  documentsActionOutlineClass,
  'text-error hover:border-error/40 hover:text-error'
);

export type DocumentCategoryId = 'requisitos' | 'testes' | 'arquitetura' | 'outros';

const documentsCategoryBadgeMap: Record<DocumentCategoryId, string> = {
  requisitos: 'border-base-300 bg-base-content/6 text-base-content',
  testes: 'border-success/35 bg-success/15 text-success',
  arquitetura: 'border-primary/35 bg-primary/12 text-primary',
  outros: 'border-base-300 bg-base-300/25 text-base-content/72',
};

export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'inline-flex rounded-full border border-success/35',
  'bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success'
);

export const documentsModalSectionLabelClass = documentsEyebrowClass;

export const documentsModalMetaClass = 'text-sm text-base-content/55';

export const documentsModalPreClass = 'whitespace-pre-wrap font-mono text-sm text-base-content';

export const documentsModalPreviewInsetClass = cn(
  'max-h-96 overflow-y-auto rounded-box p-4',
  'border border-base-300 bg-base-300/25 text-base-content',
  neuInset
);

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-box',
  'border border-base-300'
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-box',
  'border border-base-300'
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-base-content/72';

export const documentsModalInputClass = cn(
  'app-input w-full rounded-field border border-base-300',
  'bg-base-300/25 text-base-content placeholder:text-base-content/55',
  neuInset
);

export const documentsModalTextareaClass = cn(
  documentsModalInputClass,
  'min-h-[15rem] w-full resize-y font-mono text-sm'
);

export const documentsModalFooterClass = cn(
  'flex justify-end gap-2 border-t border-base-300 pt-4'
);

export const documentsModalFooterCancelClass = cn(documentsOutlineBtnClass, 'min-h-10 px-5');

export const documentsModalFooterSaveClass = cn(documentsPrimaryBtnClass, 'min-h-10 px-6');

export const documentsAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  'rounded-box px-4 py-5 sm:px-6 sm:py-6',
  'border border-base-300 bg-base-300/25 text-base-content',
  neuInset,
  'prose-headings:font-heading prose-headings:text-base-content',
  'prose-p:mb-3 prose-p:leading-relaxed prose-p:text-base-content/72',
  'prose-strong:font-bold prose-strong:text-base-content',
  '[&_a]:text-primary [&_a]:underline-offset-2'
);
