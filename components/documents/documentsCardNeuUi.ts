import { cn } from '../../utils/cn';

/**
 * Paleta neumórfica clara — cards da lista de documentos (somente cards e ações).
 * #EBE6DE página · #F2EEE8 card · #E5DFD5 rebaixado · #401C31 texto · #6B5E5E secundário
 */
const dcRaised =
  'shadow-[5px_5px_12px_color-mix(in_srgb,#DED7CD_55%,transparent),-3px_-3px_8px_color-mix(in_srgb,#FFFFFF_20%,#F2EEE8)]';

const dcChipRaised =
  'shadow-[3px_3px_8px_color-mix(in_srgb,#DED7CD_45%,transparent),-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#F2EEE8)]';

/** Fundo da área da grade de cards. */
export const documentsCardListPanelClass = cn(
  'documents-card-list-panel rounded-[var(--leve-header-radius)] p-1 sm:p-1.5',
  'bg-[#EBE6DE]'
);

export const documentsCardClass = cn(
  'documents-card rounded-[var(--leve-header-radius)] p-3 sm:p-3.5',
  'border border-[#DED7CD] bg-[#F2EEE8]',
  dcRaised,
  'transition-[box-shadow] duration-200'
);

export const documentsCardTitleClass = cn(
  'line-clamp-2 border-b border-[#DED7CD] pb-2',
  'font-heading text-sm font-bold leading-snug text-[#401C31] sm:text-base'
);

export const documentsCardMetaClass = 'mt-1.5 text-[11px] leading-relaxed text-[#6B5E5E]';

export const documentsCardActionsClass = cn(
  'mt-2.5 flex flex-wrap gap-1.5 border-t border-[#DED7CD] pt-2.5'
);

const documentsActionBtnBase = cn(
  'min-h-9 gap-1 px-3 py-1.5 text-xs font-semibold sm:min-h-0',
  '[&_svg]:h-3.5 [&_svg]:w-3.5',
  'border border-[#DED7CD] transition-[box-shadow,color,background-color] duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_28%,transparent)]'
);

/** Ver, Preview, Editar — chip elevado no card. */
export const documentsActionOutlineClass = cn(
  documentsActionBtnBase,
  'documents-card-action-outline',
  'bg-[#F2EEE8] text-[#401C31]',
  dcChipRaised,
  'hover:bg-[color-mix(in_srgb,#E8E2DA_50%,#F2EEE8)] hover:text-[#FF5C1B]',
  'active:shadow-[inset_2px_2px_6px_color-mix(in_srgb,#DED7CD_48%,transparent),inset_-1px_-1px_4px_color-mix(in_srgb,#FFFFFF_14%,#F2EEE8)]'
);

/** Analisar, Gerar — primário laranja. */
export const documentsActionPrimaryClass = cn(
  documentsActionBtnBase,
  'documents-card-action-primary',
  'border-[color-mix(in_srgb,#FF5C1B_45%,transparent)] bg-[#FF5C1B] text-[#FFFFFF]',
  'shadow-[3px_3px_8px_color-mix(in_srgb,#DED7CD_50%,transparent),-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#F2EEE8)]',
  'hover:brightness-105',
  'disabled:opacity-50'
);

export const documentsActionRemoveClass = cn(
  documentsActionOutlineClass,
  'text-error hover:border-error/35 hover:text-error'
);

export type DocumentCategoryId = 'requisitos' | 'testes' | 'arquitetura' | 'outros';

const documentsCategoryBadgeMap: Record<DocumentCategoryId, string> = {
  requisitos: 'border-[#938A81] bg-[#F7F4F0] text-[#401C31]',
  testes:
    'border-[color-mix(in_srgb,#10b981_35%,transparent)] bg-[color-mix(in_srgb,#10b981_12%,#F7F4F0)] text-[#401C31]',
  arquitetura:
    'border-[color-mix(in_srgb,#FF5C1B_30%,transparent)] bg-[color-mix(in_srgb,#FF5C1B_10%,#F7F4F0)] text-[#401C31]',
  outros: 'border-[#938A81] bg-[#F7F4F0] text-[#938A81]',
};

export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'inline-flex rounded-full border border-[color-mix(in_srgb,#10b981_35%,transparent)]',
  'bg-[color-mix(in_srgb,#10b981_10%,#F7F4F0)] px-2 py-0.5 text-[10px] font-semibold text-[#401C31]'
);
