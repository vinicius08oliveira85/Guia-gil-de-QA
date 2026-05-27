import { cn } from '../../utils/cn';

/**
 * Paleta escura neumórfica — painel de Tarefas (header, abas, busca, toolbar, seções).
 * #4a423e card · #423b37 rebaixado · #d85414 laranja · #fdf6e3 círculo
 * #dcdcdc labels · #ffffff badge · #777777 trilha
 */
const neuRaised =
  'shadow-[6px_6px_14px_color-mix(in_srgb,#423b37_55%,transparent),-4px_-4px_10px_color-mix(in_srgb,#fdf6e3_12%,#4a423e)]';

const neuInset =
  'shadow-[inset_4px_4px_10px_color-mix(in_srgb,#423b37_70%,transparent),inset_-3px_-3px_8px_color-mix(in_srgb,#fdf6e3_10%,#4a423e)]';

const neuInsetDeep =
  'shadow-[inset_5px_5px_12px_color-mix(in_srgb,#423b37_75%,transparent),inset_-4px_-4px_10px_color-mix(in_srgb,#fdf6e3_8%,#4a423e)]';

const badgeRaised =
  'shadow-[2px_2px_6px_color-mix(in_srgb,#423b37_55%,transparent),-1px_-1px_4px_color-mix(in_srgb,#fdf6e3_14%,#4a423e)]';

/* ── Painel / card ───────────────────────────────────────────── */

export const tasksPanelCardClass = cn(
  'project-chrome-neu-shell tasks-panel-dark-surface tasks-panel-neu-card',
  'relative flex flex-col overflow-hidden rounded-[var(--leve-header-radius)] p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const tasksPanelSectionDividerClass = cn(
  'mt-4 border-t border-[var(--workspace-panel-divider)] pt-3',
  'max-md:mt-2 max-md:pt-2'
);

/** Envelope da lista (toolbar + Favoritos / Outras) — card #4a423e. */
export const tasksPanelListShellClass = cn(
  tasksPanelCardClass,
  'tasks-panel-dark-surface p-2.5 sm:p-3.5 max-md:p-1.5'
);

/* ── Header (3 CTAs) ─────────────────────────────────────────── */

export const tasksViewHeaderPrimaryBtnClass = cn(
  'workspace-chrome-pill-active inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 py-2',
  'font-sans text-sm font-bold max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:py-1.5 max-md:text-xs sm:min-h-9',
  'transition-[filter,transform,box-shadow] duration-150',
  'hover:brightness-110 hover:-translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_45%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const tasksViewHeaderSecondaryToolbarClass = cn(
  'workspace-chrome-inset inline-flex items-stretch gap-0.5 p-0.5',
  'max-md:w-full max-md:flex-wrap max-md:justify-stretch'
);

export const tasksViewHeaderSecondaryToolbarDividerClass =
  'my-1.5 w-px shrink-0 self-stretch bg-[var(--workspace-panel-divider)]';

