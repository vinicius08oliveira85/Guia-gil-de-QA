import { cn } from '../../utils/cn';
import {
  appNeuActionBtnActiveClass,
  appNeuActionBtnClass,
  appNeuActionTrackWrapClass,
} from '../common/workspaceChromeActionUi';

/**
 * Cards da lista de documentos — tokens DaisyUI `leve` via `.documents-view-scope`.
 */
export const documentsCardListPanelClass = cn(
  'documents-card-list-panel documents-neu-list-track',
  'rounded-box p-1 sm:p-1.5'
);

const documentsCardRaisedShadow = 'shadow-[var(--leve-neu-raised)]';

export const documentsCardClass = cn(
  'documents-card documents-neu-card documents-card-neu-raised leve-neu-surface',
  'rounded-box border border-base-300/70 bg-base-200/60 p-3 transition-[box-shadow,border-color] duration-200 sm:p-3.5',
  documentsCardRaisedShadow,
  'hover:shadow-[var(--leve-neu-hover)]',
  'hover:border-primary/28'
);

export const documentsCardTitleClass = cn(
  'documents-card-title line-clamp-2 border-b border-base-300/38 pb-2',
  'font-heading text-sm font-bold leading-snug text-base-content sm:text-base'
);

export const documentsCardMetaClass =
  'documents-card-meta mt-1.5 text-[11px] leading-relaxed text-base-content/72';

export const documentsCardActionsClass = cn(
  'documents-card-actions mt-2.5 border-t border-base-300/38 pt-2.5'
);

/** Grade de 3 ações (Preview, Gerar, Remover) — trilho inset + pills. */
export const documentsCardActionsGridClass = cn(
  documentsCardActionsClass,
  appNeuActionTrackWrapClass,
  'grid grid-cols-3 gap-1.5 p-1.5'
);

const documentsActionBtnBase = cn(
  'documents-card-action-btn w-full justify-center px-3 py-1.5 text-xs sm:min-h-[2.25rem] sm:text-xs',
  '[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0'
);

export const documentsActionOutlineClass = cn(
  documentsActionBtnBase,
  'documents-card-action-outline documents-neu-chip',
  appNeuActionBtnClass
);

export const documentsActionPrimaryClass = cn(
  documentsActionBtnBase,
  'documents-card-action-primary documents-neu-btn-primary',
  appNeuActionBtnActiveClass
);

export const documentsActionRemoveClass = cn(
  documentsActionOutlineClass,
  'documents-card-action-remove text-error/80'
);

export type DocumentCategoryId = 'requisitos' | 'testes' | 'arquitetura' | 'outros';

const documentsCategoryBadgeMap: Record<DocumentCategoryId, string> = {
  requisitos:
    'documents-category-badge--requisitos border-primary/35 bg-primary/12 text-primary',
  testes: 'border-success/35 bg-success/12 text-success',
  arquitetura: 'border-primary/30 bg-primary/10 text-primary',
  outros: 'border-base-300/40 bg-base-300/25 text-base-content/72',
};

export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'documents-neu-chip inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'documents-neu-chip inline-flex rounded-full border border-success/35',
  'bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success'
);
