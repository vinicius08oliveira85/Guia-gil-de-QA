import { cn } from '../../utils/cn';
import {
  appNeuActionBtnActiveClass,
  appNeuActionBtnClass,
  appNeuActionTrackWrapClass,
} from '../common/workspaceChromeActionUi';

/**
 * Cards da lista de documentos — paleta CLARA via tokens do escopo `.documents-view-scope`
 * (LandingPage / Jira x Solus). Relevo/cores resolvidos pelos `--leve-neu-*` / `--leve-header-*`.
 */
export const documentsCardListPanelClass = cn(
  'documents-card-list-panel documents-neu-list-track',
  'rounded-[var(--leve-header-radius)] p-1 sm:p-1.5'
);

const documentsCardRaisedShadow = 'shadow-[var(--leve-neu-raised)]';

export const documentsCardClass = cn(
  'documents-card documents-neu-card documents-card-neu-raised leve-neu-surface',
  'rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,var(--leve-neu-dark)_70%,transparent)]',
  'bg-[color-mix(in_srgb,var(--leve-neu-light)_60%,var(--leve-neu-bg))] p-3 transition-[box-shadow,border-color] duration-200 sm:p-3.5',
  documentsCardRaisedShadow,
  'hover:shadow-[var(--leve-neu-hover)]',
  'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_28%,var(--leve-neu-dark))]'
);

export const documentsCardTitleClass = cn(
  'documents-card-title line-clamp-2 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_38%,transparent)] pb-2',
  'font-heading text-sm font-bold leading-snug text-[var(--leve-header-text)] sm:text-base'
);

export const documentsCardMetaClass =
  'documents-card-meta mt-1.5 text-[11px] leading-relaxed text-[var(--leve-header-text-muted)]';

export const documentsCardActionsClass = cn(
  'documents-card-actions mt-2.5 border-t border-[color-mix(in_srgb,var(--leve-neu-light)_38%,transparent)] pt-2.5'
);

/** Grade 2×3 (mobile) / 4+2 (desktop) — trilho inset + pills (modelo Filtrar/Exportar). */
export const documentsCardActionsGridClass = cn(
  documentsCardActionsClass,
  appNeuActionTrackWrapClass,
  'grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-4'
);

const documentsActionBtnBase = cn(
  'documents-card-action-btn w-full justify-center px-3 py-1.5 text-xs sm:min-h-[2.25rem] sm:text-xs',
  '[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0'
);

/** Ver, Preview, Editar — pill elevado. */
export const documentsActionOutlineClass = cn(
  documentsActionBtnBase,
  'documents-card-action-outline documents-neu-chip',
  appNeuActionBtnClass
);

/** Analisar, Gerar — pill ativo laranja. */
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
    'documents-category-badge--requisitos border-[color-mix(in_srgb,#e65100_35%,transparent)] bg-[color-mix(in_srgb,#e65100_12%,var(--leve-neu-bg))] text-[#b3450b]',
  testes:
    'border-[color-mix(in_srgb,#10b981_35%,transparent)] bg-[color-mix(in_srgb,#10b981_12%,var(--leve-neu-bg))] text-[var(--leve-header-text)]',
  arquitetura:
    'border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_10%,var(--leve-neu-bg))] text-[var(--leve-header-text)]',
  outros:
    'border-[color-mix(in_srgb,var(--leve-neu-light)_40%,transparent)] bg-[color-mix(in_srgb,var(--leve-neu-dark)_14%,var(--leve-neu-bg))] text-[var(--leve-header-text-muted)]',
};

/** Tags de categoria — chips elevados. */
export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'documents-neu-chip inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'documents-neu-chip inline-flex rounded-full border border-[color-mix(in_srgb,#10b981_35%,transparent)]',
  'bg-[color-mix(in_srgb,#10b981_10%,var(--leve-neu-bg))] px-2 py-0.5 text-[10px] font-semibold text-[var(--leve-header-text)]'
);
