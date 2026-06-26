import { cn } from '../../utils/cn';
import {
  tasksPanelExportModalFieldLabelClass,
  tasksPanelFormCancelBtnClass,
  tasksPanelFormFieldLabelClass,
  tasksPanelFormInputClass,
  tasksPanelFormSaveBtnClass,
  tasksPanelFormSelectClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from '../tasks/tasksPanelNeuStyles';

const neuRaised = 'shadow-[var(--workspace-panel-neu-raised)]';

const neuInset = 'shadow-[var(--workspace-panel-neu-inset)]';

/** Shell claro — mesma base dos modais Exportar / Adicionar Tarefa. */
export const createProjectModalShellClass = cn(
  'create-project-neu-modal',
  tasksPanelNeuModalPanelClass
);

export const createProjectModalBodyClass =
  'font-sans text-[var(--workspace-panel-text-muted)] [&_.custom-scrollbar]:bg-[var(--workspace-panel-bg)]';

export const createProjectModalTitleClass = tasksPanelNeuModalTitleClass;

export const createProjectModalDescClass = 'font-sans text-sm text-[var(--workspace-panel-text-muted)]';

export const createProjectFieldLabelClass = tasksPanelFormFieldLabelClass;

export const createProjectInputClass = tasksPanelFormInputClass;

export const createProjectTextareaClass = cn(tasksPanelFormInputClass, 'min-h-[5.5rem] resize-y py-2.5');

/** Card de opção (template / Jira / arquivo) — pill elevado no painel claro. */
export const createProjectOptionCardClass = cn(
  'create-project-neu-option w-full rounded-[var(--leve-header-radius)] border p-4 text-left',
  'border-[var(--workspace-panel-border)] bg-[var(--leve-neu-bg)]',
  neuRaised,
  'transition-[box-shadow,border-color,transform] duration-200',
  'hover:border-[color-mix(in_srgb,var(--workspace-panel-accent)_35%,transparent)] hover:text-[var(--workspace-panel-text)]',
  'active:translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_40%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const createProjectOptionTitleClass = 'font-sans text-sm font-bold text-[var(--workspace-panel-text)]';

export const createProjectOptionDescClass = 'font-sans text-xs text-[var(--workspace-panel-text-muted)]';

/** Painel interno (importação Jira). */
export const createProjectInsetPanelClass = cn(
  'create-project-neu-inset rounded-[var(--leve-header-radius)] border p-4 sm:p-6',
  'border-[var(--workspace-panel-border)] bg-[var(--leve-neu-bg)]',
  neuInset
);

export const createProjectModalFooterClass =
  'create-project-neu-footer border-t border-[var(--workspace-panel-border)] pt-1';

export const createProjectCancelBtnClass = tasksPanelFormCancelBtnClass;

export const createProjectPrimaryBtnClass = tasksPanelFormSaveBtnClass;

/** Rótulo de seção (importação Jira). */
export const createProjectSectionLabelClass = tasksPanelExportModalFieldLabelClass;

export const createProjectFormSelectClass = tasksPanelFormSelectClass;
