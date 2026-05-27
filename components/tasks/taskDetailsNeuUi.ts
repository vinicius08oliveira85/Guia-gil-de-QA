import { cn } from '../../utils/cn';

/**
 * Paleta neumórfica clara — modal de detalhe da tarefa (Resumo, BDD, Testes…).
 * #EBE6DE página · #F2EEE8 card · #E5DFD5 rebaixado · #401C31 texto · #6B5E5E secundário
 */
const tdRaised =
  'shadow-[5px_5px_12px_color-mix(in_srgb,#DED7CD_55%,transparent),-3px_-3px_8px_color-mix(in_srgb,#FFFFFF_20%,#F2EEE8)]';

const tdInset =
  'shadow-[inset_3px_3px_8px_color-mix(in_srgb,#DED7CD_50%,transparent),inset_-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#E5DFD5)]';

/** Shell do painel do modal (escopo visual da listagem de detalhes). */
export const taskDetailsModalShellClass = cn(
  'task-details-neu-modal leve-modal-neu-shell font-sans',
  'border border-[#DED7CD] bg-[#EBE6DE]',
  tdRaised
);

export const taskDetailsModalHeaderClass = cn(
  'leve-modal-neu-header border-[#DED7CD] bg-[#F2EEE8] text-[#401C31]'
);

export const taskDetailsModalBodyClass = cn(
  'bg-[#EBE6DE] text-[#401C31]',
  'scrollbar-thumb-[color-mix(in_srgb,#FF5C1B_35%,transparent)]',
  'hover:scrollbar-thumb-[color-mix(in_srgb,#FF5C1B_50%,transparent)]'
);

export const taskDetailsModalTitleClass = 'text-[#401C31]';

export const taskDetailsModalCloseClass = cn(
  'leve-modal-neu-close border border-[#DED7CD] bg-[#F2EEE8] text-[#6B5E5E]',
  'hover:text-[#FF5C1B]'
);
