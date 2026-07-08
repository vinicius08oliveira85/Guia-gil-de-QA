import { cn } from '../../utils/cn';
import {
  leveTaskModalGhostBtnClass,
  leveTaskModalIconBtnClass,
  leveTaskModalInfoActionBtnClass,
  leveTaskModalNavFooterClass,
  leveTaskModalPrimaryBtnClass,
  leveTaskModalSecondaryBtnClass,
  leveTaskModalSuccessActionBtnClass,
  leveTaskModalTabBadgeActiveClass,
  leveTaskModalTabBadgeIdleClass,
  leveTaskModalTabClass,
  leveTaskModalTabsStripClass,
} from '../common/projectCardUi';

/** Grade da faixa de ações (desktop) — colunas fixas para alinhar entre cards. */
export const TASK_ACTION_STRIP_GRID =
  'grid w-full grid-cols-[4.75rem_9rem_8.25rem] items-center justify-items-stretch gap-2';

export const TASK_ACTION_SLOT_CLASSNAMES = {
  metrics: 'flex justify-end md:min-h-[1.5rem] md:items-center',
  generateAll: 'flex justify-center md:min-h-[1.5rem] md:items-center',
  testStatus:
    'max-md:min-w-[6.75rem] max-md:justify-center md:flex md:justify-center md:min-h-[1.5rem] md:items-center',
} as const;

const taskListChipShadow = 'shadow-[var(--task-list-chip-raised,var(--leve-neu-raised))]';

/** Shell visual do card na listagem (tokens em index.css `.task-card-shell`). */
export const taskCardShellClass =
  'task-card-shell px-1.5 py-2 transition-[box-shadow] duration-200 max-sm:min-w-0 sm:px-3 sm:py-2';

/** Layout do shell: coluna até `md`; linha quando a faixa de ações desktop aparece. */
export const taskCardShellLayoutClass =
  'task-card-shell-layout flex min-w-0 flex-col items-stretch gap-tasks-panel-tight overflow-visible md:flex-row md:items-center md:gap-3';

/** Plus Jakarta Sans + tracking do tema (identidade tipográfica do app). */
export const taskCardTypography = 'font-sans tracking-[var(--letter-spacing)]';

/** Título principal / seção em card ou modal de tarefa. */
export const taskCardTitleClass =
  'task-card-title text-xs leading-snug sm:text-sm sm:leading-tight';

export const taskCardMutedClass = 'task-card-muted';

export const taskCardFieldLabelClass = 'task-card-field-label';

export const taskCardSectionTitleClass = 'task-card-section-title flex items-center gap-2';

export const taskModalSectionClass = 'task-modal-section';

export const taskModalSectionAccentClass = 'task-modal-section-accent';

export const taskUiTagClass = 'task-ui-tag';

export const taskUiTagInfoClass = 'task-ui-tag-info';

export const taskUiTagSuccessClass = 'task-ui-tag-success';

export const taskToolbarPillGroupClass = 'task-toolbar-pill-group';

/** Borda + raio padrão para painéis compactos (filtros, colapsáveis, anexos). */
export const taskPanelBorderClass = cn('task-details-neu-inset rounded-box');

/** Select/input compacto em modais de tarefa. */
export const taskSelectControlClass = 'app-select';

/** Toolbar da lista de tarefas (exportar, ordenar, agrupar). */
export const taskListToolbarShellClass = cn(
  'task-details-neu-inset flex flex-wrap items-end justify-end gap-3 rounded-box p-2.5 sm:p-3'
);

export const taskListToolbarFieldClass = 'flex flex-col gap-1';

export const taskListToolbarLabelClass =
  'font-sans text-[10px] font-semibold uppercase tracking-wide text-base-content/72';

export const taskListToolbarSelectClass = cn(
  'app-select app-element-typography h-9 min-h-0 w-auto min-w-[6.5rem] cursor-pointer',
  'rounded-selector px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50'
);

/** Textarea em formulários de caso de teste / modais densos. */
export const taskTextareaClass = cn(
  'textarea textarea-bordered app-input w-full rounded-field font-mono whitespace-pre-wrap text-base-content'
);

/** Painel interno de formulário (prévia, opcionais). */
export const taskFormInsetPanelClass = cn(
  taskModalSectionClass,
  'task-details-neu-inset space-y-3 p-3'
);

export const taskFormPreviewBoxClass = `${taskPanelBorderClass} mt-2 p-3 text-xs`;

