import { cn } from '../../utils/cn';
import {
  projectTabContentClass,
  projectTabHeroChromeClass,
  projectTabHeroJiraBadgeClass,
  projectTabHeroShellClass,
  projectTabHeroSubtitleClass,
  projectTabHeroTitleClass,
  projectTabListPanelClass,
  projectTabNeuScopeClass,
  projectTabPanelClass,
  projectTabPanelDividerClass,
  projectTabSectionDescClass,
  projectTabInlineSectionHeaderClass,
  projectTabSectionLabelClass,
} from '../common/projectTabNeuUi';
import { appContentPaddingX } from '../common/viewUi';

/**
 * Escopo da tela Acompanhamento (Jira x Solus) — warm sand + hero claro.
 */
export const jiraSolusViewPageShellClass = cn(
  projectTabNeuScopeClass,
  'jira-solus-page-shell jira-solus-view-scope tasks-panel-scope',
  'animate-fade-in min-h-[calc(100vh-4rem)] font-body',
  'w-full min-w-0 max-w-none',
  appContentPaddingX
);

export const jiraSolusViewContentClass = projectTabContentClass;

/** Chrome superior (breadcrumbs + abas). */
export const jiraSolusChromeHeaderClass = cn(
  projectTabPanelClass,
  'jira-solus-chrome-header mb-3 sm:mb-4 max-md:mb-2',
  'px-3 py-2 sm:px-4 sm:py-3 max-md:px-2 max-md:py-1.5'
);

export const jiraSolusPanelsAreaClass = cn(
  'jira-solus-panels-area space-y-3 sm:space-y-4 max-md:space-y-2'
);

export const jiraSolusHeroShellClass = cn(projectTabHeroShellClass, 'jira-solus-hero-shell');
export const jiraSolusHeroChromeClass = cn(projectTabHeroChromeClass, 'jira-solus-hero-chrome');
export const jiraSolusEyebrowClass = cn('project-tab-eyebrow jira-solus-eyebrow');
export const jiraSolusHeroTitleClass = projectTabHeroTitleClass;
export const jiraSolusHeroJiraBadgeClass = projectTabHeroJiraBadgeClass;
export const jiraSolusHeroSubtitleClass = projectTabHeroSubtitleClass;
export const jiraSolusSectionLabelClass = projectTabSectionLabelClass;
export const jiraSolusSectionDescClass = projectTabSectionDescClass;
export const jiraSolusSectionHeaderClass = projectTabInlineSectionHeaderClass;
export const jiraSolusPanelClass = projectTabPanelClass;
export const jiraSolusListPanelClass = projectTabListPanelClass;
export const jiraSolusPanelDividerClass = projectTabPanelDividerClass;

/** Grade bento de KPIs (Dashboard Filas). */
export const jiraSolusKpiGridClass = cn(
  'jira-solus-kpi-grid grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 max-md:gap-2',
  'xl:grid-cols-5 2xl:grid-cols-6'
);

export const jiraSolusKpiCardClass = cn(
  'jira-solus-kpi-card dashboard-project-kpi-card',
  'flex w-full cursor-pointer flex-col items-start gap-1.5 rounded-[var(--project-card-inner-radius)]',
  'border border-[color-mix(in_srgb,var(--project-workspace-shadow)_26%,transparent)]',
  'bg-[color-mix(in_srgb,var(--project-workspace-highlight)_88%,var(--project-workspace-surface))]',
  'p-3 text-left shadow-[var(--leve-neu-raised)] transition-[transform,box-shadow,border-color] duration-200',
  'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--project-card-accent)_22%,transparent)]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_35%,transparent)]',
  'motion-reduce:transform-none'
);

export const jiraSolusKpiCardActiveClass =
  'jira-solus-kpi-card--active border-[color-mix(in_srgb,var(--project-card-accent)_32%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--project-card-accent)_18%,transparent)]';

export const jiraSolusKpiIconPlateClass = 'dashboard-project-kpi-icon-plate';

export const jiraSolusKpiLabelClass = cn(
  'font-sans text-[10px] font-semibold uppercase tracking-wide',
  'text-[color-mix(in_srgb,var(--brand-text-strong)_72%,transparent)] sm:text-[11px]'
);

export const jiraSolusKpiValueClass = cn(
  'font-sans text-xl font-bold tabular-nums text-[var(--brand-text-strong)] sm:text-2xl'
);