export const tasksViewHeaderSecondaryBtnClass = cn(
  'workspace-chrome-pill inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm font-semibold',
  'max-md:min-h-9 max-md:gap-1 max-md:px-2.5 max-md:py-1 max-md:text-xs md:min-h-9',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const tasksViewHeaderSecondaryBtnActiveClass = cn(
  'workspace-chrome-pill-active inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm font-semibold',
  'max-md:min-h-9 max-md:gap-1 max-md:px-2.5 max-md:py-1 max-md:text-xs md:min-h-9',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const tasksViewHeaderIconWrapClass = cn(
  'workspace-chrome-badge flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--workspace-panel-accent)]'
);

export const tasksViewHeaderIaIconClass = 'h-3.5 w-3.5';

export const tasksViewHeaderFilterIconClass = 'h-3.5 w-3.5';

export const tasksViewHeaderFilterCountClass = cn(
  'workspace-chrome-count-active inline-flex h-4 min-w-[1rem] items-center justify-center px-0.5 sm:hidden',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

export const tasksViewHeaderProgressTrackClass = cn(
  'h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--workspace-panel-neu-dark)_55%,var(--workspace-panel-bg))]',
  'shadow-[inset_2px_2px_4px_var(--workspace-panel-neu-dark)]'
);

export const tasksViewHeaderProgressFillClass =
  'h-1 rounded-full bg-[var(--workspace-panel-accent)] transition-all duration-500';

/* ── Abas Todas / Backlog ────────────────────────────────────── */

export const tasksPanelModeTabsClass = cn(
  'workspace-chrome-inset inline-flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1 p-1'
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
  'mb-2 block font-sans text-sm font-medium text-[var(--workspace-panel-text-muted)]';

export const tasksPanelSearchInputClass = cn(
  'tasks-panel-neu-search-input workspace-chrome-inset h-11 w-full border-0 py-2 pl-10 pr-10 font-sans text-sm',
  'max-md:h-10 max-md:pl-9 max-md:pr-9 max-md:text-xs sm:h-10',
  'text-[var(--workspace-panel-text)] placeholder:text-[var(--workspace-panel-text-muted)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_40%,transparent)]'
);

export const tasksPanelSearchIconClass =
  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--workspace-panel-text-muted)] opacity-80';

export const tasksPanelSearchClearBtnClass = cn(
  'workspace-chrome-pill absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center',
  'text-[var(--workspace-panel-text-muted)] transition-[box-shadow,color]',
  'hover:text-[var(--workspace-panel-accent)]'
);

export const tasksPanelSearchHintClass =
  'mt-1.5 font-sans text-xs text-[var(--workspace-panel-text-muted)]';

/* ── Chips de filtros ativos (lista de tarefas) ──────────────── */

export const tasksPanelActiveFiltersBarClass = cn(
  'tasks-panel-dark-surface flex flex-wrap items-center gap-2 rounded-[var(--leve-header-radius)] px-2.5 py-2.5 sm:px-3 sm:py-3',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37]',
  neuInset
);

export const tasksPanelActiveFilterChipClass = cn(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
  'border border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
  'bg-[#4a423e] font-sans text-xs font-medium text-[#dcdcdc]',
  neuRaised
);

export const tasksPanelActiveFilterChipBtnClass = cn(
  'flex h-5 w-5 items-center justify-center rounded-full text-[#777777]',
  'transition-colors hover:text-[#d85414]'
);

export const tasksPanelActiveFiltersClearClass = cn(
  'ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1',
  'font-sans text-xs font-semibold text-[#d85414]',
  'transition-colors hover:text-[#fdf6e3] hover:underline'
);

export const tasksPanelListCountClass = 'font-sans text-sm text-[#dcdcdc]';

/* ── Modais neumórficos escuros (compartilhado) ───────────────── */

export const tasksPanelNeuModalPanelClass = cn(
  'tasks-panel-neu-modal tasks-panel-dark-surface',
  'border border-[color-mix(in_srgb,#fdf6e3_14%,transparent)] bg-[#4a423e]',
  neuRaised,
  'shadow-[6px_6px_14px_color-mix(in_srgb,#423b37_55%,transparent),-4px_-4px_10px_color-mix(in_srgb,#fdf6e3_12%,#4a423e),0_20px_50px_color-mix(in_srgb,#000_35%,transparent)]',
  '[&_.leve-modal-neu-header]:border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
  '[&_.leve-modal-neu-header]:bg-[#423b37]',
  '[&>div.custom-scrollbar]:bg-[#4a423e] [&>div.custom-scrollbar]:text-[#dcdcdc]',
  '[&_.leve-modal-neu-close]:border [&_.leve-modal-neu-close]:border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
  '[&_.leve-modal-neu-close]:bg-[#423b37] [&_.leve-modal-neu-close]:text-[#dcdcdc]',
  '[&_.leve-modal-neu-close:hover]:text-[#d85414]',
  '[&_.leve-modal-neu-header>div_span]:bg-[color-mix(in_srgb,#fdf6e3_22%,transparent)]'
);

/** @deprecated Use `tasksPanelNeuModalPanelClass` */
export const tasksPanelFiltersModalPanelClass = tasksPanelNeuModalPanelClass;

export const tasksPanelNeuModalTitleClass =
  '!text-[#fdf6e3] font-sans font-bold [font-family:var(--font-sans)]';

/** @deprecated Use `tasksPanelNeuModalTitleClass` */
export const tasksPanelFiltersModalTitleClass = tasksPanelNeuModalTitleClass;

export const tasksPanelFiltersModalSectionLabelClass = cn(
  'mb-2 flex items-center gap-1.5 font-sans text-[10px] font-extrabold uppercase tracking-wider text-[#d85414]',
  'border-b border-[color-mix(in_srgb,#d85414_35%,transparent)] pb-1'
);

export const tasksPanelFiltersModalHintClass = 'mb-2 font-sans text-[11px] text-[#777777]';

export const tasksPanelFiltersModalDividerClass =
  'mb-5 border-b border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] pb-5';

export const tasksPanelFiltersModalSaveLinkClass = cn(
  'inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#d85414]',
  'transition-colors hover:text-[#fdf6e3]'
);

export const tasksPanelFiltersModalEmptyClass =
  'font-sans text-xs italic text-[#777777]';

export const tasksPanelFiltersModalChipClass = (active: boolean) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs transition-[box-shadow,color] sm:gap-2 sm:px-3 sm:py-1.5',
    active
      ? cn(
          'border border-[color-mix(in_srgb,#ffffff_35%,transparent)]',
          'bg-[#d85414] font-semibold text-[#ffffff]',
          badgeRaised
        )
      : cn(
          'border border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
          'bg-[#423b37] font-medium text-[#dcdcdc]',
          neuInset,
          'hover:text-[#fdf6e3]'
        )
  );

