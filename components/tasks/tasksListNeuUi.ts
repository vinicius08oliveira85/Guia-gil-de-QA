import { cn } from '../../utils/cn';
import {
  taskCardBadgePillShape,
  taskCardBadgePillTypography,
  taskCardBadgeTechShape,
  taskCardBadgeTechTypography,
  taskCardButtonTypography,
  taskCardTypography,
} from './taskActionLayout';

export type TasksListTypeBadgeVariant = 'info' | 'error' | 'success' | 'primary' | 'neutral';

/** Sombras da lista — derivadas de tokens definidos em `.tasks-list-panel` (index.css). */
const tlRaised = 'shadow-[var(--task-list-raised)]';
const tlInset = 'shadow-[var(--task-list-inset)]';
const tlChipRaised = 'shadow-[var(--task-list-chip-raised)]';

const listChipBase = cn(
  'btn-task-format inline-flex min-h-6 max-h-6 items-center justify-center gap-0.5',
  'rounded-full px-2 py-0',
  taskCardButtonTypography,
  'disabled:pointer-events-none disabled:opacity-50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/28'
);

/** Área rolável da lista (fundo base-200). */
export const tasksListPanelClass = cn(
  'tasks-list-panel min-w-0 rounded-box p-1 sm:p-1.5',
  'bg-base-200 max-md:p-0.5'
);

/** Shell do card na listagem. */
export const tasksListCardShellClass = cn(
  'task-card-shell task-list-card-shell',
  'px-1.5 py-2 transition-[box-shadow,border-color] duration-200 max-sm:min-w-0 sm:px-3 sm:py-2',
  'max-md:px-1.5 max-md:py-1',
  'rounded-box border border-base-300 bg-base-100',
  tlRaised
);

export const tasksListCardHoverClass =
  'hover:border-primary/28 hover:brightness-[1.01]';

export const tasksListCardSelectedClass = cn(
  'ring-2 ring-primary/42',
  'shadow-[var(--leve-neu-hover)]'
);

export const tasksListCardOpenModalClass = cn(
  'cursor-pointer hover:bg-base-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base-200'
);

export const tasksListMetadataStripClass = cn(
  'task-card-metadata-strip [scrollbar-width:thin]',
  'rounded-field border border-base-300 bg-base-300 text-base-content/72',
  tlInset
);

export const tasksListCardTitleClass = 'task-card-title font-bold text-base-content';

export const tasksListCardIdLinkClass = cn(
  'text-base-content hover:text-primary focus-visible:ring-primary/35'
);

export const tasksListCardMutedClass = 'text-base-content/72';

export const tasksListCardIconMutedClass = 'text-base-content/72';

/** Trilho inset que envolve subtarefas expandidas. */
export const tasksListSubtreeTrackClass = cn(
  'task-list-subtree-track',
  'rounded-box border border-base-300 bg-base-300 p-1 sm:p-1.5',
  tlInset
);

export const tasksListSubtreeBorderClass = 'border-base-300/85';

/** Card de subtarefa (nível > 0) — superfície rebaixada dentro do trilho. */
export const tasksListNestedCardShellClass = cn(
  'task-card-shell task-list-card-shell task-list-nested-card-shell',
  'px-1.5 py-2 transition-[box-shadow,border-color] duration-200 max-sm:min-w-0 sm:px-3 sm:py-2',
  'rounded-box border border-base-300 bg-base-300',
  tlInset
);

/** Chip elevado no card (ações, métricas). */
export const tasksListChipRaisedClass = cn(
  'task-list-neu-chip-raised',
  'rounded-selector border border-base-300 bg-base-100',
  tlChipRaised,
  'transition-[box-shadow,background-color,color] duration-200',
  'hover:bg-base-200',
  'active:shadow-[var(--task-list-chip-active)]'
);

/** Badge da faixa de metadados (tipo, status, risco, sprint…). */
export const tasksListMetadataBadgeClass = cn(
  'task-list-neu-badge badge-task-format shrink-0',
  'rounded-selector border border-base-300',
  tlChipRaised,
  'transition-[box-shadow,background-color,color] duration-200'
);

/** Tipo Jira (História, Bug, Tarefa, Epic) na listagem. */
export const tasksListTypeBadgeClass = (variant: TasksListTypeBadgeVariant) =>
  cn(
    tasksListMetadataBadgeClass,
    taskCardBadgePillShape,
    taskCardBadgePillTypography,
    `task-list-neu-badge--${variant}`
  );

/** Story points e chips técnicos compactos. */
export const tasksListTechBadgeClass = cn(
  tasksListMetadataBadgeClass,
  'task-list-neu-badge--tech',
  taskCardBadgeTechShape,
  taskCardBadgeTechTypography,
  'text-base-content'
);

/** Botão "Gerar Tudo" e chips de ação na listagem. */
export const tasksListActionChipCta = cn(
  listChipBase,
  'task-list-action-chip w-full min-w-0',
  tasksListChipRaisedClass,
  'text-base-content/72 hover:text-primary'
);

/** Layout do badge de status de teste no card (listagem). */
export const tasksListTestStatusChipLayout = cn(
  'inline-flex h-6 max-h-6 min-h-6 min-w-0 w-full justify-center gap-0.5',
  'rounded-selector px-2 py-0',
  taskCardTypography,
  'text-[10px] font-semibold leading-none',
  tasksListChipRaisedClass
);

export const tasksListTestStatusToneClass = {
  testar: 'text-base-content',
  testando: 'text-warning',
  pendente: 'text-error',
  teste_concluido: 'text-success',
  sem_testes: 'text-base-content/72',
} as const;

/** @deprecated Use `tasksListActionChipCta`. */
export const tasksListGerarTudoClass = tasksListActionChipCta;

/** Slot do chevron + contador (com subtarefas). */
export const tasksListSubtreeExpandSlotClass = cn(
  tasksListChipRaisedClass,
  'task-list-subtree-expand inline-flex shrink-0 items-center justify-center gap-0.5 rounded-box px-1.5',
  'min-h-9 min-w-9 max-sm:min-h-8 max-sm:min-w-[2.75rem] sm:min-h-8 sm:min-w-[3.25rem]'
);

/** Placeholder vazio do slot de subtarefas. */
export const tasksListSubtreeExpandPlaceholderClass = cn(
  'task-list-subtree-expand-placeholder inline-flex shrink-0 items-center justify-center gap-0.5 rounded-box px-1.5',
  'min-h-9 min-w-9 max-sm:min-h-8 max-sm:min-w-[2.75rem] sm:min-h-8 sm:min-w-[3.25rem]',
  'border border-base-300 bg-base-300',
  tlInset
);

export const tasksListIconHoverClass = 'hover:bg-base-200';

export const tasksListChipCountClass = cn(
  'rounded-selector bg-base-300/50 px-1.5 py-0.5',
  'text-[10px] tabular-nums text-base-content/72'
);
