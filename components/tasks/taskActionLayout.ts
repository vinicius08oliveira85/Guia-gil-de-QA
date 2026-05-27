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
export const taskPanelBorderClass = 'leve-neu-surface-inset rounded-[var(--leve-header-radius)]';

/** Select/input compacto em modais de tarefa. */
export const taskSelectControlClass = 'app-select';

/** Toolbar da lista de tarefas (exportar, ordenar, agrupar). */
export const taskListToolbarShellClass = cn(
  'leve-neu-surface-inset flex flex-wrap items-end justify-end gap-3 rounded-[var(--leve-header-radius)] p-2.5 sm:p-3'
);

export const taskListToolbarFieldClass = 'flex flex-col gap-1';

export const taskListToolbarLabelClass =
  'font-sans text-[10px] font-semibold uppercase tracking-wide text-[var(--leve-header-text-muted)]';

export const taskListToolbarSelectClass = cn(
  'app-select app-element-typography h-9 min-h-0 w-auto min-w-[6.5rem] cursor-pointer',
  'rounded-full px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50'
);

/** Textarea em formulários de caso de teste / modais densos. */
export const taskTextareaClass =
  'textarea textarea-bordered app-input w-full font-mono whitespace-pre-wrap text-[var(--leve-header-text)]';

/** Painel interno de formulário (prévia, opcionais). */
export const taskFormInsetPanelClass = `${taskModalSectionClass} leve-neu-surface-inset space-y-3 p-3`;

export const taskFormPreviewBoxClass = `${taskPanelBorderClass} mt-2 p-3 text-xs`;

export const taskChipSurfaceClass = 'leve-neu-surface-inset hover:shadow-[var(--leve-neu-raised)]';

export const taskLabelMutedClass = 'task-card-muted';

export const taskTextStrongClass = 'text-[var(--leve-header-text)]';

export const taskCollapsibleShellClass = `${taskPanelBorderClass} overflow-hidden`;

export const taskCollapsibleHeaderClass =
  'leve-neu-surface-inset flex w-full items-center justify-between px-sm py-xs transition-[box-shadow] hover:shadow-[var(--leve-neu-raised)]';

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

export const taskCardBadgeTechShape = `${taskCardMetadataPillLayout} rounded-[var(--radius)] px-1.5`;

/** Botões da faixa de ações (compactos, alinhados ao texto 10px). */
export const taskCardButtonTypography = `${taskCardTypography} text-[10px] font-semibold leading-none`;

export const taskCardButtonShape = 'rounded-full px-2 py-0';

/** Relevo neumórfico — chips da faixa de ações do card (Gerar Tudo, status de teste). */
export const taskNeuChipRaisedClass = cn(
  'border border-[color-mix(in_srgb,var(--leve-neu-light)_45%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_4%,var(--task-card-surface-bg,var(--leve-neu-bg)))]',
  'shadow-[var(--leve-neu-raised)] transition-[box-shadow,color] duration-200',
  'hover:shadow-[var(--leve-neu-hover)] active:shadow-[var(--leve-neu-inset)]'
);

export const taskNeuStatusToneClass = {
  testar:
    'text-[color-mix(in_srgb,var(--color-primary-deep)_92%,var(--leve-header-text))]',
  testando: 'text-warning',
  pendente: 'text-error',
  teste_concluido: 'text-success',
  sem_testes: 'text-[var(--leve-header-text-muted)]',
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
  'text-[var(--leve-header-text)] hover:text-[var(--leve-header-accent)]',
  'focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)]'
);

export const taskCardActionChipBusy =
  'ring-1 ring-[color-mix(in_srgb,var(--leve-header-accent)_28%,transparent)]';

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
  'ring-1 ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)]',
  'shadow-[var(--leve-neu-hover)]'
);

export const taskNeuDividerClass =
  'border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';

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

export const taskCountBadgeClass =
  'leve-neu-pill text-xs font-normal text-[var(--leve-header-text-muted)] px-2 py-0.5';

export const taskDetailsExpandClass =
  'leve-neu-surface-inset overflow-visible rounded-b-[var(--rounded-box)] border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';

export const taskMetadataStripClass = 'task-card-metadata-strip [scrollbar-width:thin]';

/** Filhos expandidos — indentação leve no mobile para preservar largura útil. */
export const taskSubtreeChildrenClass = [
  'task-subtree-children mt-1 border-l-2',
  'ml-0 pl-2 max-sm:ml-0 max-sm:pl-2',
  'sm:ml-3 sm:pl-2.5 md:ml-6 md:pl-3',
  'max-md:rounded-r-lg max-md:pr-1',
  'border-[color-mix(in_srgb,var(--leve-neu-light)_40%,transparent)]',
].join(' ');

export const taskNavFooterClass = cn(leveTaskModalNavFooterClass, 'mt-5');

export const taskIconHoverClass =
  'hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]';

export const taskChipCountClass =
  'rounded-full bg-[color-mix(in_srgb,var(--leve-neu-dark)_10%,var(--leve-neu-bg))] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--leve-header-text-muted)]';

export const gerarTudoRingOffsetClass = 'ring-offset-[var(--leve-neu-bg)]';

/** Item de menu/dropdown na área de tarefas. */
export const taskMenuItemClass = 'app-menu-item text-left';

export const taskMenuItemSelectedClass = 'app-menu-item-active';

/** Status neutro (To Do / padrão) em pills e badges. */
export const taskStatusNeutralClass =
  'border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))] text-[var(--leve-header-text-muted)]';

export const taskTypeDefaultStripeClass =
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_22%,var(--leve-neu-bg))]';

export const taskTypeDefaultBadgeClass =
  'badge badge-sm border-0 bg-[color-mix(in_srgb,var(--leve-neu-dark)_18%,var(--leve-neu-bg))] text-[var(--leve-header-text-muted)]';

/** Bloco mono compacto (prévia de teste, logs). */
export const taskMonoInsetClass = cn(
  'leve-neu-surface-inset rounded-[var(--leve-header-radius)] p-xs font-mono text-xs',
  'text-[var(--leve-header-text-muted)]'
);

export const taskNeuTrackClass = 'workspace-stat-neu-track';

export const taskNeuTrackFillMutedClass =
  'h-full shrink-0 rounded-r-full bg-[color-mix(in_srgb,var(--leve-neu-dark)_18%,var(--leve-neu-bg))]';

/** Chip de ferramenta não selecionado. */
export const taskToolChipIdleClass =
  'leve-neu-surface-inset border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] text-base-content hover:border-primary/30 hover:shadow-[var(--leve-neu-hover)]';

export const taskSegmentedControlClass = cn(
  'leve-neu-surface-inset flex w-full gap-1 rounded-full p-1'
);

export const taskSegmentedOptionIdleClass = cn(
  'inline-flex flex-1 items-center justify-center rounded-full px-2 py-1.5',
  'font-sans text-xs font-medium text-[var(--leve-header-text-muted)] transition-colors',
  'hover:text-[var(--leve-header-text)]'
);

export const taskSegmentedOptionActiveClass = cn(
  'inline-flex flex-1 items-center justify-center rounded-full px-2 py-1.5',
  'font-sans text-xs font-semibold text-white',
  'bg-[var(--leve-header-accent)] shadow-[2px_2px_6px_rgba(252,76,2,0.2)]'
);

export const taskCardSelectedSurfaceClass =
  'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--leve-neu-bg))] shadow-md ring-2 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]';

export const taskCardIdleSurfaceClass =
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_4%,var(--leve-neu-bg))] hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] hover:shadow-[var(--leve-neu-hover)]';

export const taskNeuBorderDividerClass = 'border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';
