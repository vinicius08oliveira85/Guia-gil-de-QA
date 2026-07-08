import { cn } from '../../utils/cn';
import { settingsViewScopeClass } from '../common/appPageNeuUi';
import {
  appNeuActionBtnClass,
  appNeuActionBtnDangerClass,
} from '../common/workspaceChromeActionUi';
import { tasksPanelNeuModalPanelClass } from '../tasks/tasksPanelNeuStyles';

export { settingsViewScopeClass };

/** Modais abertos a partir de Configurações (Jira, API Keys). */
export const settingsNeuModalPanelClass = cn('settings-neu-modal', tasksPanelNeuModalPanelClass);

/** Painel inset — chave API configurada (Gemini). */
export const settingsNeuConfiguredPanelClass = cn(
  'settings-neu-configured-panel rounded-box p-4 sm:p-5'
);

export const settingsNeuInlineActionsClass = cn(
  'settings-neu-inline-actions flex shrink-0 flex-wrap items-center gap-2'
);

const settingsNeuActionBtnBase = cn(
  'settings-neu-action-btn h-9 min-h-9 shrink-0 items-center justify-center px-4 text-sm leading-none'
);

/** Editar — pill elevado (#FDF6E3 / hover #E65100). */
export const settingsNeuEditBtnClass = cn(
  settingsNeuActionBtnBase,
  'settings-neu-edit-btn',
  appNeuActionBtnClass
);

/** Remover — pill elevado com destaque de erro. */
export const settingsNeuRemoveBtnClass = cn(
  settingsNeuActionBtnBase,
  'settings-neu-remove-btn',
  appNeuActionBtnDangerClass
);

/** Tecla do atalho — chip inset neumórfico. */
export const settingsNeuKbdClass = cn(
  'settings-neu-kbd',
  'inline-flex min-h-9 min-w-[3.5rem] items-center justify-center rounded-full px-3 py-1.5',
  'font-mono text-xs font-semibold tracking-wide text-base-content'
);

export const settingsNeuShortcutActionsClass = cn(
  'settings-neu-shortcut-actions flex shrink-0 flex-wrap items-center gap-2 sm:gap-3'
);