export const tasksPanelFiltersModalChipCountClass = (active: boolean) =>
  cn(
    'rounded-full px-1.5 py-0.5 font-sans text-[10px] font-bold tabular-nums leading-none',
    active
      ? 'bg-[#ffffff] text-[#d85414]'
      : 'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)] bg-[#d85414] text-[#ffffff]'
  );

export const tasksPanelFiltersModalPresetClass = cn(
  tasksPanelActiveFilterChipClass,
  'group text-xs sm:text-xs'
);

export const tasksPanelFiltersModalPresetNameClass =
  'text-[#dcdcdc] transition-colors hover:text-[#fdf6e3]';

export const tasksPanelFiltersModalPresetDeleteClass =
  'text-[#777777] opacity-0 transition-[color,opacity] group-hover:opacity-100 hover:text-error';

export const tasksPanelFiltersModalInputClass = cn(
  'h-9 flex-1 rounded-full border pl-3 font-sans text-xs',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] text-[#fdf6e3] placeholder:text-[#777777]',
  neuInset,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#d85414_40%,transparent)]'
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

export const tasksPanelExportModalInfoClass = 'font-sans text-sm text-[#dcdcdc]';

export const tasksPanelExportModalInfoStrongClass = 'font-semibold text-[#fdf6e3]';

export const tasksPanelExportModalFieldLabelClass = tasksPanelFiltersModalSectionLabelClass;

export const tasksPanelExportFormatStripClass = cn(
  'grid grid-cols-2 gap-1 rounded-[var(--leve-header-radius)] p-1.5 sm:grid-cols-3',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)] bg-[#423b37]',
  neuInset
);

export const tasksPanelExportFormatOptionClass = (active: boolean) =>
  cn(
    'min-h-[44px] rounded-full px-3 py-2 text-center font-sans text-sm font-semibold transition-[box-shadow,color] sm:min-h-9',
    active
      ? cn(
          'border border-[color-mix(in_srgb,#ffffff_35%,transparent)]',
          'bg-[#d85414] text-[#ffffff]',
          badgeRaised
        )
      : 'text-[#dcdcdc] hover:text-[#fdf6e3]'
  );

export const tasksPanelExportModalHintClass = 'font-sans text-xs text-[#777777]';

export const tasksPanelExportModalSubmitClass = cn(
  tasksViewHeaderPrimaryBtnClass,
  'inline-flex w-full min-h-[44px] items-center justify-center gap-2 sm:min-h-10'
);

/* ── Formulários em modais (tarefa, regras) ──────────────────── */

export const tasksPanelFormFieldLabelClass =
  'mb-2 block font-sans text-[10px] font-bold uppercase tracking-widest text-[#dcdcdc]';

export const tasksPanelFormFieldLabelAccentClass = cn(
  tasksPanelFormFieldLabelClass,
  'flex items-center gap-2 !text-[#d85414]'
);

export const tasksPanelFormInputClass = cn(
  'w-full min-h-[44px] rounded-[var(--leve-header-radius)] border px-3 font-sans text-sm',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] text-[#fdf6e3] placeholder:text-[#777777]',
  neuInset,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#d85414_40%,transparent)]'
);

export const tasksPanelFormTextareaClass = cn(
  tasksPanelFormInputClass,
  'min-h-[120px] resize-y font-mono'
);

