import { cn } from '../../utils/cn';
import {
  projectTabContentClass,
  projectTabEyebrowClass,
  projectTabHeaderShellClass,
  projectTabHeroChromeClass,
  projectTabHeroJiraBadgeClass,
  projectTabHeroShellClass,
  projectTabHeroSubtitleClass,
  projectTabHeroTitleClass,
  projectTabListPanelClass,
  projectTabNeuScopeClass,
  projectTabPanelClass,
  projectTabSectionDescClass,
  projectTabSectionHeaderClass,
  projectTabSectionHeaderFollowClass,
  projectTabSectionLabelClass,
} from '../common/projectTabNeuUi';

/** Escopo claro da aba Regras de negócio. */
export const businessRulesViewPageShellClass = cn(
  projectTabNeuScopeClass,
  'business-rules-view-page-shell business-rules-view-scope tasks-panel-scope',
  'w-full min-w-0 max-w-none space-y-3 sm:space-y-4 max-md:space-y-2'
);

export const businessRulesViewContentClass = projectTabContentClass;
export const businessRulesViewHeroShellClass = projectTabHeroShellClass;
export const businessRulesViewHeroChromeClass = projectTabHeroChromeClass;
export const businessRulesViewEyebrowClass = projectTabEyebrowClass;
export const businessRulesViewHeaderShellClass = projectTabHeaderShellClass;
export const businessRulesViewHeroTitleClass = projectTabHeroTitleClass;
export const businessRulesViewHeroJiraBadgeClass = projectTabHeroJiraBadgeClass;
export const businessRulesViewHeroSubtitleClass = projectTabHeroSubtitleClass;
export const businessRulesViewSectionLabelClass = projectTabSectionLabelClass;
export const businessRulesViewSectionDescClass = projectTabSectionDescClass;
export const businessRulesViewSectionHeaderClass = projectTabSectionHeaderClass;
export const businessRulesViewSectionHeaderFollowClass = projectTabSectionHeaderFollowClass;
export const businessRulesViewPanelClass = projectTabPanelClass;
export const businessRulesViewListPanelClass = projectTabListPanelClass;
