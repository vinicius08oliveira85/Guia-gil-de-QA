import { cn } from '../../utils/cn';
import type { BusinessRuleCategoryBadgeVariant } from '../../utils/businessRuleCategoryPresets';

/** Escopo da aba Regras de negócio — tokens em index.css (`.business-rules-view-scope`). */
export const businessRulesViewScopeClass = 'business-rules-view-scope app-neu-scope';

/** Envelope da lista (trilho inset). */
export const businessRulesListPanelClass = cn(
  'business-rules-list-panel business-rules-neu-list-track',
  'rounded-[var(--leve-header-radius)] p-2.5 sm:p-3.5'
);

/** Card expansível — superfície elevada. */
export const businessRulesCardClass = cn(
  'business-rules-card business-rules-neu-card',
  'group/card overflow-hidden rounded-[var(--leve-header-radius)]',
  'transition-[box-shadow,border-color] duration-200'
);

export const businessRulesCardSummaryClass = cn(
  'flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left',
  'transition-[background-color,box-shadow] duration-200',
  'hover:bg-[color-mix(in_srgb,#E2D9D0_45%,#F2EEE8)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_35%,transparent)] focus-visible:ring-inset',
  '[&::-webkit-details-marker]:hidden'
);

export const businessRulesCardTitleClass = cn(
  'block border-b border-transparent pb-1 text-base font-bold tracking-tight text-[#401C31]',
  'group-open:border-[#DED7CD]'
);

export const businessRulesCardChevronClass =
  'h-5 w-5 shrink-0 text-[#6B5E5E] transition-transform duration-200 group-open:rotate-180';

export const businessRulesCardBodyClass = cn(
  'space-y-4 border-t border-[#DED7CD] bg-[#F2EEE8] px-4 py-4 sm:px-5'
);

export const businessRulesCardLabelClass =
  'mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6B5E5E]';

/** Painel de descrição — inset profundo. */
export const businessRulesCardInsetClass = cn(
  'business-rules-neu-inset jira-rich-content rounded-[var(--leve-header-radius)]',
  'px-4 py-4 sm:px-5 sm:py-5',
  'prose-headings:font-heading prose-headings:text-[#401C31]',
  'prose-p:leading-relaxed prose-p:text-[#401C31]',
  'prose-strong:font-bold prose-strong:text-[#401C31]',
  'prose-h2:mb-3 prose-h2:border-b prose-h2:border-[#DED7CD] prose-h2:pb-2',
  'prose-h3:mb-2 prose-h3:border-b prose-h3:border-[#DED7CD] prose-h3:pb-1.5',
  'prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6'
);

export const businessRulesCardEmptyDescClass = cn(
  businessRulesCardInsetClass,
  'text-center text-sm italic text-[#6B5E5E]'
);

export const businessRulesCardLinkedTextClass = 'text-sm leading-relaxed text-[#401C31]';

export const businessRulesCardActionsClass = cn(
  'flex flex-wrap items-center gap-2 border-t border-[#DED7CD] pt-4'
);

/** Editar / Excluir — chip elevado. */
export const businessRulesCardOutlineBtnClass = cn(
  'business-rules-neu-chip business-rules-card-action-btn',
  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2',
  'font-sans text-sm font-semibold text-[#401C31]',
  'transition-[box-shadow,color,background-color] duration-200',
  'hover:text-[#FF5C1B]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_28%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

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

/** Chip de categoria — cores da identidade (ver index.css); não usar `Badge` pill aqui. */
export const businessRulesCategoryBadgeClass = (variant: BusinessRuleCategoryBadgeVariant) =>
  cn(
    'business-rules-neu-chip business-rules-neu-category-badge normal-case',
    'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5',
    'font-sans text-xs font-semibold leading-snug tracking-normal',
    businessRulesCategoryBadgeToneClass[variant]
  );