export const tasksPanelFormSelectClass = cn(
  'tasks-panel-neu-select w-full min-h-[44px] font-sans text-sm text-[#fdf6e3]',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]'
);

export const tasksPanelFormMutedClass = 'font-sans text-xs text-[#777777]';

export const tasksPanelFormLinkAccentClass = 'text-[#d85414]';

export const tasksPanelFormDividerClass =
  'border-t border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]';

export const tasksPanelFormListShellClass = cn(
  'max-h-48 overflow-y-auto divide-y rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)] bg-[#423b37]',
  neuInset,
  'divide-[color-mix(in_srgb,#fdf6e3_10%,transparent)]'
);

export const tasksPanelFormListItemTitleClass = 'font-medium text-[#fdf6e3]';

export const tasksPanelFormListItemMetaClass = 'block text-xs text-[#777777]';

export const tasksPanelFormFooterClass = cn(
  tasksPanelFormDividerClass,
  'flex flex-wrap justify-end gap-2 pt-4'
);

export const tasksPanelFormCancelBtnClass = cn(tasksViewHeaderSecondaryBtnClass, 'min-h-10 px-5');

export const tasksPanelFormSaveBtnClass = cn(tasksViewHeaderPrimaryBtnClass, 'min-h-10 px-6');

/* ── Toolbar (exportar, ordenar, agrupar) ────────────────────── */

export const tasksPanelToolbarShellClass = cn(
  'tasks-panel-toolbar-compact workspace-chrome-inset flex flex-wrap items-end justify-end gap-3',
  'rounded-[var(--leve-header-radius)] px-2.5 pt-3.5 pb-2.5 sm:px-3 sm:pt-4 sm:pb-3',
  'max-md:flex-col max-md:items-stretch max-md:gap-1 max-md:p-2 max-md:pt-2 max-md:pb-2'
);

export const tasksPanelToolbarExportBtnClass = cn(
  'workspace-chrome-pill inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2',
  'max-md:w-full max-md:justify-center max-md:px-3 max-md:py-1.5 max-md:text-xs',
  'font-sans text-sm font-semibold text-[var(--workspace-panel-text)]',
  'transition-[box-shadow,color] duration-200',
  'hover:text-[var(--workspace-panel-accent)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_35%,transparent)]'
);

export const tasksPanelToolbarFieldClass = cn(
  'tasks-panel-toolbar-field flex min-w-0 flex-col gap-1.5',
  'max-md:w-full max-md:flex-row max-md:items-center max-md:justify-between max-md:gap-1.5'
);

export const tasksPanelToolbarLabelClass = cn(
  'font-sans text-[10px] font-semibold uppercase leading-snug tracking-wide text-[var(--workspace-panel-text-muted)]',
  'max-md:mb-0 max-md:w-14 max-md:shrink-0 max-md:text-[9px]'
);

export const tasksPanelToolbarSelectClass = cn(
  'tasks-panel-neu-select app-element-typography h-9 min-h-0 w-auto min-w-[6.5rem]',
  'max-md:min-h-9 max-md:min-w-0 max-md:flex-1',
  'border-0 text-[var(--workspace-panel-text)]'
);

/* ── Seções colapsáveis (Favoritos / Outras) ─────────────────── */

export const tasksPanelSectionToggleClass = cn(
  'app-element-typography flex w-full min-w-0 items-center justify-between gap-2',
  'rounded-[var(--leve-header-radius)] px-3 py-2.5 max-md:px-2 max-md:py-1.5',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] text-[#dcdcdc]',
  neuInset,
  'transition-[box-shadow,color] duration-200',
  'hover:text-[#fdf6e3]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#d85414_35%,transparent)]',
  'active:shadow-[inset_5px_5px_12px_color-mix(in_srgb,#423b37_80%,transparent),inset_-4px_-4px_10px_color-mix(in_srgb,#fdf6e3_6%,#4a423e)]'
);

export const tasksPanelSectionTitleClass = 'text-[#d85414]';

export const tasksPanelSectionCountClass =
  'shrink-0 font-medium normal-case tracking-normal text-[#dcdcdc]';

export const tasksPanelSectionChevronClass =
  'h-4 w-4 shrink-0 text-[#777777] transition-transform duration-200';

/* ── Chrome do ProjectView (breadcrumbs, abas, backlog) ──────── */