export const taskChipSurfaceClass = cn(
  'task-details-neu-inset hover:shadow-[var(--leve-neu-hover)]'
);

export const taskLabelMutedClass = 'task-card-muted';

export const taskTextStrongClass = 'text-base-content';

export const taskCollapsibleShellClass = `${taskPanelBorderClass} overflow-hidden`;

export const taskCollapsibleHeaderClass = cn(
  'task-details-neu-inset flex w-full items-center justify-between px-sm py-xs',
  'transition-[box-shadow] hover:shadow-[var(--leve-neu-hover)]'
);

/** Título da tarefa na linha do card (12px, sem escalar para sm). */
export const taskCardTitleTypography = `${taskCardTypography} text-xs font-semibold leading-tight`;

/** ID clicável nos metadados. */
export const taskCardIdTypography = `${taskCardTypography} text-[10px] font-semibold tabular-nums leading-none`;

/** Faixa de metadados (container). */
export const taskCardMetadataStripTypography = `${taskCardTypography} text-[10px] leading-none`;

/** Altura única dos pills da linha de metadados (16px). */
export const taskCardMetadataPillLayout = 'inline-flex h-4 max-h-4 min-h-4 items-center';

/** Badges pill: tipo, status, risco. */
export const taskCardBadgePillTypography = `${taskCardTypography} text-[9px] font-bold uppercase leading-none`;

export const taskCardBadgePillShape = `${taskCardMetadataPillLayout} rounded-full px-1.5`;

/** Story Points e etiquetas técnicas. */
export const taskCardBadgeTechTypography = `${taskCardTypography} text-[9px] font-bold tabular-nums leading-none`;

export const taskCardBadgeTechShape = `${taskCardMetadataPillLayout} rounded-selector px-1.5`;

/** Botões da faixa de ações (compactos, alinhados ao texto 10px). */
export const taskCardButtonTypography = `${taskCardTypography} text-[10px] font-semibold leading-none`;

export const taskCardButtonShape = 'rounded-full px-2 py-0';

/** Relevo neumórfico — chips da faixa de ações do card (Gerar Tudo, status de teste). */
export const taskNeuChipRaisedClass = cn(
  'border border-base-300/45 bg-base-100',
  taskListChipShadow,
  'transition-[box-shadow,color] duration-200',
  'hover:shadow-[var(--leve-neu-hover)] active:shadow-[var(--task-list-inset,var(--leve-neu-inset))]'
);

export const taskNeuStatusToneClass = {
  testar: 'text-base-content',
  testando: 'text-warning',
  pendente: 'text-error',
  teste_concluido: 'text-success',
  sem_testes: 'text-base-content/72',
} as const;

const taskCardActionChipBase = cn(
  'btn-task-format inline-flex h-6 max-h-6 min-h-6 w-full min-w-0 items-center justify-center gap-0.5',
  taskCardButtonShape,
  taskCardButtonTypography,
  taskNeuChipRaisedClass,
  'disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2'
);

export const taskCardActionChipCta = cn(
  taskCardActionChipBase,
  'text-base-content/72 hover:text-primary',
  'focus-visible:ring-primary/30'
);

export const taskCardActionChipBusy = 'ring-1 ring-primary/28';

export const taskCardTestStatusChipLayout = cn(
  'inline-flex h-6 max-h-6 min-h-6 min-w-0 w-full justify-center gap-0.5',
  taskCardButtonShape,
  taskCardButtonTypography,
  taskNeuChipRaisedClass
);

/** Largura fixa do chevron + contador de subtarefas (alinha metadados entre cards). */
export const taskCardSubtreeExpandSlotClass = cn(
  taskNeuChipRaisedClass,
  'inline-flex shrink-0 items-center justify-center gap-0.5 px-1.5',
  'min-h-9 min-w-9 max-sm:min-h-8 max-sm:min-w-[2.75rem] sm:min-h-8 sm:min-w-[3.25rem]'
);

/** Hover / seleção do card na listagem. */
export const taskCardListHoverClass = 'hover:shadow-[var(--leve-neu-hover)]';
/** Hierarquia por indentação — mesma cor de fundo do card pai. */
export const taskCardNestedListBgClass = '';
export const taskCardSelectedClass = cn(
  'ring-1 ring-primary/35',
  'shadow-[var(--leve-neu-hover)]'
);

export const taskNeuDividerClass = 'border-base-300/35';

export const taskTestActionsBarClass = `${taskPanelBorderClass} mt-1.5 flex items-center gap-2 p-2.5`;

