import { cn } from '../../utils/cn';
import type { BusinessRuleCategoryBadgeVariant } from '../../utils/businessRuleCategoryPresets';
import {
  appNeuActionBtnClass,
  appNeuActionBtnDangerClass,
} from '../common/workspaceChromeActionUi';

/** Escopo da aba Regras de negócio — tokens DaisyUI `leve` via `.business-rules-view-scope`. */
export const businessRulesViewScopeClass = 'business-rules-view-scope app-neu-scope';

/** Envelope da lista (trilho inset). */
export const businessRulesListPanelClass = cn(
  'business-rules-list-panel business-rules-neu-list-track',
  'rounded-box p-2.5 sm:p-3.5',
  'max-md:p-1.5'
);

/** Card expansível — superfície elevada. */
export const businessRulesCardClass = cn(
  'business-rules-card business-rules-neu-card',
  'group/card overflow-hidden rounded-box',
  'transition-[box-shadow,border-color] duration-200'
);

export const businessRulesCardSummaryClass = cn(
  'business-rules-card-summary flex min-h-[44px] cursor-pointer list-none flex-col gap-3 px-4 py-3 text-left',
  'sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
  'max-md:min-h-9 max-md:gap-2.5 max-md:px-3 max-md:py-2.5',
  'transition-[background-color,box-shadow] duration-200',
  'hover:bg-base-300/25',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset',
  '[&::-webkit-details-marker]:hidden'
);

export const businessRulesCardTitleClass = cn(
  'business-rules-card-title block border-b border-transparent pb-1 text-base font-bold tracking-tight text-base-content',
  'group-open:border-base-300/38'
);

export const businessRulesCardChevronClass =
  'business-rules-card-chevron h-5 w-5 shrink-0 text-base-content/72 transition-transform duration-200 group-open:rotate-180';

export const businessRulesCardBodyClass = cn(
  'business-rules-card-body space-y-5 border-t border-base-300/38 px-4 py-4 sm:px-5 sm:py-5',
  'max-md:space-y-4 max-md:px-3 max-md:py-3'
);

export const businessRulesCardSectionClass = cn(
  'business-rules-card-section space-y-2.5'
);

export const businessRulesCardKeywordsPanelClass = cn(
  'business-rules-neu-inset rounded-box px-3 py-2.5 sm:px-4 sm:py-3'
);

export const businessRulesKeywordsListClass = 'flex flex-wrap gap-1.5';

export const businessRulesKeywordChipClass = cn(
  'business-rules-neu-chip inline-flex max-w-full items-center rounded-full px-2.5 py-0.5',
  'text-xs font-medium leading-snug text-base-content'
);

export const businessRulesLegacyBannerClass = cn(
  'rounded-box border border-warning/35 bg-warning/8 px-4 py-3',
  'text-sm leading-relaxed text-base-content'
);

export const businessRulesCardInsetClass = cn(
  'business-rules-neu-inset jira-rich-content rounded-box',
  'px-4 py-4 sm:px-5 sm:py-5',
  'prose-headings:font-heading prose-headings:text-base-content',
  'prose-p:leading-relaxed prose-p:text-base-content',
  'prose-strong:font-bold prose-strong:text-base-content',
  'prose-h2:mb-3 prose-h2:border-b prose-h2:border-base-300/38 prose-h2:pb-2',
  'prose-h3:mb-2 prose-h3:border-b prose-h3:border-base-300/38 prose-h3:pb-1.5',
  'prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6'
);

export const businessRulesDossierContentClass = cn(
  businessRulesCardInsetClass,
  'business-rules-dossier-content px-3 py-3 sm:px-4 sm:py-4'
);