export const projectChromeHeaderShellClass = cn(
  'project-chrome-neu-shell tasks-panel-dark-surface',
  'mb-3 min-w-0 max-w-full font-sans px-3 py-2 sm:mb-4 sm:px-4 sm:py-3',
  'max-md:mb-1.5 max-md:px-1.5 max-md:py-1',
  'rounded-[var(--leve-header-radius)]'
);

export const projectChromeHeaderInnerClass = 'max-md:gap-0';

export const projectChromeBreadcrumbsClass = cn(
  'project-chrome-breadcrumbs workspace-chrome-inset',
  'rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2',
  'max-md:rounded-lg max-md:px-1.5 max-md:py-0.5'
);

export const projectChromeToolbarClass = cn(
  'project-chrome-toolbar-responsive workspace-chrome-inset flex shrink-0 items-center gap-0.5 p-0.5',
  'max-md:w-auto max-md:shrink-0'
);

export const projectChromeToolbarDividerClass = cn(
  'mx-0.5 h-5 w-px shrink-0 bg-[var(--workspace-panel-divider)]',
  'max-md:mx-0 max-md:h-4'
);

export const projectChromeToolbarStatusClass = 'text-[var(--workspace-panel-text-muted)]';

export const projectChromeTabsDividerClass = cn(
  'project-chrome-tabs-divider relative mt-2.5 border-t border-[var(--workspace-panel-divider)] pt-2.5 sm:mt-3 sm:pt-3',
  'max-md:mt-0.5 max-md:border-t-0 max-md:pt-0.5'
);

export const projectChromeTabsNavClass = cn(
  'workspace-chrome-inset no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto scroll-smooth snap-x snap-mandatory p-1',
  'max-md:gap-0.5 max-md:p-0.5'
);

export const projectChromeTabActiveClass = cn(
  'workspace-chrome-tab-active inline-flex min-h-[2.25rem] shrink-0 snap-start items-center whitespace-nowrap px-3 py-2 sm:min-h-0',
  'max-md:min-h-7 max-md:px-2 max-md:py-0.5 max-md:text-[11px]',
  'font-sans text-sm font-semibold'
);

export const projectChromeTabIdleClass = cn(
  'workspace-chrome-tab-idle inline-flex min-h-[2.25rem] shrink-0 snap-start items-center whitespace-nowrap px-3 py-2 sm:min-h-0',
  'max-md:min-h-7 max-md:px-2 max-md:py-0.5 max-md:text-[11px]',
  'font-sans text-sm font-medium'
);

export const projectChromeScrollFadeFromClass =
  'pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 rounded-l-full bg-gradient-to-r from-[var(--workspace-panel-bg)] to-transparent max-md:hidden';

export const projectChromeScrollFadeToClass =
  'pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 rounded-r-full bg-gradient-to-l from-[var(--workspace-panel-bg)] to-transparent max-md:hidden';

export const projectChromeScrollHintClass = cn(
  'project-chrome-scroll-hint mt-1 text-center font-sans text-[11px] text-[var(--workspace-panel-text-muted)] md:hidden',
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
  'workspace-chrome-pill project-chrome-sync-btn inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5 sm:min-h-0',
  'max-md:min-h-8 max-md:min-w-8 max-md:justify-center max-md:gap-0 max-md:p-0',
  'font-sans text-xs font-semibold disabled:opacity-50'
);

export const projectChromeDangerBtnClass = cn(
  'workspace-chrome-pill workspace-chrome-pill-danger inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5 sm:min-h-0',
  'max-md:min-h-8 max-md:min-w-8 max-md:justify-center max-md:gap-0 max-md:p-0',
  'font-sans text-xs font-semibold'
);

export const projectChromeToolbarStatusWrapClass =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs max-md:gap-0 max-md:px-1 max-md:py-0';

/* ── Cabeçalho da aba Tarefas (título + subtítulo) ───────────── */

export const tasksViewPageHeaderShellClass = cn(
  'project-chrome-neu-shell tasks-panel-dark-surface tasks-view-header-neu-shell',
  'mb-3 flex flex-col gap-4 rounded-[var(--leve-header-radius)] px-3 py-3 font-sans sm:mb-4 sm:gap-5 sm:px-4 sm:py-4',
  'max-md:mb-2 max-md:gap-2 max-md:px-2.5 max-md:py-2'
);

export const tasksViewHeaderActionsClass = cn(
  'tasks-view-header-actions-row flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end'
);

