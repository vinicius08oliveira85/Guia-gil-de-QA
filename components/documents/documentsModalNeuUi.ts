import { cn } from '../../utils/cn';
import {
  taskDetailsModalBodyClass,
  taskDetailsModalShellClass,
  taskDetailsModalTitleClass,
} from '../tasks/taskDetailsNeuUi';

const dmInset =
  'shadow-[inset_3px_3px_8px_color-mix(in_srgb,#DED7CD_50%,transparent),inset_-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#E5DFD5)]';

/** Shell compartilhado com modais claros (reutiliza `.task-details-neu-modal` no CSS). */
export const documentsModalShellClass = cn(
  'documents-neu-modal',
  taskDetailsModalShellClass
);

export const documentsModalBodyClass = taskDetailsModalBodyClass;

export const documentsModalTitleClass = taskDetailsModalTitleClass;

export const documentsModalMutedTextClass = 'font-sans text-sm text-[#6B5E5E]';

export const documentsModalSectionLabelClass = cn(
  'inline-block border-b border-[#FF5C1B] pb-1 font-sans text-[10px] font-extrabold uppercase tracking-wider text-[#FF5C1B] sm:text-[11px]'
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-[#6B5E5E]';

export const documentsModalInputClass = cn(
  'documents-modal-input w-full rounded-[var(--leve-header-radius)] border border-[#DED7CD]',
  'bg-[#E5DFD5] font-sans text-[#401C31] placeholder:text-[#6B5E5E]',
  dmInset,
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#FF5C1B_28%,transparent)]'
);

export const documentsModalTextareaClass = cn(
  documentsModalInputClass,
  'min-h-[15rem] resize-y font-mono text-sm'
);

export const documentsModalFooterClass =
  'flex justify-end gap-2 border-t border-[#DED7CD] pt-4';

export const documentsModalFooterCancelClass = cn(
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-[#DED7CD] px-5',
  'bg-[#F2EEE8] font-sans text-sm font-semibold text-[#401C31]',
  'shadow-[3px_3px_8px_color-mix(in_srgb,#DED7CD_45%,transparent),-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#F2EEE8)]',
  'transition-[color,filter] hover:text-[#FF5C1B]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsModalFooterSaveClass = cn(
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-[color-mix(in_srgb,#FF5C1B_45%,transparent)] px-6',
  'bg-[#FF5C1B] font-sans text-sm font-bold text-[#FFFFFF]',
  'shadow-[3px_3px_8px_color-mix(in_srgb,#DED7CD_50%,transparent),-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#F2EEE8)]',
  'transition-[filter] hover:brightness-105',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsModalPrimaryBtnClass = cn(
  documentsModalFooterSaveClass,
  'min-h-9 gap-2 px-4 py-2 text-xs sm:min-h-10 sm:text-sm'
);

/** Ação secundária em destaque (ex.: Baixar no visualizador). */
export const documentsModalSecondaryBtnClass = cn(
  'inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,#401C31_35%,#DED7CD)] px-4 py-2 sm:min-h-10',
  'bg-[#401C31] font-sans text-xs font-semibold text-[#FFFFFF] sm:text-sm',
  'shadow-[3px_3px_8px_color-mix(in_srgb,#DED7CD_50%,transparent),-2px_-2px_6px_color-mix(in_srgb,#FFFFFF_18%,#F2EEE8)]',
  'transition-[filter] hover:brightness-110',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsModalPreviewInsetClass = cn(
  'max-h-96 overflow-y-auto rounded-[var(--leve-header-radius)] border border-[#DED7CD] p-4',
  'bg-[#E5DFD5] font-mono text-sm text-[#401C31]',
  dmInset
);

export const documentsModalDividerClass = 'border-[#DED7CD]';

export const documentsModalMetaClass = 'font-sans text-sm text-[#6B5E5E]';

export const documentsModalPreClass =
  'whitespace-pre-wrap font-mono text-sm text-[#401C31]';

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-[var(--leve-header-radius)]',
  'border border-[#DED7CD]'
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-[var(--leve-header-radius)]',
  'border border-[#DED7CD]'
);

export const documentsModalAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  'rounded-[var(--leve-header-radius)] border border-[#DED7CD] bg-[#E5DFD5] px-4 py-5 sm:px-6 sm:py-6',
  'font-sans text-[#401C31] prose-headings:text-[#401C31] prose-p:text-[#401C31] prose-strong:text-[#401C31]',
  dmInset
);
