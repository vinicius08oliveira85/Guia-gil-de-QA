import { cn } from '../../utils/cn';

/** Shell do painel (portal em document.body). */
export const taskDetailsModalShellClass = cn(
  'task-details-neu-modal leve-modal-neu-shell font-sans'
);

export const taskDetailsModalBodyClass = cn(
  'bg-base-200 text-base-content/72',
  'scrollbar-thumb-primary/35 hover:scrollbar-thumb-primary/50'
);

export const taskDetailsModalTitleClass = 'text-base-content';

/** Rótulo da seção ativa no cabeçalho do modal. */
export const taskDetailsModalHeaderSectionClass = cn(
  'task-details-neu-header-section',
  'inline-flex w-fit max-w-full shrink-0 items-center rounded-selector px-3 py-1',
  'font-sans text-[10px] font-semibold tracking-wide text-base-content sm:text-[11px]',
  'truncate'
);

/** Superfície elevada (cards, botões secundários). */
export const taskDetailsNeuRaisedClass = 'task-details-neu-raised';

/** Superfície rebaixada. */
export const taskDetailsNeuInsetClass = 'task-details-neu-inset';

/** Superfície rebaixada profunda (trilhos, painel de conteúdo). */
export const taskDetailsNeuInsetDeepClass = 'task-details-neu-inset-deep';

/** Trilho segmentado — inset. */
export const taskDetailsModalTabsTrackClass = cn(
  'task-details-neu-track flex w-full flex-wrap gap-1 overflow-visible rounded-selector p-1.5'
);

const tabBaseClass =
  'task-details-neu-tab inline-flex min-h-[2rem] shrink-0 snap-start items-center gap-1.5 rounded-selector px-2.5 py-1.5 font-sans text-sm font-semibold leading-tight transition-[box-shadow,color,transform]';

/** Chip de aba — raised; ativo = inset. */
export const taskDetailsModalTabClass = (active: boolean) =>
  cn(tabBaseClass, active ? 'task-details-neu-chip--active' : 'task-details-neu-chip');

/** Wrapper com scroll horizontal sem cortar sombra dos chips. */
export const taskDetailsModalTabsScrollWrapClass =
  'overflow-x-auto overflow-y-visible px-0.5 py-1 -mx-0.5';

/** Trilho de status (Ações rápidas). */
export const taskDetailsModalStatusTrackClass = cn(
  'task-details-neu-track task-details-neu-status-track inline-flex flex-wrap items-stretch gap-1 overflow-visible rounded-selector p-1.5'
);

export const taskDetailsModalStatusPillClass = (active: boolean) =>
  cn(
    'task-details-neu-status-pill inline-flex min-h-[2.25rem] items-center justify-center rounded-selector px-3 py-1.5',
    'font-sans text-xs font-semibold transition-[box-shadow,color,transform] sm:min-h-0',
    active ? 'task-details-neu-chip--status-active' : 'task-details-neu-chip'
  );

/** Seção/card interno do modal. */
export const taskDetailsModalSectionClass = cn('task-modal-section', taskDetailsNeuRaisedClass, 'font-sans');

export const taskDetailsModalPanelShellClass = cn(
  taskDetailsNeuInsetDeepClass,
  'rounded-box p-2.5 sm:p-3'
);

/** Rótulo de seção no Resumo (Descrição, Comentários, cartões). */
export const taskDetailsOverviewLabelClass = cn(
  'task-details-overview-label inline-block font-sans text-xs font-extrabold uppercase tracking-wide',
  'text-primary border-b border-primary pb-0.5'
);

/** Valor nos cartões do Resumo (Responsável, Prioridade, etc.). */
export const taskDetailsOverviewValueClass =
  'font-sans text-sm font-semibold leading-snug text-base-content';

export const taskDetailsOverviewSummaryCardClass = cn(taskDetailsModalSectionClass, 'p-2.5');

export const taskDetailsOverviewSectionClass = 'space-y-1.5';