/** CTA principal do cabeçalho de Tarefas (largura total no mobile via CSS). */
export const tasksViewHeaderPrimaryCtaClass = 'tasks-view-header-primary-cta';

export const tasksViewPageTitleClass = cn(
  'font-sans text-2xl font-bold tracking-tight text-[var(--workspace-panel-text)] sm:text-[1.65rem]',
  'max-md:text-xl'
);

export const tasksViewPageJiraBadgeClass = cn(
  'workspace-chrome-badge inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold'
);

export const tasksViewPageSubtitleClass =
  'font-sans text-sm text-[var(--workspace-panel-text-muted)]';

/* ── Backlog (filtros + lista) ───────────────────────────────── */

export const backlogToolbarPanelClass = cn(
  'app-element-typography w-full min-w-0 rounded-[var(--leve-header-radius)] px-2 py-1.5 sm:px-2.5',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37]',
  neuInset
);

export const backlogToolbarHelpClass = cn(
  'text-[10px] leading-snug text-[#dcdcdc] sm:text-[11px]',
  '[&_strong]:font-semibold [&_strong]:text-[#fdf6e3]'
);

export const backlogToolbarGridClass = cn(
  'grid w-full grid-cols-2 gap-x-1.5 gap-y-1.5 sm:grid-cols-3 sm:gap-x-2 xl:grid-cols-6 xl:gap-x-1.5 xl:gap-y-1'
);

export const backlogToolbarSelectClass = cn(
  'tasks-panel-neu-select backlog-toolbar-select app-element-typography h-7 w-full min-w-0',
  'text-[11px] font-semibold leading-tight text-[#fdf6e3]',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]'
);

export const backlogToolbarLabelClass = 'text-[10px] font-medium leading-none text-[#dcdcdc]';

export const backlogToolbarFieldClass = 'flex min-w-0 w-full flex-col gap-0.5';

export const backlogToolbarFieldHeaderClass = 'flex min-w-0 items-center justify-between gap-1';

export const backlogToolbarClearLinkClass = cn(
  'shrink-0 text-[10px] font-medium leading-none text-[#777777]',
  'underline-offset-2 hover:text-[#d85414] hover:underline disabled:opacity-50'
);

export const backlogListSurfaceClass = cn(
  'backlog-list-surface tasks-panel-dark-surface app-element-typography overflow-hidden',
  'rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#fdf6e3_14%,transparent)]',
  'bg-[#4a423e]',
  neuRaised
);

export const backlogListSurfaceHeaderClass = cn(
  'flex flex-wrap items-center justify-between gap-2 border-0 px-3 py-2 sm:px-4',
  'border-b border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37]',
  neuInset
);

export const backlogListSurfaceTitleClass =
  'text-xs font-semibold uppercase tracking-wider text-[#dcdcdc]';

export const backlogListSurfaceMetaClass = 'text-xs font-medium text-[#fdf6e3]';

export const backlogListSurfaceMetaMutedClass = 'text-[#777777]';

export const backlogListSurfaceBodyClass = cn(
  'min-w-0 bg-[color-mix(in_srgb,#423b37_35%,#4a423e)] p-2 sm:p-4'
);

export const backlogActiveChipClass = cn(
  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-[#dcdcdc]',
  'border border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
  'bg-[#4a423e]',
  neuRaised
);

export const backlogToolbarChipsRowClass = cn(
  'mt-1 flex flex-wrap items-center gap-1 border-t border-[color-mix(in_srgb,#fdf6e3_14%,transparent)] pt-1'
);

export const backlogClearFiltersLinkClass =
  'text-[11px] font-medium text-error hover:underline disabled:opacity-50';

export const backlogChipRemoveBtnClass = cn(
  'flex h-4 w-4 items-center justify-center rounded-full',
  'hover:bg-[color-mix(in_srgb,#fdf6e3_12%,#423b37)]'
);

export const tasksPanelBacklogSprintHeadingClass = (active: boolean) =>
  cn(
    'mb-3 flex flex-wrap items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider',
    active ? 'text-[#d85414]' : 'text-[#dcdcdc]'
  );

export const tasksPanelBacklogSprintCountClass =
  'font-medium normal-case tracking-normal text-[#777777]';

export const tasksPanelBacklogSprintActiveBadgeClass = cn(
  'rounded-full border border-[color-mix(in_srgb,#ffffff_30%,transparent)]',
  'bg-[#d85414] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#ffffff]',
  badgeRaised
);

/* ── Barra de filtros compartilhada (Documentos, Regras) ───────── */

export const tasksPanelFiltersBarClass = cn(
  'tasks-panel-filters-bar tasks-panel-dark-surface flex flex-col gap-3 rounded-[var(--leve-header-radius)] p-3 font-sans sm:flex-row sm:flex-wrap sm:items-end lg:gap-4',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37]',
  'max-md:gap-2 max-md:p-2',
  neuInset
);

