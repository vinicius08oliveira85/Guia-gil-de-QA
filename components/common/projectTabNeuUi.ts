import { cn } from '../../utils/cn';
import { workspaceSurfaceLightClass } from '../common/appPageNeuUi';
import { appFullWidthContentClass } from '../common/viewUi';

/**
 * Tokens compartilhados das abas internas do projeto (Dashboard, Tarefas,
 * Documentos, Regras) — hero claro, seções e painéis elevados.
 * Paleta de fundo: `--project-workspace-*` em index.css (warm sand, não branco puro).
 */

/** Shell ambient das abas do projeto — ativa tokens warm sand + gradientes. */
export const projectTabPageShellClass = 'project-tab-page-shell';

export const projectTabContentClass = cn('project-tab-content', appFullWidthContentClass);
export const projectTabHeroShellClass = 'project-tab-hero-shell w-full';

export const projectTabHeroChromeClass = cn(
  'project-tab-hero-chrome',
  'rounded-box border border-base-300 bg-base-100',
  'rounded-[var(--project-card-radius)] px-3 py-3 sm:px-5 sm:py-5',
  'flex flex-col gap-4 sm:gap-5 max-md:gap-2 max-md:px-2 max-md:py-2',
  'font-sans'
);

export const projectTabEyebrowClass = 'project-tab-eyebrow';

export const projectTabHeroTitleClass = cn(
  'app-brand-title font-sans text-2xl font-bold tracking-tight text-base-content sm:text-[1.65rem]',
  'max-md:text-xl'
);

export const projectTabHeroJiraBadgeClass = cn(
  'project-tab-jira-badge inline-flex shrink-0 items-center rounded-[2rem] px-2.5 py-0.5',
  'font-sans text-xs font-bold text-primary'
);

export const projectTabHeroSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]',
  'max-md:text-xs max-md:leading-snug'
);

export const projectTabSectionLabelClass = cn(
  'project-tab-section-label font-sans text-xs font-bold uppercase tracking-wider',
  'text-[var(--brand-text-strong)]'
);

export const projectTabSectionDescClass = cn(
  'project-tab-section-desc font-sans text-sm font-medium',
  'text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]'
);

export const projectTabSectionHeaderBaseClass = cn(
  'project-tab-section-header flex min-w-0 flex-col gap-1 sm:gap-1.5',
  'border-b border-base-300/55 pb-3 sm:pb-3.5'
);

/** Cabeçalho entre painéis — alinhado ao recuo interno dos cards (`project-tab-panel`). */
export const projectTabSectionHeaderClass = cn(
  projectTabSectionHeaderBaseClass,
  'px-3 sm:px-4 max-md:px-2',
  'mb-3 sm:mb-4 max-md:mb-2'
);

/** Mesmo cabeçalho após um painel (espaço superior extra). */
export const projectTabSectionHeaderFollowClass = cn(
  projectTabSectionHeaderClass,
  'mt-3 sm:mt-4 max-md:mt-2'
);

/** Cabeçalho dentro de um painel que já possui padding. */
export const projectTabInlineSectionHeaderClass = cn(
  projectTabSectionHeaderBaseClass,
  'mb-2 sm:mb-3'
);

export const projectTabPanelClass = cn(
  'project-tab-panel',
  'relative flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 p-3 font-sans sm:p-4',
  'max-md:p-2'
);

export const projectTabListPanelClass = cn(
  projectTabPanelClass,
  'project-tab-list-panel p-2.5 sm:p-3.5 max-md:p-1.5'
);

export const projectTabPanelDividerClass = cn(
  'mt-4 border-t border-[color-mix(in_srgb,var(--project-workspace-shadow)_28%,transparent)] pt-3',
  'max-md:mt-2 max-md:pt-2'
);

export const projectTabHeaderShellClass = cn(
  'project-tab-header-shell view-hero-header-shell',
  'flex flex-col gap-3 font-sans sm:gap-4',
  'max-md:gap-2'
);

/** Escopo base claro para abas do projeto. */
export const projectTabNeuScopeClass = cn(
  projectTabPageShellClass,
  'project-tab-neu-scope app-neu-scope',
  workspaceSurfaceLightClass
);
