import { cn } from '../../utils/cn';
import { workspaceSurfaceLightClass } from '../common/appPageNeuUi';
import { projectTabContentClass, projectTabPageShellClass } from '../common/projectTabNeuUi';
import {
  viewHeroFilterChipClass,
  viewHeroMobileActionBtnClass,
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

/**
 * Escopo claro do dashboard — ativa `--app-neu-*` / `--leve-*` claros (LandingPage)
 * e a paleta clara de `--workspace-panel-*` no chrome/hero.
 */
export const dashboardNeuScopeClass = cn(
  'dashboard-neu-scope',
  projectTabPageShellClass,
  'dashboard-project-page-shell',
  'app-neu-scope',
  workspaceSurfaceLightClass,
  'w-full min-w-0 max-w-none space-y-3 sm:space-y-4 max-md:space-y-2'
);

/** Container centralizado — stack vertical com ritmo entre hero, grade e atividades. */
export const dashboardContentClass = projectTabContentClass;

export const dashboardMainStackClass = cn(
  dashboardContentClass,
  'dashboard-main-stack flex flex-col gap-4 sm:gap-5 lg:gap-6 max-md:gap-3'
);

/** Cabeçalho da seção «Qualidade e execução». */
export const dashboardInsightsSectionHeaderClass = cn(
  'flex flex-col gap-0.5 border-b border-base-300 pb-3 sm:pb-3.5'
);

/** Shell externo do hero (gradiente + painel elevado). */
export const dashboardHeroShellClass = 'dashboard-project-hero-shell w-full';

/**
 * Faixa hero do dashboard do projeto — tema CLARO (sem dashboard-hero-chrome escuro).
 */
export const dashboardHeroChromeClass = cn(
  'dashboard-project-hero-chrome',
  'rounded-box border border-base-300 bg-base-100',
  'rounded-[var(--project-card-radius)] px-3 py-3 sm:px-5 sm:py-5',
  'flex flex-col gap-4 sm:gap-5 max-md:gap-2 max-md:px-2 max-md:py-2',
  'font-sans'
);

/** Eyebrow acima do título do dashboard. */
export const dashboardEyebrowClass = 'dashboard-project-eyebrow';

export const dashboardHeroHeaderShellClass = cn(
  'view-hero-header-shell flex flex-col gap-3 font-sans sm:gap-4',
  'max-md:gap-2'
);

export const dashboardHeroTitleClass = cn(
  'app-brand-title font-sans text-2xl font-bold tracking-tight text-[var(--brand-text-strong)] sm:text-[1.65rem]',
  'max-md:text-xl'
);

export const dashboardHeroJiraBadgeClass = cn(
  'dashboard-project-jira-badge inline-flex shrink-0 items-center rounded-[2rem] px-2.5 py-0.5',
  'font-sans text-xs font-bold text-primary'
);

export const dashboardHeroSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]',
  'max-md:text-xs max-md:leading-snug'
);

export const dashboardHeroMutedClass =
  'font-sans text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]';
export const dashboardHeroFilterChipClass = viewHeroFilterChipClass;
export const dashboardFilterToolbarClass = viewHeroToolbarClass;
export const dashboardFilterToolbarDividerClass = viewHeroToolbarDividerClass;
export const dashboardFilterBtnClass = viewHeroToolbarBtnClass;
export const dashboardFilterBtnActiveClass = viewHeroToolbarBtnActiveClass;
export const dashboardFilterIconWrapClass = viewHeroToolbarIconWrapClass;
export const dashboardFilterIconClass = viewHeroToolbarIconClass;
export const dashboardFilterCountClass = viewHeroToolbarCountClass;
export const dashboardHeroMobileActionBtnClass = viewHeroMobileActionBtnClass;

/** Placa circular nos KPIs do hero. */
export const dashboardKpiIconPlateClass = 'dashboard-project-kpi-icon-plate';

/** Grade bento dos cards de insight (ProjectDashboard). */
export const dashboardInsightsBentoGridClass = cn(
  'dashboard-insights-bento grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5',
  'lg:auto-rows-[minmax(11rem,auto)]'
);

export const dashboardInsightCardFeaturedGridClass = 'lg:row-span-2';

/** Cabeçalho da seção de insights. */
export const dashboardInsightsSectionLabelClass = cn(
  'dashboard-insights-section-label font-sans text-xs font-bold uppercase tracking-wider',
  'text-[var(--brand-text-strong)]'
);

export const dashboardInsightsSectionDescClass = cn(
  'dashboard-insights-section-desc font-sans text-sm font-medium',
  'text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]'
);

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
  'flex h-48 items-center justify-center text-base-content/72'
);

export const dashboardListRowClass = cn(
  neuCardInsetClass,
  'flex items-center justify-between px-3 py-2'
);

/** Cabeçalho de seção (título + filtros). */
export const dashboardHeroClass = cn(
  neuCardClass,
  'flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between',
  'max-md:gap-2 max-md:px-3 max-md:py-3'
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

/** Banner de carregamento / sincronização. */
export const dashboardLoadingBannerClass = cn(
  'leve-neu-surface-inset flex items-center gap-2 px-3 py-2.5 text-sm',
  'text-base-content/72'
);

/** Alerta de erro do store. */
export const dashboardErrorBannerClass = cn(
  'leve-neu-surface-inset border border-error/30 px-3 py-2.5 text-sm text-error',
  'bg-[color-mix(in_srgb,var(--destructive)_8%,var(--leve-neu-bg))]'
);

/** Empty state dentro do dashboard — painel elevado. */
export const dashboardEmptyStateShellClass = cn(
  'dashboard-empty-state-shell rounded-box border border-base-300 bg-base-100 px-4 py-6 sm:px-6 sm:py-8'
);

/** Poço para sparkline / blocos interativos leves. */
export const dashboardInsightWellClass = cn(
  'dashboard-neu-insight-inset inline-block rounded-[var(--project-dashboard-insight-inner-radius)] p-2'
);
