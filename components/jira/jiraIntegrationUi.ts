import { cn } from '../../utils/cn';
import {
  leveSettingsCardClass,
  leveSettingsInsetPanelClass,
  leveSettingsInputClass,
  leveSettingsListClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
  leveSettingsOutlineBtnClass,
  leveSettingsPrimaryBtnFullClass,
  leveSettingsSelectClass,
  leveSettingsStrongTextClass,
  leveViewPrimaryBtnClass,
} from '../common/projectCardUi';

/** Shell principal — `leve-neu-surface` com relevo (substitui Card + bg-surface plano). */
export const jiraIntegrationShellClass = cn(leveSettingsCardClass, 'space-y-4');

/** Bloco informativo rebaixado (estado desconectado). */
export const jiraIntegrationInsetPanelClass = leveSettingsInsetPanelClass;

/** Inputs e select — trilho inset via `.app-input` / NeuSelect (index.css). */
export const jiraIntegrationInputClass = leveSettingsInputClass;
export const jiraIntegrationSelectClass = leveSettingsSelectClass;

export const jiraIntegrationTitleClass =
  'mb-2 font-sans text-xl font-bold text-[var(--leve-header-text)]';

export const jiraIntegrationSubtitleClass = leveSettingsMutedTextClass;

export const jiraIntegrationLabelClass =
  'block text-sm font-medium text-[var(--leve-header-text)]';

export const jiraIntegrationMutedXsClass = leveSettingsMutedTextXsClass;

export const jiraIntegrationStrongClass = leveSettingsStrongTextClass;

export const jiraIntegrationListClass = leveSettingsListClass;

export const jiraIntegrationPrimaryBtnClass = leveSettingsPrimaryBtnFullClass;

export const jiraIntegrationOutlineBtnClass = cn(leveSettingsOutlineBtnClass, 'text-sm');

export const jiraIntegrationImportBtnClass = cn(
  leveViewPrimaryBtnClass,
  'w-full disabled:cursor-not-allowed disabled:opacity-50'
);

/**
 * Painel de progresso da importação — card elevado + barra em trilho neumórfico rebaixado.
 */
export const jiraIntegrationImportProgressPanelClass = cn(
  leveSettingsCardClass,
  'mt-2 border-[color-mix(in_srgb,var(--leve-header-accent)_25%,transparent)]'
);

export const jiraIntegrationProgressTrackClass = 'workspace-stat-neu-track mb-2 h-2.5 w-full';

export const jiraIntegrationProgressFillClass = cn(
  'workspace-stat-neu-fill h-2.5 rounded-full transition-all duration-300',
  'bg-[var(--leve-header-accent)]'
);

export const jiraIntegrationModalFooterClass = cn(
  'mt-6 flex justify-end gap-2 border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pt-4'
);
