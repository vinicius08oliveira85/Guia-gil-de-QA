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
  'font-sans text-base-content/72 [&_.custom-scrollbar]:bg-base-100';

export const createProjectModalTitleClass = tasksPanelNeuModalTitleClass;

export const createProjectModalDescClass = 'font-sans text-sm text-base-content/72';

export const createProjectFieldLabelClass = tasksPanelFormFieldLabelClass;

export const createProjectInputClass = tasksPanelFormInputClass;

export const createProjectTextareaClass = cn(tasksPanelFormInputClass, 'min-h-[5.5rem] resize-y py-2.5');

/** Card de opção (template / Jira / arquivo) — pill elevado no painel claro. */
export const createProjectOptionCardClass = cn(
  'create-project-neu-option w-full rounded-box border p-4 text-left',
  'border-base-300 bg-base-200',
  neuRaised,
  'transition-[box-shadow,border-color,transform] duration-200',
  'hover:border-primary/35 hover:text-base-content',
  'active:translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const createProjectOptionTitleClass = 'font-sans text-sm font-bold text-base-content';

export const createProjectOptionDescClass = 'font-sans text-xs text-base-content/72';

/** Painel interno (importação Jira). */
export const createProjectInsetPanelClass = cn(
  'create-project-neu-inset rounded-box border p-4 sm:p-6',
  'border-base-300 bg-base-200',
  neuInset
);

export const createProjectModalFooterClass =
  'create-project-neu-footer border-t border-base-300 pt-1';

export const createProjectCancelBtnClass = tasksPanelFormCancelBtnClass;

export const createProjectPrimaryBtnClass = tasksPanelFormSaveBtnClass;

/** Rótulo de seção (importação Jira). */
export const createProjectSectionLabelClass = tasksPanelExportModalFieldLabelClass;

export const createProjectFormSelectClass = tasksPanelFormSelectClass;