export const tasksPanelFilterLabelClass =
  'mb-1.5 block font-sans text-xs font-medium text-[#dcdcdc]';

export const tasksPanelFilterSelectClass = cn(
  'tasks-panel-neu-select app-element-typography h-10 min-h-0 w-full font-sans text-sm text-[#fdf6e3]',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'max-md:h-9 max-md:text-xs'
);

export const tasksPanelFilterManageLinkClass = cn(
  'shrink-0 font-sans text-xs font-semibold text-[#d85414] hover:underline'
);

export const tasksPanelFilterPillClass = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1.5 font-sans text-xs transition-[box-shadow,color]',
    active
      ? cn(
          'border border-[color-mix(in_srgb,#ffffff_35%,transparent)]',
          'bg-[#d85414] font-semibold text-[#ffffff]',
          badgeRaised
        )
      : cn(
          'border border-transparent font-medium text-[#dcdcdc]',
          'hover:text-[#fdf6e3]'
        )
  );

/* ── Documentos ──────────────────────────────────────────────── */

export const documentsPageHeaderClass = tasksViewPageHeaderShellClass;

export const documentsPageTitleClass = tasksViewPageTitleClass;

export const documentsJiraBadgeClass = tasksViewPageJiraBadgeClass;

export const documentsPageSubtitleClass = tasksViewPageSubtitleClass;

export const documentsPageMutedClass = 'font-sans text-[#777777]';

export const documentsFiltersPanelClass = tasksPanelCardClass;

export const documentsEyebrowClass = cn(
  'inline-block border-b border-[#d85414] pb-1',
  'font-sans text-[10px] font-extrabold uppercase tracking-wider text-[#d85414] sm:text-[11px]'
);

export const documentsSectionShellClass = cn(
  'tasks-panel-dark-surface rounded-[var(--leve-header-radius)] font-sans p-3 sm:p-3.5',
  'border border-[color-mix(in_srgb,#fdf6e3_14%,transparent)]',
  'bg-[#4a423e]',
  neuRaised
);

export const documentsSectionHeaderDividerClass =
  'border-b border-[color-mix(in_srgb,#fdf6e3_14%,transparent)]';

export const documentsSectionHeaderClass = cn(documentsSectionHeaderDividerClass, 'pb-2');

export const documentsSectionTitleClass =
  'mt-1 font-sans text-base font-bold text-[#fdf6e3] sm:text-lg';

export const documentsSummaryStripClass = cn(
  'mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--leve-header-radius)] px-3 py-2.5 sm:px-3.5',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37]',
  neuInset
);

export const documentsSummaryStatsClass =
  'flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-[#dcdcdc]';

export const documentsSummaryStatStrongClass = 'text-[#fdf6e3]';

export const documentsSummaryStatIconAccentClass = 'h-4 w-4 text-[#d85414]';

export const documentsSummaryStatIconSuccessClass = 'h-4 w-4 text-success';

export const documentsAlertSuccessClass = cn(
  'flex items-start gap-2 rounded-[var(--leve-header-radius)] px-3 py-2',
  'border border-[color-mix(in_srgb,#10b981_35%,transparent)]',
  'bg-[color-mix(in_srgb,#10b981_12%,#423b37)]',
  neuInset
);

export const documentsAlertInfoClass = cn(
  'flex items-start gap-2 rounded-[var(--leve-header-radius)] px-3 py-2',
  'border border-[color-mix(in_srgb,#d85414_35%,transparent)]',
  'bg-[color-mix(in_srgb,#d85414_10%,#423b37)]',
  neuInset
);

export const documentsBodyTextClass = 'font-sans text-sm font-medium leading-snug text-[#fdf6e3]';

export const documentsMutedTextClass = 'font-sans text-xs text-[#777777]';

export const documentsStrongTextClass = 'font-semibold text-[#fdf6e3]';