export const taskDetailsOverviewGridClass =
  'grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_min(20rem,28vw)] xl:grid-cols-[minmax(0,1fr)_min(22rem,26vw)] 2xl:grid-cols-[minmax(0,1fr)_min(24rem,22vw)]';

export const taskDetailsOverviewMainClass = 'min-w-0 space-y-2.5';

export const taskDetailsModalInsetPanelClass = cn(taskDetailsNeuInsetClass, 'px-3 py-3');

export const taskDetailsModalDescriptionClass = cn(
  'task-details-neu-description leve-neu-inset-content',
  taskDetailsNeuInsetClass,
  'rounded-field px-3 py-2.5 text-[0.9375rem] leading-snug text-base-content',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:space-y-0.5 [&_ol]:space-y-0.5'
);

export const taskDetailsModalGhostBtnClass = cn(
  'task-details-neu-ghost-btn task-details-neu-chip',
  'inline-flex min-h-[44px] items-center gap-2 rounded-selector px-4 sm:min-h-9'
);

export const taskDetailsModalIconBtnClass = cn(
  'task-details-neu-chip inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-selector',
  'text-base-content/72 transition-[box-shadow,color]',
  'hover:text-primary'
);

export const taskDetailsModalActionToolbarClass = cn(
  'task-details-neu-inset inline-flex shrink-0 items-center gap-0.5 rounded-selector p-1'
);

export const taskDetailsModalWatchersClass = cn(
  'task-details-neu-watchers',
  taskDetailsNeuInsetClass,
  'rounded-box p-2.5',
  'border border-primary/18'
);

export const taskDetailsModalJiraBtnClass = cn(
  'task-details-neu-jira-btn task-details-neu-chip w-full gap-2 rounded-selector'
);

/** Card de caso de teste na lista do modal. */
export const taskDetailsModalTestCaseCardClass = cn(
  taskDetailsModalSectionClass,
  'py-2 px-3 transition-colors duration-200'
);

/** Shell colapsável «Roteiro completo». */
export const taskDetailsModalRoteiroShellClass = cn(
  taskDetailsNeuInsetClass,
  'task-details-neu-roteiro-shell mt-2 overflow-visible rounded-box'
);

export const taskDetailsModalRoteiroHeaderClass = cn(
  'task-details-neu-section-header task-details-neu-roteiro-header flex w-full items-center justify-between px-3 py-2',
  'transition-[box-shadow,background-color] hover:text-base-content'
);

export const taskDetailsModalRoteiroInnerClass =
  'task-details-neu-roteiro-inner space-y-3 border-t border-base-300/55 px-3 pb-3 pt-2';

/** Blocos Ação / Parâmetros / Resultado esperado. */
export const taskDetailsModalRoteiroBlockClass = cn(
  'task-details-neu-roteiro-block leve-neu-inset-content',
  taskDetailsNeuInsetDeepClass,
  'rounded-box text-xs text-base-content'
);

export const taskDetailsModalExecBadgeClass = 'task-details-neu-exec-badge shrink-0';

export const taskDetailsModalSelectClass = cn(
  'task-details-neu-select select select-bordered select-xs app-input min-w-0 w-full rounded-field text-xs'
);

/** Gatilho do AppSelect/NeuSelect no modal. */
export const taskDetailsModalNeuSelectTriggerClass = cn(
  'task-details-neu-neu-select-trigger neu-select-trigger w-full min-w-0',
  'rounded-field text-sm font-medium text-base-content'
);

export const taskDetailsModalTextareaClass = cn(
  'task-details-neu-textarea textarea textarea-bordered textarea-sm app-input w-full rounded-field font-mono whitespace-pre-wrap text-xs text-base-content'
);

export const taskDetailsModalToolbarIconClass = cn(
  taskDetailsModalIconBtnClass,
  'h-7 w-7 min-h-7 min-w-7'
);

