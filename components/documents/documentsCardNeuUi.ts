import { cn } from '../../utils/cn';

/**
 * Cards da lista de documentos — paleta clara (#EBE6DE / #F2EEE8).
 * Relevo via `.documents-view-scope` em index.css (sombras literais).
 */
export const documentsCardListPanelClass = cn(
  'documents-card-list-panel documents-neu-list-track',
  'rounded-[var(--leve-header-radius)] p-1 sm:p-1.5'
);

export const documentsCardClass = cn(
  'documents-card documents-neu-card rounded-[var(--leve-header-radius)] p-3 transition-[box-shadow] duration-200 sm:p-3.5'
);

export const documentsCardTitleClass = cn(
  'line-clamp-2 border-b border-[#DED7CD] pb-2',
  'font-heading text-sm font-bold leading-snug text-[#401C31] sm:text-base'
);

export const documentsCardMetaClass = 'mt-1.5 text-[11px] leading-relaxed text-[#6B5E5E]';

export const documentsCardActionsClass = cn(
  'documents-card-actions mt-2.5 border-t border-[#DED7CD] pt-2.5'
);

/** Grade 2×3 (mobile) / 4+2 (desktop) — alinhamento uniforme dos botões. */
export const documentsCardActionsGridClass = cn(
  documentsCardActionsClass,
  'grid grid-cols-2 gap-1.5 sm:grid-cols-4'
);

const documentsActionBtnBase = cn(
  'documents-card-action-btn inline-flex w-full min-h-9 items-center justify-center gap-1',
  'px-3 py-1.5 font-sans text-xs font-semibold sm:min-h-[2.25rem]',
  '[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0',
  'rounded-full border transition-[box-shadow,color,background-color,transform] duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_28%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

/** Ver, Preview, Editar — chip elevado. */
export const documentsActionOutlineClass = cn(
  documentsActionBtnBase,
  'documents-card-action-outline documents-neu-chip',
  'border-[#DED7CD] bg-[#F2EEE8] text-[#401C31]',
  'hover:text-[#FF5C1B]'
);

/** Analisar, Gerar — primário laranja elevado. */
export const documentsActionPrimaryClass = cn(
  documentsActionBtnBase,
  'documents-card-action-primary documents-neu-btn-primary',
  'border-[color-mix(in_srgb,#FF5C1B_45%,transparent)] bg-[#FF5C1B] text-[#FFFFFF]',
  'hover:brightness-105 disabled:opacity-50'
);

export const documentsActionRemoveClass = cn(
  documentsActionOutlineClass,
  'documents-card-action-remove text-error/80'
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

/** Tags de categoria — chips elevados. */
export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'documents-neu-chip inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'documents-neu-chip inline-flex rounded-full border border-[color-mix(in_srgb,#10b981_35%,transparent)]',
  'bg-[color-mix(in_srgb,#10b981_10%,#F7F4F0)] px-2 py-0.5 text-[10px] font-semibold text-[#401C31]'
);
