import { cn } from '../../utils/cn';
import {
  tasksPanelFormCancelBtnClass,
  tasksPanelFormSaveBtnClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from '../tasks/tasksPanelNeuStyles';

const dmInset = 'documents-neu-inset leve-neu-inset-content';

/** Shell claro — alinhado aos modais de Tarefas / Exportar. */
export const documentsModalShellClass = cn('documents-neu-modal', tasksPanelNeuModalPanelClass);

export const documentsModalBodyClass =
  'font-sans text-base-content/72 [&_.custom-scrollbar]:bg-base-200';

export const documentsModalTitleClass = tasksPanelNeuModalTitleClass;

export const documentsModalMutedTextClass = 'font-sans text-sm text-base-content/72';

export const documentsModalSectionLabelClass = cn(
  'inline-block border-b border-primary pb-1 font-sans text-[10px] font-extrabold uppercase tracking-wider text-primary sm:text-[11px]'
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-base-content/72';

export const documentsModalInputClass = cn(
  'documents-modal-input w-full rounded-field border border-base-300',
  'bg-base-300/25 font-sans text-base-content placeholder:text-base-content/55',
  dmInset,
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/28'
);

export const documentsModalTextareaClass = cn(
  documentsModalInputClass,
  'min-h-[15rem] resize-y font-mono text-sm'
);

export const documentsModalFooterClass =
  'flex justify-end gap-2 border-t border-base-300 pt-4';

export const documentsModalFooterCancelClass = cn(tasksPanelFormCancelBtnClass, 'min-h-10 px-5');

export const documentsModalFooterSaveClass = cn(tasksPanelFormSaveBtnClass, 'min-h-10 px-6');

export const documentsModalPrimaryBtnClass = cn(
  documentsModalFooterSaveClass,
  'min-h-9 gap-2 px-4 py-2 text-xs sm:min-h-10 sm:text-sm'
);

/** Ação secundária em destaque (ex.: Baixar no visualizador). */
export const documentsModalSecondaryBtnClass = cn(
  'documents-neu-chip inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-base-300 px-4 py-2 sm:min-h-10',
  'bg-base-300/25 font-sans text-xs font-semibold text-base-content sm:text-sm',
  'transition-[filter] hover:brightness-110',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsModalPreviewInsetClass = cn(
  'max-h-96 overflow-y-auto rounded-box border border-base-300 p-4',
  'bg-base-300/25 font-mono text-sm text-base-content',
  dmInset
);

export const documentsModalDividerClass = 'border-base-300';

export const documentsModalMetaClass = 'font-sans text-sm text-base-content/72';

export const documentsModalPreClass = 'whitespace-pre-wrap font-mono text-sm text-base-content';

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-box',
  'border border-base-300'
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-box',
  'border border-base-300'
);

export const documentsModalAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  'rounded-box border border-base-300 bg-base-300/25 px-4 py-5 sm:px-6 sm:py-6',
  'font-sans text-base-content prose-headings:text-base-content prose-p:text-base-content/72 prose-strong:text-base-content',
  dmInset
);
