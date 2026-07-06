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
  projectTabSectionLabelClass,
} from '../common/projectTabNeuUi';

/**
 * Escopo claro da aba Tarefas & Testes — reexporta tokens compartilhados das abas do projeto.
 */
export const tasksViewPageShellClass = cn(
  projectTabNeuScopeClass,
  'tasks-view-page-shell',
  'tasks-panel-scope w-full min-w-0 max-w-none space-y-3 sm:space-y-4 max-md:space-y-2'
);

export const tasksViewContentClass = projectTabContentClass;
export const tasksViewHeroShellClass = projectTabHeroShellClass;
export const tasksViewHeroChromeClass = projectTabHeroChromeClass;
export const tasksViewEyebrowClass = 'project-tab-eyebrow tasks-view-eyebrow';
export const tasksViewSectionLabelClass = projectTabSectionLabelClass;
export const tasksViewSectionDescClass = projectTabSectionDescClass;
export const tasksViewPanelClass = projectTabPanelClass;
export const tasksViewListPanelClass = projectTabListPanelClass;
export const tasksViewPanelDividerClass = projectTabPanelDividerClass;
