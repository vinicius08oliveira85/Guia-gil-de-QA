import { cn } from '../../utils/cn';
import {
  tasksPanelFormCancelBtnClass,
  tasksPanelFormSaveBtnClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from '../tasks/tasksPanelNeuStyles';

const dmInset = 'documents-neu-inset leve-neu-inset-content';

/** Shell escuro — alinhado aos modais de Tarefas / Exportar. */
export const documentsModalShellClass = cn('documents-neu-modal', tasksPanelNeuModalPanelClass);

export const documentsModalBodyClass =
  'font-sans text-[#dcdcdc] [&_.custom-scrollbar]:bg-[#4a423e]';

export const documentsModalTitleClass = tasksPanelNeuModalTitleClass;

export const documentsModalMutedTextClass = 'font-sans text-sm text-[#b8b3ad]';

export const documentsModalSectionLabelClass = cn(
  'inline-block border-b border-[#e65100] pb-1 font-sans text-[10px] font-extrabold uppercase tracking-wider text-[#e65100] sm:text-[11px]'
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-[#b8b3ad]';

export const documentsModalInputClass = cn(
  'documents-modal-input w-full rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]',
  'bg-[#423b37] font-sans text-[#fdf6e3] placeholder:text-[rgba(245,241,230,0.55)]',
  dmInset,
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#e65100_28%,transparent)]'
);

export const documentsModalTextareaClass = cn(
  documentsModalInputClass,
  'min-h-[15rem] resize-y font-mono text-sm'
);

export const documentsModalFooterClass =
  'flex justify-end gap-2 border-t border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] pt-4';

export const documentsModalFooterCancelClass = cn(tasksPanelFormCancelBtnClass, 'min-h-10 px-5');

export const documentsModalFooterSaveClass = cn(tasksPanelFormSaveBtnClass, 'min-h-10 px-6');

export const documentsModalPrimaryBtnClass = cn(
  documentsModalFooterSaveClass,
  'min-h-9 gap-2 px-4 py-2 text-xs sm:min-h-10 sm:text-sm'
);

/** Ação secundária em destaque (ex.: Baixar no visualizador). */
export const documentsModalSecondaryBtnClass = cn(
  'documents-neu-chip inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,#fdf6e3_18%,transparent)] px-4 py-2 sm:min-h-10',
  'bg-[color-mix(in_srgb,#5c524b_18%,#4a423e)] font-sans text-xs font-semibold text-[#fdf6e3] sm:text-sm',
  'transition-[filter] hover:brightness-110',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsModalPreviewInsetClass = cn(
  'max-h-96 overflow-y-auto rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)] p-4',
  'bg-[#423b37] font-mono text-sm text-[#fdf6e3]',
  dmInset
);

export const documentsModalDividerClass = 'border-[color-mix(in_srgb,#fdf6e3_12%,transparent)]';

export const documentsModalMetaClass = 'font-sans text-sm text-[#b8b3ad]';

export const documentsModalPreClass = 'whitespace-pre-wrap font-mono text-sm text-[#fdf6e3]';

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]'
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-[var(--leve-header-radius)]',
  'border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)]'
);

export const documentsModalAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  'rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,#fdf6e3_10%,transparent)] bg-[#423b37] px-4 py-5 sm:px-6 sm:py-6',
  'font-sans text-[#fdf6e3] prose-headings:text-[#fdf6e3] prose-p:text-[#dcdcdc] prose-strong:text-[#fdf6e3]',
  dmInset
);
