import { cn } from '../../utils/cn';
import type { BusinessRuleCategoryBadgeVariant } from '../../utils/businessRuleCategoryPresets';

/**
 * Paleta neumórfica clara — cards de regras de negócio (somente lista).
 * #EBE6DE página · #F2EEE8 card · #E5DFD5 rebaixado · #401C31 texto · #6B5E5E secundário
 */
const brRaised =
  'shadow-[6px_6px_14px_color-mix(in_srgb,#DED7CD_75%,transparent),-4px_-4px_10px_color-mix(in_srgb,#FFFFFF_55%,#F2EEE8)]';

const brInset =
  'shadow-[inset_4px_4px_10px_color-mix(in_srgb,#DED7CD_65%,transparent),inset_-3px_-3px_8px_color-mix(in_srgb,#FFFFFF_45%,#E5DFD5)]';

/** Envelope da lista (fundo da página na área dos cards). */
export const businessRulesListPanelClass = cn(
  'business-rules-list-panel rounded-[var(--leve-header-radius)] p-2.5 sm:p-3.5',
  'bg-[#EBE6DE]'
);

export const businessRulesCardClass = cn(
  'business-rules-card overflow-hidden rounded-[var(--leve-header-radius)]',
  'border border-[#DED7CD] bg-[#F2EEE8]',
  brRaised,
  'transition-[box-shadow] duration-200'
);

export const businessRulesCardSummaryClass = cn(
  'flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left',
  'transition-colors hover:bg-[color-mix(in_srgb,#E2D9D0_55%,#F2EEE8)]',
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

export const businessRulesCardInsetClass = cn(
  'jira-rich-content rounded-[var(--leve-header-radius)] border border-[#DED7CD] bg-[#E5DFD5]',
  'px-4 py-4 sm:px-5 sm:py-5',
  brInset,
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

export const businessRulesCardOutlineBtnClass = cn(
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-4 py-2',
  'border-[#DED7CD] bg-[#F2EEE8] font-sans text-sm font-semibold text-[#401C31]',
  brInset,
  'transition-[box-shadow,color] hover:bg-[color-mix(in_srgb,#E2D9D0_40%,#F2EEE8)]'
);

export const businessRulesCategoryBadgeClass = (variant: BusinessRuleCategoryBadgeVariant) =>
  cn(
    'normal-case',
    variant === 'primary' || variant === 'accent' || variant === 'warning'
      ? 'border border-[color-mix(in_srgb,#FF5C1B_35%,transparent)] bg-[#FF5C1B] text-[#FFFFFF]'
      : variant === 'success' || variant === 'info'
        ? cn(
            'border border-[color-mix(in_srgb,#10b981_35%,transparent)]',
            'bg-[color-mix(in_srgb,#10b981_88%,#F2EEE8)] text-[#FFFFFF]'
          )
        : 'border border-[#938A81] bg-[#F7F4F0] text-[#401C31]'
  );
