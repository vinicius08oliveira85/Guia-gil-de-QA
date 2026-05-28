import { cn } from '../../utils/cn';
import {
  neuInsetContentClass,
  neuSurfaceClass,
  neuSurfaceInsetClass,
} from '../common/neuUi';
import {
  appNeuActionBtnActiveClass,
  appNeuActionBtnClass,
  appNeuActionTrackWrapClass,
} from '../common/workspaceChromeActionUi';

/** Escopo da aba Documentos — tokens escuros em index.css (`.documents-view-scope`). */
export const documentsViewScopeClass = 'documents-view-scope';

export const documentsPageHeaderClass = cn(
  'documents-page-header mb-3 flex flex-col gap-4 font-sans sm:mb-4 sm:gap-5',
  'max-md:mb-2 max-md:gap-2'
);

export const documentsPageTitleClass =
  'font-sans text-2xl font-bold tracking-tight text-[var(--leve-header-text)] sm:text-[1.65rem]';

export const documentsPageSubtitleClass =
  'mt-1 font-sans text-sm leading-relaxed text-[var(--leve-header-text-muted)]';

export const documentsJiraBadgeClass = cn(
  'documents-neu-chip inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold text-[var(--leve-header-accent)]'
);

export const documentsPageMutedClass = 'font-sans text-sm text-[var(--leve-header-text-muted)]';

/** Painel de filtros / resumo — superfície elevada. */
export const documentsFiltersPanelClass = cn(
  'documents-neu-panel',
  neuSurfaceClass,
  'relative flex flex-col overflow-visible rounded-[var(--leve-header-radius)] p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const documentsEyebrowClass = cn(
  'documents-eyebrow inline-block border-b border-[var(--leve-header-accent)] pb-1',
  'font-sans text-[10px] font-extrabold uppercase tracking-wider text-[var(--leve-header-accent)] sm:text-[11px]'
);

/** Documento de especificação — card elevado. */
export const documentsSectionShellClass = cn(
  'documents-neu-section',
  neuSurfaceClass,
  'rounded-[var(--leve-header-radius)] p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const documentsSectionHeaderDividerClass =
  'documents-section-header border-b border-[color-mix(in_srgb,var(--leve-neu-light)_38%,transparent)]';

export const documentsSectionHeaderClass = cn(documentsSectionHeaderDividerClass, 'pb-2');

export const documentsSectionTitleClass = cn(
  'documents-section-title mt-1 font-sans text-base font-bold text-[var(--leve-header-text)] sm:text-lg'
);

/** Faixa de resumo — trilho inset. */
export const documentsSummaryStripClass = cn(
  'documents-neu-summary-track',
  neuSurfaceInsetClass,
  'mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--leve-header-radius)] px-3 py-2.5 sm:px-3.5',
  'max-md:mb-2 max-md:gap-x-2 max-md:gap-y-1 max-md:px-2 max-md:py-1.5'
);

export const documentsSummaryStatsClass =
  'flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-[var(--leve-header-text-muted)]';

export const documentsSummaryStatStrongClass =
  'font-semibold text-[var(--leve-header-text)]';

export const documentsSummaryStatIconAccentClass = 'h-4 w-4 text-[var(--leve-header-accent)]';

export const documentsSummaryStatIconSuccessClass = 'h-4 w-4 text-success';

export const documentsAlertSuccessClass = cn(
  'documents-neu-alert-success',
  neuSurfaceInsetClass,
  neuInsetContentClass,
  'flex items-start gap-2 rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,oklch(var(--su))_32%,var(--leve-neu-dark))]'
);

export const documentsAlertInfoClass = cn(
  'documents-neu-alert-info',
  neuSurfaceInsetClass,
  neuInsetContentClass,
  'flex items-start gap-2 rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,var(--leve-header-accent)_28%,var(--leve-neu-dark))]'
);

export const documentsBodyTextClass =
  'font-sans text-sm font-medium leading-snug text-[var(--leve-header-text)]';

export const documentsMutedTextClass = 'documents-muted font-sans text-xs text-[var(--leve-header-text-muted)]';

export const documentsStrongTextClass = 'font-semibold text-[var(--leve-header-text)]';

export const documentsProgressTrackClass = cn(
  'documents-neu-progress-track',
  'relative h-2 min-w-0 flex-1 overflow-hidden rounded-full'
);

export const documentsProgressFillClass = 'documents-neu-progress-fill h-full w-full rounded-full';

export const documentsProgressPercentClass =
  'shrink-0 font-sans text-xs font-bold tabular-nums text-[var(--leve-header-text-muted)]';

export const documentsPrimaryBtnClass = cn(
  'documents-neu-btn-primary',
  appNeuActionBtnActiveClass,
  'min-h-[44px] gap-2 px-4 py-2 max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:py-1.5 max-md:text-xs sm:min-h-9'
);

export const documentsOutlineBtnClass = cn(
  'documents-neu-chip',
  appNeuActionBtnClass,
  'min-h-9 px-4 py-2'
);

export const documentsSpecRemoveBtnClass = cn(
  documentsOutlineBtnClass,
  'documents-neu-spec-remove text-error hover:text-error'
);

export const documentsSearchInputClass = cn(
  'documents-neu-search',
  'app-input h-11 w-full min-w-[200px] flex-1 rounded-full border-0 py-2 pl-10 pr-10 font-sans text-sm',
  'max-md:h-10 max-md:pl-9 max-md:pr-9 max-md:text-xs sm:h-10',
  'text-[var(--leve-header-text)] placeholder:text-[var(--leve-header-text-muted)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_22%,transparent)]'
);

export const documentsSearchIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--leve-header-text-muted)]';

export const documentsFilterPillClass = (active: boolean) =>
  cn(
    'documents-neu-filter-pill',
    active ? appNeuActionBtnActiveClass : appNeuActionBtnClass,
    'px-3 py-1.5 text-xs font-medium sm:text-sm'
  );

export const documentsFilterRowClass = cn(
  'flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3',
  'max-md:gap-1.5'
);

export const documentsFilterPillsStripClass = cn(
  'documents-neu-filter-track',
  appNeuActionTrackWrapClass,
  'max-w-full gap-1.5 sm:gap-2'
);

export const documentsFilterPillsGroupClass = documentsFilterPillsStripClass;