export const documentsProgressTrackClass = cn(
  'relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#777777]',
  neuInset
);

export const documentsProgressFillClass = 'h-full w-full rounded-full bg-success';

export const documentsProgressPercentClass =
  'shrink-0 font-sans text-xs font-bold tabular-nums text-[#dcdcdc]';

export const documentsPrimaryBtnClass = tasksViewHeaderPrimaryBtnClass;

export const documentsOutlineBtnClass = cn(
  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 font-sans text-sm font-semibold',
  'border border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
  'bg-[#423b37] text-[#dcdcdc]',
  neuInset,
  'hover:text-[#fdf6e3]'
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
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37]',
  neuInsetDeep
);

export const documentsFilterPillsGroupClass = cn(documentsFilterPillsStripClass, 'sm:gap-2');

export const documentsCardClass = cn(
  'tasks-panel-dark-surface rounded-[var(--leve-header-radius)] p-3 sm:p-3.5',
  'border border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]',
  'bg-[#4a423e]',
  neuRaised,
  'transition-[box-shadow] duration-200 hover:brightness-[1.02]'
);

export const documentsCardTitleClass = cn(
  'line-clamp-2 border-b border-[color-mix(in_srgb,#fdf6e3_14%,transparent)] pb-2',
  'font-heading text-sm font-bold leading-snug text-[#fdf6e3] sm:text-base'
);

export const documentsCardMetaClass = 'mt-1.5 text-[11px] leading-relaxed text-[#777777]';

export const documentsCardActionsClass = cn(
  'mt-2.5 flex flex-wrap gap-1.5 border-t border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] pt-2.5'
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
  requisitos:
    'border-[color-mix(in_srgb,#fdf6e3_22%,transparent)] bg-[color-mix(in_srgb,#fdf6e3_8%,#423b37)] text-[#fdf6e3]',
  testes:
    'border-[color-mix(in_srgb,#10b981_35%,transparent)] bg-[color-mix(in_srgb,#10b981_15%,#423b37)] text-success',
  arquitetura:
    'border-[color-mix(in_srgb,#d85414_35%,transparent)] bg-[color-mix(in_srgb,#d85414_12%,#423b37)] text-[#d85414]',
  outros:
    'border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] bg-[#423b37] text-[#dcdcdc]',
};

export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'inline-flex rounded-full border border-[color-mix(in_srgb,#10b981_35%,transparent)]',
  'bg-[color-mix(in_srgb,#10b981_12%,#423b37)] px-2 py-0.5 text-[10px] font-semibold text-success'
);

export const documentsModalSectionLabelClass = documentsEyebrowClass;

export const documentsModalMetaClass = 'text-sm text-[#777777]';

export const documentsModalPreClass = 'whitespace-pre-wrap font-mono text-sm text-[#fdf6e3]';

export const documentsModalPreviewInsetClass = cn(
  'max-h-96 overflow-y-auto rounded-[var(--leve-header-radius)] p-4',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] text-[#fdf6e3]',
  neuInset
);

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#fdf6e3_14%,transparent)]'
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#fdf6e3_14%,transparent)]'
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-[#dcdcdc]';

export const documentsModalInputClass = cn(
  'app-input w-full rounded-[var(--leve-header-radius)] border',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] text-[#fdf6e3] placeholder:text-[#777777]',
  neuInset
);

export const documentsModalTextareaClass = cn(
  documentsModalInputClass,
  'min-h-[15rem] w-full resize-y font-mono text-sm'
);

export const documentsModalFooterClass = cn(
  'flex justify-end gap-2 border-t border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] pt-4'
);

export const documentsModalFooterCancelClass = cn(documentsOutlineBtnClass, 'min-h-10 px-5');

export const documentsModalFooterSaveClass = cn(documentsPrimaryBtnClass, 'min-h-10 px-6');

export const documentsAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  'rounded-[var(--leve-header-radius)] px-4 py-5 sm:px-6 sm:py-6',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] text-[#fdf6e3]',
  neuInset,
  'prose-headings:font-heading prose-headings:text-[#fdf6e3]',
  'prose-p:mb-3 prose-p:leading-relaxed prose-p:text-[#dcdcdc]',
  'prose-strong:font-bold prose-strong:text-[#fdf6e3]',
  '[&_a]:text-[#d85414] [&_a]:underline-offset-2'
);
