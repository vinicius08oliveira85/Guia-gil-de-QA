import { cn } from '../../utils/cn';
import {
  dashboardInsightCardClass,
  leveViewFilterPillClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
  leveViewSearchInputClass,
  leveSettingsInputClass,
  leveTaskModalTextareaClass,
} from '../common/projectCardUi';
import { neuBrandBorderClass, neuCardInsetClass, neuDividerClass } from '../common/neuUi';

export {
  leveViewPageHeaderShellClass as documentsPageHeaderClass,
  leveViewPageTitleClass as documentsPageTitleClass,
  leveViewPageJiraBadgeClass as documentsJiraBadgeClass,
  leveViewPageSubtitleClass as documentsPageSubtitleClass,
  leveViewPageMutedClass as documentsPageMutedClass,
  leveViewPagePanelClass as documentsFiltersPanelClass,
} from '../common/projectCardUi';

/** Eyebrow laranja (Resumo, Contexto de IA, seções de modal). */
export const documentsEyebrowClass = cn(
  'inline-block border-b border-[var(--leve-header-accent)] pb-1',
  'font-sans text-[10px] font-extrabold uppercase tracking-wider text-[var(--leve-header-accent)] sm:text-[11px]'
);

/** Painel principal de seção (contexto IA, etc.). */
export const documentsSectionShellClass = cn('leve-neu-surface font-sans p-3 sm:p-3.5');

export const documentsSectionHeaderDividerClass =
  'border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]';

export const documentsSectionHeaderClass = cn(documentsSectionHeaderDividerClass, 'pb-2');

export const documentsSectionTitleClass =
  'mt-1 font-sans text-base font-bold text-[var(--leve-header-text)] sm:text-lg';

/** Faixa de resumo (contagens) — inset no painel de filtros. */
export const documentsSummaryStripClass = cn(
  'leve-neu-surface-inset mb-4 flex flex-wrap items-center gap-x-4 gap-y-2',
  'rounded-[var(--leve-header-radius)] px-3 py-2.5 sm:px-3.5'
);

export const documentsSummaryStatsClass =
  'flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-[var(--leve-header-text-muted)]';

export const documentsSummaryStatStrongClass = 'text-[var(--leve-header-text)]';

export const documentsSummaryStatIconAccentClass = 'h-4 w-4 text-[var(--leve-header-accent)]';

export const documentsSummaryStatIconSuccessClass = 'h-4 w-4 text-success';

/** Alertas inset (processado / pendente). */
export const documentsAlertSuccessClass = cn(
  'leve-neu-surface-inset flex items-start gap-2 rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#10b981_28%,transparent)] px-3 py-2'
);

export const documentsAlertInfoClass = cn(
  'leve-neu-surface-inset flex items-start gap-2 rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,var(--leve-header-accent)_28%,transparent)] px-3 py-2'
);

export const documentsBodyTextClass =
  'font-sans text-sm font-medium leading-snug text-[var(--leve-header-text)]';

export const documentsMutedTextClass = 'font-sans text-xs text-[var(--leve-header-text-muted)]';

export const documentsProgressTrackClass = cn(
  'relative h-2 min-w-0 flex-1 overflow-hidden rounded-full',
  'bg-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)] shadow-[var(--leve-neu-inset)]'
);

export const documentsProgressPercentClass =
  'shrink-0 font-sans text-xs font-bold tabular-nums text-[var(--leve-header-text-muted)]';

/** CTA upload / reprocessar. */
export const documentsPrimaryBtnClass = cn(
  leveViewPrimaryBtnClass,
  'min-h-0 gap-1.5 px-4 py-2 text-sm sm:min-h-0'
);

export const documentsOutlineBtnClass = leveViewOutlineBtnClass;

export const documentsSpecRemoveBtnClass = cn(
  documentsOutlineBtnClass,
  'gap-1.5 px-4 text-error hover:border-error/40 hover:bg-error/5'
);

/** Busca e filtros. */
export const documentsSearchInputClass = cn(
  leveViewSearchInputClass,
  'min-w-[200px] flex-1'
);

export const documentsFilterPillClass = leveViewFilterPillClass;

export const documentsFilterRowClass =
  'flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3';

export const documentsFilterPillsStripClass = cn(
  'leve-neu-surface-inset inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full p-1.5'
);

export const documentsFilterPillsGroupClass = cn(
  documentsFilterPillsStripClass,
  'sm:gap-2'
);

/** Card de documento na grade. */
export const documentsCardClass = cn(dashboardInsightCardClass, 'p-3 sm:p-3.5');

