import { cn } from '../../utils/cn';
import { settingsViewScopeClass } from '../common/appPageNeuUi';
import { neuSelectTriggerClass } from '../common/viewUi';
import {
  leveSettingsCardClass,
  leveSettingsInputClass,
  leveSettingsListClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
  leveSettingsOutlineBtnClass,
  leveSettingsPrimaryBtnFullClass,
  leveSettingsStrongTextClass,
  leveViewPrimaryBtnClass,
} from '../common/projectCardUi';
import { settingsNeuModalPanelClass } from '../settings/settingsNeuUi';

/** Ativa o shim neumórfico de settings (`index.css` → `.settings-view-scope`). */
export const jiraIntegrationScopeClass = settingsViewScopeClass;

/** Shell principal — card elevado (`--leve-neu-raised`). */
export const jiraIntegrationShellClass = cn(leveSettingsCardClass, 'space-y-4');

/** Bloco informativo rebaixado — trilho `--leve-neu-inset-deep`. */
export const jiraIntegrationInsetPanelClass = cn(
  'jira-integration-inset-panel leve-settings-inset-panel leve-neu-surface-inset p-4 sm:p-5'
);

/** Modal de configuração — `leve-modal-neu-shell` + tema escuro de settings. */
export const jiraIntegrationModalPanelClass = settingsNeuModalPanelClass;

/** Inputs do modal — variant `neu` + inset (sem `input-bordered` / bg claro). */
export const jiraIntegrationInputClass = cn(
  leveSettingsInputClass,
  'jira-integration-modal-input'
);

/** AppSelect / NeuSelect — gatilho inset (não usar `.app-select` / `select-bordered`). */
export const jiraIntegrationSelectClass = cn(
  'jira-integration-select',
  neuSelectTriggerClass,
  'h-10 w-full'
);

export const jiraIntegrationTitleClass =
  'mb-2 font-sans text-xl font-bold text-base-content';

export const jiraIntegrationSubtitleClass = leveSettingsMutedTextClass;

export const jiraIntegrationLabelClass =
  'block text-sm font-medium text-base-content';

export const jiraIntegrationMutedXsClass = leveSettingsMutedTextXsClass;

export const jiraIntegrationStrongClass = leveSettingsStrongTextClass;

export const jiraIntegrationListClass = leveSettingsListClass;

export const jiraIntegrationPrimaryBtnClass = leveSettingsPrimaryBtnFullClass;

export const jiraIntegrationOutlineBtnClass = cn(leveSettingsOutlineBtnClass, 'text-sm');

/** Desconectar — variante danger neumórfica (tokens `--er`, sem hex hardcoded). */
export const jiraIntegrationDisconnectBtnClass = cn(
  jiraIntegrationOutlineBtnClass,
  'jira-integration-disconnect-btn'
);

/** Link/ação secundária — pill neumórfica com raised no hover. */
export const jiraIntegrationLinkPillClass = cn(
  'jira-integration-link-pill',
  'inline-flex items-center rounded-full px-2.5 py-1',
  'font-sans text-xs font-semibold text-primary',
  'transition-[box-shadow,color,transform] duration-150',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-primary/28'
);

/** Status no cabeçalho — pill elevada (não texto plano sobre fundo). */
export const jiraIntegrationStatusBadgeClass = (variant: 'connected' | 'disconnected') =>
  cn('jira-integration-status-badge', `jira-integration-status-badge--${variant}`);

export const jiraIntegrationImportBtnClass = cn(
  leveViewPrimaryBtnClass,
  'jira-integration-import-btn w-full disabled:cursor-not-allowed'
);

/** Botão salvar/testar — estado disabled neumórfico via `.jira-integration-save-btn:disabled`. */
export const jiraIntegrationSaveBtnClass = cn(
  leveViewPrimaryBtnClass,
  'jira-integration-save-btn disabled:cursor-not-allowed'
);

/** Container circular inset para spinners de carregamento. */
export const jiraIntegrationSpinnerShellMdClass = cn(
  'jira-integration-spinner-shell jira-integration-spinner-shell--md',
  'flex items-center justify-center rounded-full'
);

export const jiraIntegrationSpinnerShellSmClass = cn(
  'jira-integration-spinner-shell jira-integration-spinner-shell--sm',
  'flex items-center justify-center rounded-full'
);

/**
 * Painel de progresso da importação — card elevado + barra em trilho neumórfico rebaixado.
 */
export const jiraIntegrationImportProgressPanelClass = cn(
  'jira-integration-import-progress-panel',
  leveSettingsCardClass,
  'mt-2 p-4 sm:p-5',
  'border-primary/25'
);

/** Trilho — `var(--leve-neu-inset-deep)` via CSS (`.settings-view-scope`). */
export const jiraIntegrationProgressTrackClass = cn(
  'jira-integration-progress-track mb-2 h-3 w-full overflow-hidden rounded-full'
);

/** Preenchimento — gradiente + brilho superior + sombra de volume (CSS). */
export const jiraIntegrationProgressFillClass = cn(
  'jira-integration-progress-fill h-full min-h-3 rounded-full transition-all duration-300'
);

/** Rodapé do modal — separador com profundidade (inset superior). */
export const jiraIntegrationModalFooterClass = cn(
  'jira-integration-modal-footer',
  'mt-6 flex justify-end gap-2 pt-4'
);
