import { cn } from '../../utils/cn';
import {
  neuFilterPillClass,
  neuInsetContentClass,
  neuSegmentedTrackClass,
  neuSurfaceClass,
  neuSurfaceInsetClass,
} from '../common/neuUi';

/** Escopo da aba Documentos — tokens em index.css (`.documents-view-scope`). */
export const documentsViewScopeClass = 'documents-view-scope';

export const documentsPageHeaderClass = cn(
  'documents-page-header mb-3 flex flex-col gap-4 font-sans sm:mb-4 sm:gap-5',
  'max-md:mb-2 max-md:gap-2'
);

export const documentsPageTitleClass =
  'font-sans text-2xl font-bold tracking-tight text-[#401C31] sm:text-[1.65rem]';

export const documentsPageSubtitleClass =
  'mt-1 font-sans text-sm leading-relaxed text-[#6B5E5E]';

export const documentsJiraBadgeClass = cn(
  'documents-neu-chip inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold text-[#FF5C1B]'
);

export const documentsPageMutedClass = 'font-sans text-sm text-[#6B5E5E]';

/** Painel de filtros / resumo — superfície elevada. */
export const documentsFiltersPanelClass = cn(
  'documents-neu-panel',
  neuSurfaceClass,
  'relative flex flex-col overflow-visible rounded-[var(--leve-header-radius)] p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const documentsEyebrowClass = cn(
  'inline-block border-b border-[#FF5C1B] pb-1',
  'font-sans text-[10px] font-extrabold uppercase tracking-wider text-[#FF5C1B] sm:text-[11px]'
);

/** Documento de especificação — card elevado. */
export const documentsSectionShellClass = cn(
  'documents-neu-section',
  neuSurfaceClass,
  'rounded-[var(--leve-header-radius)] p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const documentsSectionHeaderDividerClass =
  'border-b border-[color-mix(in_srgb,#DED7CD_55%,transparent)]';

export const documentsSectionHeaderClass = cn(documentsSectionHeaderDividerClass, 'pb-2');

export const documentsSectionTitleClass =
  'mt-1 font-sans text-base font-bold text-[#401C31] sm:text-lg';

/** Faixa de resumo — trilho inset. */
export const documentsSummaryStripClass = cn(
  'documents-neu-summary-track',
  neuSurfaceInsetClass,
  'mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--leve-header-radius)] px-3 py-2.5 sm:px-3.5',
  'max-md:mb-2 max-md:gap-x-2 max-md:gap-y-1 max-md:px-2 max-md:py-1.5'
);

export const documentsSummaryStatsClass =
  'flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-[#6B5E5E]';

export const documentsSummaryStatStrongClass = 'font-semibold text-[#401C31]';

export const documentsSummaryStatIconAccentClass = 'h-4 w-4 text-[#FF5C1B]';

export const documentsSummaryStatIconSuccessClass = 'h-4 w-4 text-success';

export const documentsAlertSuccessClass = cn(
  'documents-neu-alert-success',
  neuSurfaceInsetClass,
  neuInsetContentClass,
  'flex items-start gap-2 rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,oklch(var(--su))_35%,#DED7CD)]',
  'bg-[color-mix(in_srgb,oklch(var(--su))_10%,#E5DFD5)]'
);

export const documentsAlertInfoClass = cn(
  'documents-neu-alert-info',
  neuSurfaceInsetClass,
  neuInsetContentClass,
  'flex items-start gap-2 rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#FF5C1B_30%,#DED7CD)]',
  'bg-[color-mix(in_srgb,#FF5C1B_8%,#E5DFD5)]'
);

export const documentsBodyTextClass = 'font-sans text-sm font-medium leading-snug text-[#401C31]';

export const documentsMutedTextClass = 'font-sans text-xs text-[#6B5E5E]';

export const documentsStrongTextClass = 'font-semibold text-[#401C31]';

export const documentsProgressTrackClass = cn(
  'documents-neu-progress-track',
  'relative h-2 min-w-0 flex-1 overflow-hidden rounded-full'
);

export const documentsProgressFillClass =
  'documents-neu-progress-fill h-full w-full rounded-full bg-success';

export const documentsProgressPercentClass =
  'shrink-0 font-sans text-xs font-bold tabular-nums text-[#6B5E5E]';

export const documentsPrimaryBtnClass = cn(
  'documents-neu-btn-primary inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 py-2',
  'font-sans text-sm font-bold max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:py-1.5 max-md:text-xs sm:min-h-9',
  'border border-[color-mix(in_srgb,#FF5C1B_45%,transparent)] bg-[#FF5C1B] text-[#FFFFFF]',
  'transition-[filter,transform] duration-150 hover:brightness-105',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_28%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsOutlineBtnClass = cn(
  'documents-neu-chip inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2',
  'font-sans text-sm font-semibold text-[#401C31]',
  'transition-[box-shadow,color] duration-200 hover:text-[#FF5C1B]'
);

export const documentsSpecRemoveBtnClass = cn(
  documentsOutlineBtnClass,
  'documents-neu-spec-remove text-error hover:text-error'
);

export const documentsSearchInputClass = cn(
  'documents-neu-search',
  'app-input h-11 w-full min-w-[200px] flex-1 rounded-full border-0 py-2 pl-10 pr-10 font-sans text-sm',
  'max-md:h-10 max-md:pl-9 max-md:pr-9 max-md:text-xs sm:h-10',
  'text-[#401C31] placeholder:text-[#6B5E5E]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_22%,transparent)]'
);

export const documentsSearchIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B5E5E]';

export const documentsFilterPillClass = (active: boolean) =>
  cn('documents-neu-filter-pill', neuFilterPillClass(active));

export const documentsFilterRowClass = cn(
  'flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3',
  'max-md:gap-1.5'
);

export const documentsFilterPillsStripClass = cn(
  'documents-neu-filter-track',
  neuSegmentedTrackClass,
  'inline-flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2'
);

export const documentsFilterPillsGroupClass = documentsFilterPillsStripClass;
