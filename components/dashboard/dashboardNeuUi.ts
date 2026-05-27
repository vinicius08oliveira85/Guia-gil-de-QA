import { cn } from '../../utils/cn';
import {
  viewHeroChromeClass,
  viewHeroFilterChipClass,
  viewHeroHeaderShellClass,
  viewHeroJiraBadgeClass,
  viewHeroMobileActionBtnClass,
  viewHeroMutedClass,
  viewHeroSubtitleClass,
  viewHeroTitleClass,
  viewHeroToolbarBtnActiveClass,
  viewHeroToolbarBtnClass,
  viewHeroToolbarClass,
  viewHeroToolbarCountClass,
  viewHeroToolbarDividerClass,
  viewHeroToolbarIconClass,
  viewHeroToolbarIconWrapClass,
} from '../common/viewHeroChromeUi';
import {
  neuCardClass,
  neuCardCompactClass,
  neuCardInsetClass,
  neuDividerClass,
  neuTrackClass,
} from '../common/neuUi';

/** Escopo bege do dashboard — ativa --app-neu-* e sombras em index.css. */
export const dashboardNeuScopeClass = cn('dashboard-neu-scope', 'app-neu-scope');

export const dashboardHeroChromeClass = viewHeroChromeClass;
export const dashboardHeroHeaderShellClass = viewHeroHeaderShellClass;
export const dashboardHeroTitleClass = viewHeroTitleClass;
export const dashboardHeroJiraBadgeClass = viewHeroJiraBadgeClass;
export const dashboardHeroSubtitleClass = viewHeroSubtitleClass;
export const dashboardHeroMutedClass = viewHeroMutedClass;
export const dashboardHeroFilterChipClass = viewHeroFilterChipClass;
export const dashboardFilterToolbarClass = viewHeroToolbarClass;
export const dashboardFilterToolbarDividerClass = viewHeroToolbarDividerClass;
export const dashboardFilterBtnClass = viewHeroToolbarBtnClass;
export const dashboardFilterBtnActiveClass = viewHeroToolbarBtnActiveClass;
export const dashboardFilterIconWrapClass = viewHeroToolbarIconWrapClass;
export const dashboardFilterIconClass = viewHeroToolbarIconClass;
export const dashboardFilterCountClass = viewHeroToolbarCountClass;
export const dashboardHeroMobileActionBtnClass = viewHeroMobileActionBtnClass;

/** Poço inset do donut «Taxa de aprovação». */
export const dashboardDonutWellClass = cn(
  'dashboard-neu-donut-well',
  'dashboard-neu-insight-inset mx-auto w-[92%] max-w-[14rem] min-w-[9rem] rounded-full p-3 sm:max-w-[15rem]'
);

/** Painel principal de seção no dashboard. */
export const dashboardPanelClass = cn(neuCardClass, 'space-y-4');

export const dashboardPanelCompactClass = neuCardCompactClass;

/** Tile interno (KPI, métrica, insight). */
export const dashboardInsetTileClass = cn(
  neuCardInsetClass,
  'transition-[box-shadow] duration-200 hover:shadow-[var(--leve-neu-hover)]'
);

/** Card com hover sutil (listas, recomendações). */
export const dashboardHoverCardClass = cn(
  neuCardClass,
  'transition-[box-shadow,transform] duration-200 hover:shadow-[var(--leve-neu-hover)]'
);

export const dashboardSectionDividerClass = cn('border-t pt-4', neuDividerClass);

export const dashboardProgressTrackClass = cn(
  neuTrackClass,
  'h-2 w-full overflow-hidden rounded-full'
);

export const dashboardProgressTrackSmClass = cn(
  neuTrackClass,
  'h-1.5 w-full overflow-hidden rounded-full'
);

export const dashboardProgressFillClass = 'workspace-stat-neu-fill h-full rounded-full';

export const dashboardEmptyChartClass = cn(
  neuCardInsetClass,
  'flex h-48 items-center justify-center text-[var(--leve-header-text-muted)]'
);

export const dashboardListRowClass = cn(
  neuCardInsetClass,
  'flex items-center justify-between px-3 py-2'
);

/** Cabeçalho de seção (título + filtros). */
export const dashboardHeroClass = cn(
  neuCardClass,
  'flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between'
);

/** Trilho neutro para barras de progresso sem cor semântica. */
export const dashboardMutedBarClass =
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_14%,var(--leve-neu-bg))]';

/** Tile de categoria pendente / neutra. */
export const dashboardMutedInsetClass = cn(
  neuCardInsetClass,
  'bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))]'
);

/** Área de gráfico (line, radar). */
export const dashboardChartContainerClass = cn(
  neuCardInsetClass,
  'mt-4 h-48 rounded-[var(--rounded-box)] p-3'
);

/** Card grande (score circular, alertas). */
export const dashboardChartShellClass = cn(
  neuCardClass,
  'flex min-h-[400px] flex-col items-center justify-center p-8'
);

export const dashboardDashedPanelClass = 'neu-dashed-panel !p-4 sm:!p-6';
