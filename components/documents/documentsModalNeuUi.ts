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
  'font-sans text-[var(--workspace-panel-text-muted)] [&_.custom-scrollbar]:bg-[var(--workspace-panel-bg)]';

export const documentsModalTitleClass = tasksPanelNeuModalTitleClass;

export const documentsModalMutedTextClass = 'font-sans text-sm text-[var(--workspace-panel-text-muted)]';

export const documentsModalSectionLabelClass = cn(
  'inline-block border-b border-[var(--workspace-panel-accent)] pb-1 font-sans text-[10px] font-extrabold uppercase tracking-wider text-[var(--workspace-panel-accent)] sm:text-[11px]'
);

export const documentsModalFieldLabelClass =
  'mb-2 block font-sans text-sm font-semibold text-[var(--workspace-panel-text-muted)]';

export const documentsModalInputClass = cn(
  'documents-modal-input w-full rounded-[var(--leve-header-radius)] border border-[var(--workspace-panel-border)]',
  'bg-[color-mix(in_srgb,var(--workspace-panel-neu-dark)_22%,var(--workspace-panel-bg))] font-sans text-[var(--workspace-panel-text)] placeholder:text-[color-mix(in_srgb,var(--workspace-panel-text-muted)_75%,transparent)]',
  dmInset,
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_28%,transparent)]'
);

export const documentsModalTextareaClass = cn(
  documentsModalInputClass,
  'min-h-[15rem] resize-y font-mono text-sm'
);

export const documentsModalFooterClass =
  'flex justify-end gap-2 border-t border-[var(--workspace-panel-border)] pt-4';

export const documentsModalFooterCancelClass = cn(tasksPanelFormCancelBtnClass, 'min-h-10 px-5');

export const documentsModalFooterSaveClass = cn(tasksPanelFormSaveBtnClass, 'min-h-10 px-6');

export const documentsModalPrimaryBtnClass = cn(
  documentsModalFooterSaveClass,
  'min-h-9 gap-2 px-4 py-2 text-xs sm:min-h-10 sm:text-sm'
);

/** Ação secundária em destaque (ex.: Baixar no visualizador). */
export const documentsModalSecondaryBtnClass = cn(
  'documents-neu-chip inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--workspace-panel-border)] px-4 py-2 sm:min-h-10',
  'bg-[color-mix(in_srgb,var(--workspace-panel-neu-dark)_18%,var(--workspace-panel-bg))] font-sans text-xs font-semibold text-[var(--workspace-panel-text)] sm:text-sm',
  'transition-[filter] hover:brightness-110',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const documentsModalPreviewInsetClass = cn(
  'max-h-96 overflow-y-auto rounded-[var(--leve-header-radius)] border border-[var(--workspace-panel-border)] p-4',
  'bg-[color-mix(in_srgb,var(--workspace-panel-neu-dark)_22%,var(--workspace-panel-bg))] font-mono text-sm text-[var(--workspace-panel-text)]',
  dmInset
);

export const documentsModalDividerClass = 'border-[var(--workspace-panel-border)]';

export const documentsModalMetaClass = 'font-sans text-sm text-[var(--workspace-panel-text-muted)]';

export const documentsModalPreClass = 'whitespace-pre-wrap font-mono text-sm text-[var(--workspace-panel-text)]';

export const documentsModalMediaClass = cn(
  'h-auto max-w-full rounded-[var(--leve-header-radius)]',
  'border border-[var(--workspace-panel-border)]'
);

export const documentsModalIframeClass = cn(
  'h-96 w-full rounded-[var(--leve-header-radius)]',
  'border border-[var(--workspace-panel-border)]'
);

export const documentsModalAnalysisBodyClass = cn(
  'document-analysis-body jira-rich-content prose prose-sm max-w-none break-words',
  'rounded-[var(--leve-header-radius)] border border-[var(--workspace-panel-border)] bg-[color-mix(in_srgb,var(--workspace-panel-neu-dark)_22%,var(--workspace-panel-bg))] px-4 py-5 sm:px-6 sm:py-6',
  'font-sans text-[var(--workspace-panel-text)] prose-headings:text-[var(--workspace-panel-text)] prose-p:text-[var(--workspace-panel-text-muted)] prose-strong:text-[var(--workspace-panel-text)]',
  dmInset
);
