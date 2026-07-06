import { cn } from '../../utils/cn';
import {
  projectTabContentClass,
  projectTabHeroChromeClass,
  projectTabHeroShellClass,
  projectTabListPanelClass,
  projectTabNeuScopeClass,
  projectTabPanelClass,
  projectTabPanelDividerClass,
  projectTabSectionDescClass,
  projectTabSectionHeaderClass,
  projectTabSectionLabelClass,
} from '../common/projectTabNeuUi';

/** Escopo claro da aba Documentos. */
export const documentsViewPageShellClass = cn(
  projectTabNeuScopeClass,
  'documents-view-page-shell documents-view-scope tasks-panel-scope',
  'w-full min-w-0 max-w-none space-y-3 sm:space-y-4 max-md:space-y-2'
);

export const documentsViewContentClass = projectTabContentClass;
export const documentsViewHeroShellClass = projectTabHeroShellClass;
export const documentsViewHeroChromeClass = projectTabHeroChromeClass;
export const documentsViewSectionLabelClass = projectTabSectionLabelClass;
export const documentsViewSectionDescClass = projectTabSectionDescClass;
export const documentsViewSectionHeaderClass = projectTabSectionHeaderClass;
export const documentsViewPanelClass = projectTabPanelClass;
export const documentsViewListPanelClass = projectTabListPanelClass;
export const documentsViewPanelDividerClass = projectTabPanelDividerClass;

/** Eyebrow específico da aba Documentos. */
export const documentsViewEyebrowClass = 'project-tab-eyebrow documents-view-eyebrow';
