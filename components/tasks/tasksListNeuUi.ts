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

/**
 * Paleta neumórfica clara — cards da lista de tarefas (mesma base das regras de negócio).
 * #EBE6DE página · #F2EEE8 card · #E5DFD5 rebaixado · #401C31 texto · #6B5E5E secundário
 */
const tlRaised =
  'shadow-[5px_5px_12px_color-mix(in_srgb,#DED7CD_55%,transparent),-3px_-3px_8px_color-mix(in_srgb,#FFFFFF_20%,#F2EEE8)]';

const tlInset =
  'shadow-[inset_3px_3px_8px_color-mix(in_srgb,#DED7CD_50%,transparent),inset_-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#E5DFD5)]';

/** Relevo suave de chip no card (#F2EEE8) — sem highlight branco forte. */
const tlChipRaised =
  'shadow-[2px_2px_6px_color-mix(in_srgb,#DED7CD_42%,transparent),-1px_-1px_4px_color-mix(in_srgb,#FFFFFF_14%,#F2EEE8)]';

const listChipBase = cn(
  'btn-task-format inline-flex min-h-6 max-h-6 items-center justify-center gap-0.5',
  'rounded-full px-2 py-0',
  taskCardButtonTypography,
  'disabled:pointer-events-none disabled:opacity-50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_28%,transparent)]'
);

/** Área rolável da lista (fundo da página nos cards). */
export const tasksListPanelClass = cn(
  'tasks-list-panel min-w-0 rounded-[var(--leve-header-radius)] p-1 sm:p-1.5',
  'bg-[#EBE6DE]'
);

/** Shell do card na listagem — substitui o visual escuro de `.task-card-shell`. */
export const tasksListCardShellClass = cn(
  'task-card-shell task-list-card-shell',
  'px-1.5 py-2 transition-[box-shadow,border-color] duration-200 max-sm:min-w-0 sm:px-3 sm:py-2',
  'border border-[#DED7CD] bg-[#F2EEE8]',
  tlRaised
);

export const tasksListCardHoverClass =
  'hover:border-[color-mix(in_srgb,#FF5C1B_28%,transparent)] hover:brightness-[1.01]';

export const tasksListCardSelectedClass = cn(
  'ring-2 ring-[color-mix(in_srgb,#FF5C1B_42%,transparent)]',
  'shadow-[6px_6px_14px_color-mix(in_srgb,#DED7CD_65%,transparent),-3px_-3px_9px_color-mix(in_srgb,#FFFFFF_22%,#F2EEE8)]'
);

export const tasksListCardOpenModalClass = cn(
  'cursor-pointer hover:bg-[color-mix(in_srgb,#E8E2DA_55%,#F2EEE8)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_40%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EBE6DE]'
);

export const tasksListMetadataStripClass = cn(
  'task-card-metadata-strip [scrollbar-width:thin]',
  'border border-[#DED7CD] bg-[#E5DFD5] text-[#6B5E5E]',
  tlInset
);

export const tasksListCardTitleClass =
  'task-card-title font-bold text-[#401C31]';

export const tasksListCardIdLinkClass = cn(
  'text-[#401C31] hover:text-[#FF5C1B] focus-visible:ring-[color-mix(in_srgb,#FF5C1B_35%,transparent)]'
);

export const tasksListCardMutedClass = 'text-[#6B5E5E]';

export const tasksListCardIconMutedClass = 'text-[#6B5E5E]';

/** Trilho inset que envolve subtarefas expandidas. */
export const tasksListSubtreeTrackClass = cn(
  'task-list-subtree-track',
  'rounded-[var(--leve-header-radius)] border border-[#DED7CD] bg-[#E5DFD5] p-1 sm:p-1.5',
  tlInset
);

export const tasksListSubtreeBorderClass =
  'border-[color-mix(in_srgb,#DED7CD_85%,transparent)]';

/** Card de subtarefa (nível > 0) — superfície rebaixada dentro do trilho. */
export const tasksListNestedCardShellClass = cn(
  'task-card-shell task-list-card-shell task-list-nested-card-shell',
  'px-1.5 py-2 transition-[box-shadow,border-color] duration-200 max-sm:min-w-0 sm:px-3 sm:py-2',
  'border border-[#DED7CD] bg-[#E5DFD5]',
  tlInset
);

/** Chip elevado no card claro (ações, métricas). */
export const tasksListChipRaisedClass = cn(
  'task-list-neu-chip-raised',
  'border border-[#DED7CD] bg-[#F2EEE8]',
  tlChipRaised,
  'transition-[box-shadow,background-color,color] duration-200',
  'hover:bg-[color-mix(in_srgb,#E8E2DA_45%,#F2EEE8)]',
  'active:shadow-[inset_2px_2px_6px_color-mix(in_srgb,#DED7CD_48%,transparent),inset_-1px_-1px_4px_color-mix(in_srgb,#FFFFFF_12%,#F2EEE8)]'
);

/** Badge da faixa de metadados (tipo, status, risco, sprint…) — relevo raised. */
export const tasksListMetadataBadgeClass = cn(
  'task-list-neu-badge badge-task-format shrink-0',
  'border border-[#DED7CD]',
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
  'text-[#401C31]'
);

/** Botão "Gerar Tudo" e chips de ação na listagem. */
export const tasksListActionChipCta = cn(
  listChipBase,
  'task-list-action-chip w-full min-w-0',
  tasksListChipRaisedClass,
  'text-[#6B5E5E] hover:text-[#FF5C1B]'
);

/** Layout do badge de status de teste no card (listagem). */
export const tasksListTestStatusChipLayout = cn(
  'inline-flex h-6 max-h-6 min-h-6 min-w-0 w-full justify-center gap-0.5',
  'rounded-full px-2 py-0',
  taskCardTypography,
  'text-[10px] font-semibold leading-none',
  tasksListChipRaisedClass
);

export const tasksListTestStatusToneClass = {
  testar: 'text-[#401C31]',
  testando: 'text-warning',
  pendente: 'text-error',
  teste_concluido: 'text-success',
  sem_testes: 'text-[#6B5E5E]',
} as const;

/** @deprecated Use `tasksListActionChipCta`. */
export const tasksListGerarTudoClass = tasksListActionChipCta;

/** Slot do chevron + contador (com subtarefas). */
export const tasksListSubtreeExpandSlotClass = cn(
  tasksListChipRaisedClass,
  'task-list-subtree-expand inline-flex shrink-0 items-center justify-center gap-0.5 rounded-[var(--leve-header-radius)] px-1.5',
  'min-h-9 min-w-9 max-sm:min-h-8 max-sm:min-w-[2.75rem] sm:min-h-8 sm:min-w-[3.25rem]'
);

/** Placeholder vazio do slot de subtarefas (rebaixado, sem branco). */
export const tasksListSubtreeExpandPlaceholderClass = cn(
  'task-list-subtree-expand-placeholder inline-flex shrink-0 items-center justify-center gap-0.5 rounded-[var(--leve-header-radius)] px-1.5',
  'min-h-9 min-w-9 max-sm:min-h-8 max-sm:min-w-[2.75rem] sm:min-h-8 sm:min-w-[3.25rem]',
  'border border-[#DED7CD] bg-[#E5DFD5]',
  tlInset
);

export const tasksListIconHoverClass =
  'hover:bg-[color-mix(in_srgb,#DED7CD_28%,#F2EEE8)]';

export const tasksListChipCountClass = cn(
  'rounded-full bg-[color-mix(in_srgb,#DED7CD_32%,#F2EEE8)] px-1.5 py-0.5',
  'text-[10px] tabular-nums text-[#6B5E5E]'
);
