import { cn } from '../../utils/cn';
import { appDarkHeroChromeMarkerClass } from './appPageNeuUi';
import {
  appNeuActionBtnActiveClass,
  appNeuActionBtnClass,
  appNeuActionIconClass,
  appNeuActionIconWrapClass,
  appNeuActionTrackClass,
} from './workspaceChromeActionUi';

/**
 * Card escuro neumórfico (#4a423e) — cabeçalho + KPIs / filtros rápidos.
 * Usado em Dashboard, Tarefas, Documentos, Regras e Meus Projetos (áreas impressas).
 */
export const viewHeroChromeClass = cn(
  'dashboard-hero-chrome project-chrome-neu-shell tasks-panel-dark-surface',
  appDarkHeroChromeMarkerClass,
  'rounded-box px-3 py-3 sm:px-4 sm:py-4',
  'flex flex-col gap-4 sm:gap-5',
  'max-md:gap-2 max-md:px-2 max-md:py-2'
);

export const viewHeroHeaderShellClass = cn(
  'view-hero-header-shell flex flex-col gap-4 font-sans sm:gap-5',
  'max-md:gap-2'
);

export const viewHeroTitleClass = cn(
  'font-sans text-2xl font-bold tracking-tight text-base-content sm:text-[1.65rem]',
  'max-md:text-xl'
);

export const viewHeroJiraBadgeClass = cn(
  'workspace-chrome-badge inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold'
);

export const viewHeroSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-base-content/72',
  'max-md:text-xs max-md:leading-snug'
);

export const viewHeroMutedClass = 'font-sans text-base-content/72';

export const viewHeroFilterChipClass = cn(
  'workspace-chrome-pill inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 font-sans text-xs',
  'text-base-content',
  '[&_button]:text-primary [&_button:hover]:text-base-content'
);

export const viewHeroToolbarClass = cn(
  'dashboard-neu-filter-toolbar',
  appNeuActionTrackClass
);

export const viewHeroToolbarDividerClass =
  'my-1.5 w-px shrink-0 self-stretch bg-base-300/55';

export const viewHeroToolbarBtnClass = cn(
  'dashboard-neu-filter-btn',
  appNeuActionBtnClass,
  'min-h-[36px] sm:min-h-0 max-md:min-h-8 max-md:px-2.5 max-md:py-1 max-md:text-xs'
);

export const viewHeroToolbarBtnActiveClass = cn(
  'dashboard-neu-filter-btn dashboard-neu-filter-btn--active',
  appNeuActionBtnActiveClass,
  'min-h-[36px] font-semibold sm:min-h-0 max-md:min-h-8 max-md:px-2.5 max-md:py-1 max-md:text-xs'
);

export const viewHeroToolbarIconWrapClass = appNeuActionIconWrapClass;

export const viewHeroToolbarIconClass = appNeuActionIconClass;

export const viewHeroToolbarCountClass = cn(
  'dashboard-neu-filter-count workspace-chrome-count-active',
  'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center px-1',
  'font-sans text-[10px] font-bold tabular-nums leading-none'
);

export const viewHeroPrimaryBtnClass = cn(
  appNeuActionBtnActiveClass,
  'min-h-[44px] gap-2 px-4 py-2 max-md:min-h-9 max-md:gap-1.5 max-md:px-3 max-md:py-1.5 max-md:text-xs sm:min-h-9',
  'hover:-translate-y-px'
);

export const viewHeroMobileActionBtnClass = cn(
  appNeuActionBtnClass,
  'min-h-[44px] gap-2 px-3 py-2 max-md:min-h-9 max-md:gap-1.5 max-md:px-2.5 max-md:py-1.5 max-md:text-xs sm:min-h-9'
);