export const documentsCardTitleClass = cn(
  'line-clamp-2 border-b pb-2 font-heading text-sm font-bold leading-snug sm:text-base',
  neuBrandBorderClass,
  'text-[var(--leve-header-text)]'
);

export const documentsCardMetaClass =
  'mt-1.5 text-[11px] leading-relaxed text-[var(--leve-header-text-muted)]';

export const documentsCardActionsClass = cn(
  'mt-2.5 flex flex-wrap gap-1.5 border-t pt-2.5',
  neuBrandBorderClass
);

export const documentsActionOutlineClass = cn(
  documentsOutlineBtnClass,
  'min-h-9 gap-1 px-3 py-1.5 text-xs sm:min-h-0 [&_svg]:h-3.5 [&_svg]:w-3.5'
);

export const documentsActionPrimaryClass = cn(
  documentsPrimaryBtnClass,
  'min-h-9 gap-1 px-3 py-1.5 text-xs sm:min-h-0 [&_svg]:h-3.5 [&_svg]:w-3.5'
);

export const documentsActionRemoveClass = cn(
  documentsActionOutlineClass,
  'text-error hover:border-error/40 hover:bg-error/5'
);

export type DocumentCategoryId = 'requisitos' | 'testes' | 'arquitetura' | 'outros';

const documentsCategoryBadgeMap: Record<DocumentCategoryId, string> = {
  requisitos:
    'border-[color-mix(in_srgb,var(--leve-header-text)_22%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-text)_8%,var(--leve-neu-bg))] text-[var(--leve-header-text)]',
  testes:
    'border-[color-mix(in_srgb,#10b981_28%,transparent)] bg-[color-mix(in_srgb,#10b981_10%,transparent)] text-success',
  arquitetura:
    'border-[color-mix(in_srgb,var(--leve-header-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_10%,transparent)] text-[var(--leve-header-accent)]',
  outros: cn(
    'border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]',
    'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))] text-[var(--leve-header-text-muted)]'
  ),
};

export const documentsCategoryBadgeClass = (category: DocumentCategoryId) =>
  cn(
    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
    documentsCategoryBadgeMap[category] ?? documentsCategoryBadgeMap.outros
  );

export const documentsAnalysisBadgeClass = cn(
  'inline-flex rounded-full border border-[color-mix(in_srgb,#10b981_28%,transparent)]',
  'bg-[color-mix(in_srgb,#10b981_8%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-success'
);

/** Modais (preview, análise, edição). */
export const documentsModalSectionLabelClass = documentsEyebrowClass;

export const documentsModalMetaClass = 'text-sm text-[var(--leve-header-text-muted)]';

export const documentsModalPreClass =
  'whitespace-pre-wrap font-mono text-sm text-[var(--leve-header-text)]';

export const documentsModalPreviewInsetClass = cn(
  neuCardInsetClass,
  'max-h-96 overflow-y-auto rounded-[var(--leve-header-radius)] p-4'
);

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-[var(--leve-header-radius)] border',
  neuBrandBorderClass
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-[var(--leve-header-radius)] border',
  neuBrandBorderClass
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-[var(--leve-header-text)]';

export const documentsModalInputClass = leveSettingsInputClass;

export const documentsModalTextareaClass = cn(
  leveTaskModalTextareaClass,
  'min-h-[15rem] w-full resize-y'
);

export const documentsModalFooterClass = cn(
  'flex justify-end gap-2 border-t pt-4',
  neuDividerClass
);

export const documentsModalFooterCancelClass = cn(documentsOutlineBtnClass, 'min-h-10 px-5');

export const documentsModalFooterSaveClass = cn(documentsPrimaryBtnClass, 'min-h-10 px-6');

/** Corpo HTML da análise IA. */
export const documentsAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  neuCardInsetClass,
  'rounded-[var(--leve-header-radius)] px-4 py-5 shadow-[var(--leve-neu-inset)] sm:px-6 sm:py-6',
  'text-[var(--leve-header-text)]',
  'prose-headings:font-heading prose-headings:text-[var(--leve-header-text)] prose-headings:scroll-mt-4',
  'prose-h2:border-b prose-h2:border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] prose-h2:pb-2 prose-h2:mb-3',
  'prose-h3:border-b prose-h3:border-[color-mix(in_srgb,var(--leve-neu-light)_25%,transparent)] prose-h3:pb-1.5 prose-h3:mb-2',
  'prose-p:mb-3 prose-p:leading-relaxed prose-p:text-[color-mix(in_srgb,var(--leve-header-text)_90%,transparent)]',
  'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3 prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3',
  'prose-li:my-1.5 prose-strong:font-bold prose-strong:text-[var(--leve-header-text)]',
  '[&_a]:text-[var(--leve-header-accent)] [&_a]:underline-offset-2'
);
