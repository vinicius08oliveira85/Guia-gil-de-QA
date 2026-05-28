import { cn } from '../../utils/cn';



/**

 * Neumorfismo do modal de detalhe da tarefa — classes dedicadas (ver index.css).

 * Mesmo padrão de project-card-neu-*: sombras literais, sem shadow-[var] no Tailwind.

 */



/** Shell do painel (portal em document.body). */

export const taskDetailsModalShellClass = cn(

  'task-details-neu-modal leve-modal-neu-shell font-sans'

);



export const taskDetailsModalBodyClass = cn(
  'bg-[#4B433D] text-[rgba(245,241,230,0.72)]',
  'scrollbar-thumb-[color-mix(in_srgb,#E65100_35%,transparent)]',
  'hover:scrollbar-thumb-[color-mix(in_srgb,#E65100_50%,transparent)]'
);

export const taskDetailsModalTitleClass = 'text-[#FDF6E3]';

/** Rótulo da seção ativa no cabeçalho do modal (pill neumórfica, texto legível). */
export const taskDetailsModalHeaderSectionClass = cn(
  'task-details-neu-header-section',
  'inline-flex w-fit max-w-full shrink-0 items-center rounded-full px-3 py-1',
  'font-sans text-[10px] font-semibold tracking-wide text-[#FDF6E3] sm:text-[11px]',
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

  'task-details-neu-track flex w-full flex-wrap gap-1.5 overflow-visible rounded-full p-2'

);



const tabBaseClass =

  'task-details-neu-tab inline-flex min-h-[2.25rem] shrink-0 snap-start items-center gap-2 px-3 py-2 font-sans text-xs font-semibold transition-[box-shadow,color,transform] sm:min-h-0 sm:text-sm';



/** Chip de aba — raised; ativo = inset. */

export const taskDetailsModalTabClass = (active: boolean) =>

  cn(tabBaseClass, active ? 'task-details-neu-chip--active' : 'task-details-neu-chip');



/** Wrapper com scroll horizontal sem cortar sombra dos chips. */

export const taskDetailsModalTabsScrollWrapClass =

  'overflow-x-auto overflow-y-visible px-1 py-1.5 -mx-0.5';



/** Trilho de status (Ações rápidas). */

export const taskDetailsModalStatusTrackClass = cn(

  'task-details-neu-track task-details-neu-status-track inline-flex flex-wrap items-stretch gap-1 overflow-visible rounded-full p-1.5'

);



export const taskDetailsModalStatusPillClass = (active: boolean) =>

  cn(

    'task-details-neu-status-pill inline-flex min-h-[2.25rem] items-center justify-center rounded-full px-3 py-1.5',

    'font-sans text-xs font-semibold transition-[box-shadow,color,transform] sm:min-h-0',

    active ? 'task-details-neu-chip--status-active' : 'task-details-neu-chip'

  );



/** Seção/card interno do modal. */

export const taskDetailsModalSectionClass = cn('task-modal-section', taskDetailsNeuRaisedClass, 'font-sans');



export const taskDetailsModalPanelShellClass = cn(

  taskDetailsNeuInsetDeepClass,

  'rounded-[var(--leve-header-radius)] p-3 sm:p-4'

);



export const taskDetailsModalInsetPanelClass = cn(taskDetailsNeuInsetClass, 'px-3 py-3');



export const taskDetailsModalDescriptionClass = cn(

  'task-details-neu-description leve-neu-inset-content',

  taskDetailsNeuInsetClass,

  'text-sm leading-relaxed text-[var(--leve-header-text)]',

  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:space-y-1.5 [&_ol]:space-y-1.5'

);



export const taskDetailsModalGhostBtnClass = cn(

  'task-details-neu-ghost-btn task-details-neu-chip',

  'inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 sm:min-h-9'

);



export const taskDetailsModalIconBtnClass = cn(

  'task-details-neu-chip inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full',

  'text-[var(--leve-header-text-muted)] transition-[box-shadow,color]',

  'hover:text-[var(--leve-header-accent)]'

);



export const taskDetailsModalActionToolbarClass = cn(

  'task-details-neu-inset inline-flex shrink-0 items-center gap-0.5 rounded-full p-1'

);



export const taskDetailsModalWatchersClass = cn(

  'task-details-neu-watchers',

  taskDetailsNeuInsetClass,

  'rounded-[var(--leve-header-radius)] p-2.5',

  'border border-[color-mix(in_srgb,var(--leve-header-accent)_18%,transparent)]'

);



export const taskDetailsModalJiraBtnClass = cn(

  'task-details-neu-jira-btn task-details-neu-chip w-full gap-2 rounded-full'

);



