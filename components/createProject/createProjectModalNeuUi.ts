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

const neuRaised =
  'shadow-[5px_5px_12px_color-mix(in_srgb,#423b37_55%,transparent),-3px_-3px_8px_color-mix(in_srgb,#fdf6e3_12%,#4a423e)]';

const neuInset =
  'shadow-[inset_4px_4px_10px_color-mix(in_srgb,#423b37_70%,transparent),inset_-3px_-3px_8px_color-mix(in_srgb,#fdf6e3_10%,#4a423e)]';

/** Shell escuro — mesma base dos modais Exportar / Adicionar Tarefa. */
export const createProjectModalShellClass = cn(
  'create-project-neu-modal',
  tasksPanelNeuModalPanelClass
);

export const createProjectModalBodyClass =
  'font-sans text-[#dcdcdc] [&_.custom-scrollbar]:bg-[#4a423e]';

export const createProjectModalTitleClass = tasksPanelNeuModalTitleClass;

export const createProjectModalDescClass = 'font-sans text-sm text-[#dcdcdc]';

export const createProjectFieldLabelClass = tasksPanelFormFieldLabelClass;

export const createProjectInputClass = tasksPanelFormInputClass;

export const createProjectTextareaClass = cn(tasksPanelFormInputClass, 'min-h-[5.5rem] resize-y py-2.5');

/** Card de opção (template / Jira / arquivo) — pill elevado no painel escuro. */
export const createProjectOptionCardClass = cn(
  'create-project-neu-option w-full rounded-[var(--leve-header-radius)] border p-4 text-left',
  'border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] bg-[#423b37]',
  neuRaised,
  'transition-[box-shadow,border-color,transform] duration-200',
  'hover:border-[color-mix(in_srgb,#d85414_35%,transparent)] hover:text-[#fdf6e3]',
  'active:translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#d85414_40%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export const createProjectOptionTitleClass = 'font-sans text-sm font-bold text-[#fdf6e3]';

export const createProjectOptionDescClass = 'font-sans text-xs text-[#dcdcdc]';

/** Painel interno (importação Jira). */
export const createProjectInsetPanelClass = cn(
  'create-project-neu-inset rounded-[var(--leve-header-radius)] border p-4 sm:p-6',
  'border-[color-mix(in_srgb,#fdf6e3_10%,transparent)] bg-[#423b37]',
  neuInset
);

export const createProjectModalFooterClass =
  'create-project-neu-footer border-t border-[color-mix(in_srgb,#fdf6e3_12%,transparent)] pt-1';

export const createProjectCancelBtnClass = tasksPanelFormCancelBtnClass;

export const createProjectPrimaryBtnClass = tasksPanelFormSaveBtnClass;

/** Rótulo de seção (importação Jira). */
export const createProjectSectionLabelClass = tasksPanelExportModalFieldLabelClass;

export const createProjectFormSelectClass = tasksPanelFormSelectClass;
