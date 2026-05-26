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
  'task-card-shell px-2 py-2 transition-[box-shadow] duration-200 sm:px-3 sm:py-2';

/** Plus Jakarta Sans + tracking do tema (identidade tipográfica do app). */
export const taskCardTypography = 'font-sans tracking-[var(--letter-spacing)]';

/** Título principal / seção em card ou modal de tarefa. */
export const taskCardTitleClass =
  'task-card-title text-xs leading-snug sm:text-sm sm:leading-tight';

export const taskCardMutedClass = 'task-card-muted';

export const taskCardFieldLabelClass = 'task-card-field-label';

export const taskCardSectionTitleClass = 'task-card-section-title flex items-center gap-2';

export const taskModalSectionClass = 'leve-neu-surface task-modal-section';

export const taskModalSectionAccentClass = 'task-modal-section-accent leve-neu-surface';

export const taskUiTagClass = 'task-ui-tag';

export const taskUiTagInfoClass = 'task-ui-tag-info';

export const taskUiTagSuccessClass = 'task-ui-tag-success';

export const taskToolbarPillGroupClass = 'task-toolbar-pill-group';

/** Borda + raio padrão para painéis compactos (filtros, colapsáveis, anexos). */
export const taskPanelBorderClass = 'leve-neu-surface-inset rounded-[var(--leve-header-radius)]';

/** Select/input compacto em modais de tarefa. */
export const taskSelectControlClass = 'app-select';

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

const taskCardActionChipBase = [
  'btn-task-format leve-neu-pill inline-flex h-6 max-h-6 min-h-6 w-full min-w-0 items-center justify-center gap-0.5',
  taskCardButtonShape,
  taskCardButtonTypography,
  'transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2',
].join(' ');

export const taskCardActionChipCta = `${taskCardActionChipBase} text-[var(--leve-header-text)] hover:text-[var(--leve-header-accent)] focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)]`;

export const taskCardActionChipBusy =
  'ring-1 ring-[color-mix(in_srgb,var(--leve-header-accent)_28%,transparent)]';

export const taskCardTestStatusChipLayout = [
  'leve-neu-pill h-6 max-h-6 min-h-6 min-w-0 w-full justify-center gap-0.5',
  taskCardButtonShape,
  taskCardButtonTypography,
].join(' ');

/** Largura fixa do chevron + contador de subtarefas (alinha metadados entre cards). */
export const taskCardSubtreeExpandSlotClass =
  'leve-neu-pill inline-flex shrink-0 items-center justify-center gap-0.5 px-1.5 min-h-[44px] min-w-[44px] max-md:px-2 sm:min-h-8 sm:min-w-[3.25rem]';