/** Card de caso de teste na lista do modal. */

export const taskDetailsModalTestCaseCardClass = cn(

  taskDetailsModalSectionClass,

  'py-2 px-3 transition-colors duration-200'

);



/** Shell colapsável «Roteiro completo» — trilho inset dentro do card. */

export const taskDetailsModalRoteiroShellClass = cn(

  taskDetailsNeuInsetClass,

  'task-details-neu-roteiro-shell mt-2 overflow-visible rounded-[var(--leve-header-radius)]'

);



export const taskDetailsModalRoteiroHeaderClass = cn(

  'task-details-neu-section-header task-details-neu-roteiro-header flex w-full items-center justify-between px-3 py-2',

  'transition-[box-shadow,background-color] hover:text-[var(--leve-header-text)]'

);



export const taskDetailsModalRoteiroInnerClass =

  'task-details-neu-roteiro-inner space-y-3 border-t border-[color-mix(in_srgb,var(--leve-header-border)_55%,transparent)] px-3 pb-3 pt-2';



/** Blocos Ação / Parâmetros / Resultado esperado. */

export const taskDetailsModalRoteiroBlockClass = cn(

  'task-details-neu-roteiro-block leve-neu-inset-content',

  taskDetailsNeuInsetDeepClass,

  'rounded-[var(--leve-header-radius)] text-xs text-[var(--leve-header-text)]'

);



export const taskDetailsModalExecBadgeClass = 'task-details-neu-exec-badge shrink-0';



export const taskDetailsModalSelectClass = cn(

  'task-details-neu-select select select-bordered select-xs app-input min-w-0 w-full text-xs'

);



export const taskDetailsModalTextareaClass = cn(

  'task-details-neu-textarea textarea textarea-bordered textarea-sm app-input w-full font-mono whitespace-pre-wrap text-xs text-[var(--leve-header-text)]'

);



export const taskDetailsModalToolbarIconClass = cn(

  taskDetailsModalIconBtnClass,

  'h-7 w-7 min-h-7 min-w-7'

);



export const taskDetailsModalStatusBtnClass = (active: boolean) =>

  cn(

    'task-details-neu-status-btn inline-flex h-7 w-7 min-h-7 min-w-7 items-center justify-center rounded-full transition-[box-shadow,color,transform]',

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

  'rounded-[var(--leve-header-radius)]'

);



export const testStrategyStepsListClass = cn(

  testStrategyInsetPanelClass,

  'space-y-1.5'

);



export const testStrategyToggleTrackClass = 'test-strategy-neu-toggle';



export const testStrategyToolChipClass = (selected: boolean, compact?: boolean) =>

  cn(

    'test-strategy-neu-tool-chip',

    selected ? 'task-details-neu-chip--active' : 'task-details-neu-chip',

    'inline-flex items-center gap-1.5 font-semibold',

    compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'

  );



export const testStrategyToolInputClass = cn(

  'test-strategy-neu-tool-input task-details-neu-textarea',

  'app-input w-full rounded-full border-0 font-sans text-[var(--leve-header-text)]',

  'placeholder:text-[var(--leve-header-text-muted)]'

);



/** Nível de detalhe (Resumido / Estruturado) — trilho inset, opção ativa pressionada. */

export const testCaseDetailLevelTrackClass = cn(

  'test-case-detail-level-track',

  taskDetailsModalTabsTrackClass,

  'grid w-full grid-cols-2 gap-1 p-1'

);



export const testCaseDetailLevelOptionClass = (active: boolean) =>

  cn(

    'test-case-detail-level-option inline-flex min-h-[44px] items-center justify-center rounded-full px-2 py-1.5',

    'font-sans text-xs transition-[box-shadow,color,background-color] sm:min-h-[2.25rem]',

    active

      ? 'test-case-detail-level-option--active task-details-neu-chip--active font-semibold text-[#FDF6E3]'

      : 'task-details-neu-chip font-medium text-[var(--leve-header-text-muted)]'

  );



/** CTA «Gerar / Regerar com IA». */

export const taskDetailsModalPrimaryCtaClass = cn(

  'task-details-neu-primary-cta',

  'inline-flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2',

  'font-sans text-sm font-bold sm:min-h-9',

  'border border-[color-mix(in_srgb,#E65100_45%,transparent)] bg-[#E65100] text-[#FDF6E3]',

  'transition-[filter,transform,box-shadow] duration-150 hover:brightness-110',

  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#E65100_35%,transparent)]',

  'disabled:cursor-not-allowed disabled:opacity-50'

);