export const businessRulesDossierProseClass = cn(
  'business-rules-dossier-prose max-w-none text-xs leading-relaxed',
  'text-base-content',
  '[&_p]:!my-2 [&_p]:text-xs [&_p]:leading-relaxed',
  '[&_strong]:font-semibold [&_strong]:text-base-content',
  '[&_ul]:!my-2.5 [&_ol]:!my-2.5 [&_li]:text-xs [&_li]:leading-relaxed [&_li]:!my-1',
  '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4'
);

export const businessRulesHistoryPanelClass = cn(
  'business-rules-neu-inset rounded-box px-3 py-2.5',
  'text-sm text-base-content/72'
);

export const businessRulesHistorySummaryClass = cn(
  'cursor-pointer text-xs font-bold uppercase tracking-widest text-base-content/72',
  'hover:text-base-content'
);

export const businessRulesCardLabelClass = cn(
  'business-rules-card-label mb-2 text-[10px] font-bold uppercase tracking-widest text-base-content/72'
);

export const businessRulesCardEmptyDescClass = cn(
  businessRulesCardInsetClass,
  'text-center text-sm italic text-base-content/72'
);

export const businessRulesCardLinkedTextClass =
  'business-rules-card-linked text-sm leading-relaxed text-base-content';

export const businessRulesCardSummaryHeaderClass = cn(
  'business-rules-card-summary-header',
  'order-2 flex min-w-0 flex-1 items-start justify-between gap-2 sm:order-1 sm:items-center'
);

export const businessRulesCardSummaryActionsClass = cn(
  'business-rules-card-actions',
  'workspace-chrome-inset app-neu-action-track',
  'order-1 flex w-full shrink-0 flex-row flex-nowrap items-stretch justify-stretch gap-0.5',
  'rounded-box p-0.5',
  'sm:order-2 sm:w-auto sm:flex-wrap sm:items-center sm:justify-end'
);

/** @deprecated Ações na base do card — use `businessRulesCardSummaryActionsClass`. */
export const businessRulesCardActionsClass = cn(
  'business-rules-card-actions',
  'workspace-chrome-inset app-neu-action-track',
  'flex w-full min-h-[2.75rem] flex-row flex-nowrap items-center justify-end gap-1',
  'rounded-box border-t border-base-300/38 p-1 pt-3'
);

const businessRulesCardActionBtnBase = cn(
  'h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 px-4 leading-none',
  'max-md:h-8 max-md:min-h-8 max-md:flex-1 max-md:px-2 max-md:gap-0',
  '[&_svg]:block [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
  'max-md:[&_svg]:h-3.5 max-md:[&_svg]:w-3.5'
);

export const businessRulesCardActionLabelClass = 'hidden sm:inline';

export const businessRulesCardEditBtnClass = cn(
  'business-rules-card-action-btn business-rules-card-action-edit',
  appNeuActionBtnClass,
  businessRulesCardActionBtnBase
);

export const businessRulesCardDeleteBtnClass = cn(
  'business-rules-card-action-btn business-rules-card-action-delete',
  appNeuActionBtnDangerClass,
  businessRulesCardActionBtnBase
);

/** @deprecated Use `businessRulesCardEditBtnClass` */
export const businessRulesCardOutlineBtnClass = businessRulesCardEditBtnClass;

const businessRulesCategoryBadgeToneClass: Record<
  BusinessRuleCategoryBadgeVariant,
  string
> = {
  primary: 'business-rules-neu-category-badge--primary',
  secondary: 'business-rules-neu-category-badge--secondary',
  accent: 'business-rules-neu-category-badge--accent',
  info: 'business-rules-neu-category-badge--info',
  success: 'business-rules-neu-category-badge--success',
  warning: 'business-rules-neu-category-badge--warning',
};

export const businessRulesCategoryBadgeClass = (variant: BusinessRuleCategoryBadgeVariant) =>
  cn(
    'business-rules-neu-chip business-rules-neu-category-badge normal-case',
    'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5',
    'font-sans text-xs font-semibold leading-snug tracking-normal',
    businessRulesCategoryBadgeToneClass[variant]
  );