export const taskTabListClass = leveTaskModalTabsStripClass;

/** Alias — mesmas abas pill do `TaskDetailsModal`. */
export const taskTabClass = leveTaskModalTabClass;

export const taskTabBadgeActiveClass = leveTaskModalTabBadgeActiveClass;

export const taskTabBadgeInactiveClass = leveTaskModalTabBadgeIdleClass;

export const taskModalGhostBtnClass = leveTaskModalGhostBtnClass;

export const taskModalPrimaryBtnClass = leveTaskModalPrimaryBtnClass;

export const taskModalSecondaryBtnClass = leveTaskModalSecondaryBtnClass;

export const taskModalInfoActionBtnClass = leveTaskModalInfoActionBtnClass;

export const taskModalSuccessActionBtnClass = leveTaskModalSuccessActionBtnClass;

export const taskModalIconBtnClass = leveTaskModalIconBtnClass;

export const taskToolsSectionClass = `${taskModalSectionClass} mt-6 overflow-hidden`;

export const taskCountBadgeClass = cn(
  'task-details-neu-chip text-xs font-normal text-base-content/72 px-2 py-0.5'
);

export const taskDetailsExpandClass = cn(
  'task-details-neu-inset overflow-visible rounded-b-box border-t border-base-300/35'
);

export const taskMetadataStripClass = 'task-card-metadata-strip [scrollbar-width:thin]';

/** Filhos expandidos — indentação leve no mobile para preservar largura útil. */
export const taskSubtreeChildrenClass = [
  'task-subtree-children mt-1 border-l-2',
  'ml-0 pl-2 max-sm:ml-0 max-sm:pl-2',
  'sm:ml-3 sm:pl-2.5 md:ml-6 md:pl-3',
  'max-md:rounded-r-lg max-md:pr-1',
  'border-base-300/40',
].join(' ');

export const taskNavFooterClass = cn(leveTaskModalNavFooterClass, 'mt-5');

export const taskIconHoverClass = 'hover:bg-base-300/25';

export const taskChipCountClass = cn(
  'rounded-full bg-base-300/25 px-1.5 py-0.5 text-[10px] tabular-nums text-base-content/72'
);

export const gerarTudoRingOffsetClass = 'ring-offset-base-200';

/** Item de menu/dropdown na área de tarefas. */
export const taskMenuItemClass = 'app-menu-item text-left';

export const taskMenuItemSelectedClass = 'app-menu-item-active';

/** Status neutro (To Do / padrão) em pills e badges. */
export const taskStatusNeutralClass = cn(
  'border-base-300/35 bg-base-300/20 text-base-content/72'
);

export const taskTypeDefaultStripeClass = 'bg-base-300/45';

export const taskTypeDefaultBadgeClass = cn(
  'badge badge-sm border-0 bg-base-300/35 text-base-content/72'
);

/** Bloco mono compacto (prévia de teste, logs). */
export const taskMonoInsetClass = cn(
  'task-details-neu-inset rounded-field p-xs font-mono text-xs text-base-content/72'
);

export const taskNeuTrackClass = 'workspace-stat-neu-track';

export const taskNeuTrackFillMutedClass =
  'h-full shrink-0 rounded-r-full bg-base-300/35';

/** Chip de ferramenta não selecionado. */
export const taskToolChipIdleClass = cn(
  'task-details-neu-inset border border-base-300/35 text-base-content',
  'hover:border-primary/30 hover:shadow-[var(--leve-neu-hover)]'
);

export const taskSegmentedControlClass = cn(
  'task-details-neu-inset flex w-full gap-1 rounded-selector p-1'
);

export const taskSegmentedOptionIdleClass = cn(
  'inline-flex flex-1 items-center justify-center rounded-selector px-2 py-1.5',
  'font-sans text-xs font-medium text-base-content/72 transition-colors',
  'hover:text-base-content'
);

export const taskSegmentedOptionActiveClass = cn(
  'inline-flex flex-1 items-center justify-center rounded-selector px-2 py-1.5',
  'font-sans text-xs font-semibold text-primary-content',
  'bg-primary',
  taskListChipShadow
);

export const taskCardSelectedSurfaceClass = cn(
  'border-primary bg-primary/10 shadow-md ring-2 ring-primary/22'
);

export const taskCardIdleSurfaceClass = cn(
  'bg-base-300/10 hover:border-primary/40 hover:shadow-[var(--leve-neu-hover)]'
);

export const taskNeuBorderDividerClass = 'border-base-300/35';