export const taskDetailsModalStatusBtnClass = (active: boolean) =>
  cn(
    'task-details-neu-status-btn inline-flex h-7 w-7 min-h-7 min-w-7 items-center justify-center rounded-selector transition-[box-shadow,color,transform]',
    active ? 'task-details-neu-chip--active' : 'task-details-neu-chip'
  );

/** Card de estratégia de teste (planejamento). */
export const testStrategyCardClass = cn(
  taskDetailsModalSectionClass,
  'test-strategy-neu-card flex flex-col overflow-hidden transition-[box-shadow,border-color] duration-300'
);

export const testStrategyInsetPanelClass = cn(
  'test-strategy-neu-inset leve-neu-inset-content',
  taskDetailsNeuInsetDeepClass,
  'rounded-box'
);

export const testStrategyStepsListClass = cn(testStrategyInsetPanelClass, 'space-y-1.5');

export const testStrategyToggleTrackClass = 'test-strategy-neu-toggle';

export const testStrategyToolChipClass = (selected: boolean, compact?: boolean) =>
  cn(
    'test-strategy-neu-tool-chip',
    selected ? 'task-details-neu-chip--active' : 'task-details-neu-chip',
    'inline-flex items-center gap-1.5 font-semibold rounded-selector',
    compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'
  );

export const testStrategyToolInputClass = cn(
  'test-strategy-neu-tool-input task-details-neu-textarea',
  'app-input w-full rounded-selector border-0 font-sans text-base-content',
  'placeholder:text-base-content/72'
);

/** Nível de detalhe (Resumido / Estruturado). */
export const testCaseDetailLevelTrackClass = cn(
  'test-case-detail-level-track',
  taskDetailsModalTabsTrackClass,
  'grid w-full grid-cols-2 gap-1 p-1'
);

export const testCaseDetailLevelOptionClass = (active: boolean) =>
  cn(
    'test-case-detail-level-option inline-flex min-h-[44px] items-center justify-center rounded-selector px-2 py-1.5',
    'font-sans text-xs transition-[box-shadow,color,background-color] sm:min-h-[2.25rem]',
    active
      ? 'test-case-detail-level-option--active task-details-neu-chip--active font-semibold text-primary-content'
      : 'task-details-neu-chip font-medium text-base-content/72'
  );

export type OverviewTileTone = 'accent' | 'error' | 'warning' | 'success' | 'info' | 'neutral';

export const overviewTileToneColor: Record<OverviewTileTone, string> = {
  accent: 'oklch(var(--p))',
  error: 'oklch(var(--er))',
  warning: 'oklch(var(--wa))',
  success: 'oklch(var(--su))',
  info: 'oklch(var(--in))',
  neutral: 'oklch(var(--bc) / 0.72)',
};

export const overviewStatTileClass = cn(
  taskDetailsNeuRaisedClass,
  'flex min-w-0 items-center gap-2.5 rounded-box px-3 py-2.5',
  'transition-[box-shadow,transform] duration-200'
);

export const overviewStatTileIconWrapClass = cn(
  taskDetailsNeuInsetClass,
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-selector'
);

export const overviewStatTileLabelClass =
  'font-sans text-[10px] font-bold uppercase tracking-wide text-base-content/72';

export const overviewStatTileValueClass =
  'min-w-0 truncate font-sans text-sm font-bold leading-snug text-base-content';

export const overviewStatTileEmphasisClass = cn(
  overviewStatTileClass,
  'border border-primary/22'
);

/** CTA «Gerar / Regerar com IA». */
export const taskDetailsModalPrimaryCtaClass = cn(
  'task-details-neu-primary-cta',
  'inline-flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-selector px-4 py-2',
  'font-sans text-sm font-bold sm:min-h-9',
  'border border-primary/45 bg-primary text-primary-content',
  'transition-[filter,transform,box-shadow] duration-150 hover:brightness-110',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
  'disabled:cursor-not-allowed disabled:opacity-50'
);
