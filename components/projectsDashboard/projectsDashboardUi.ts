import { cn } from '../../utils/cn';
import { appDarkSidebarPanelClass, workspaceSurfaceLightClass } from '../common/appPageNeuUi';
import { appFullWidthContentClass } from '../common/viewUi';

/**
 * Fundo e escopo da página Meus Projetos — tema CLARO (identidade LandingPage /
 * Jira x Solus). `workspaceSurfaceLightClass` ativa as variáveis e overrides
 * claros em index.css, isolando a mudança das demais telas autenticadas.
 */
export const projectsDashboardPageClass = cn(
  'app-page projects-dash-page projects-dashboard-page-shell',
  workspaceSurfaceLightClass,
  'animate-fade-in min-h-[calc(100vh-4rem)] font-body'
);

/** Container principal — largura total da viewport (padding via projectsListShell). */
export const projectsDashboardContentClass = cn(
  'projects-dashboard-content',
  appFullWidthContentClass
);

/**
 * Faixa hero Meus Projetos — painel claro neumórfico (sem dashboard-hero-chrome escuro).
 */
export const projectsDashboardHeroShellClass = cn(
  'projects-dashboard-hero-shell w-full'
);

export const projectsDashboardHeroChromeClass = cn(
  'projects-dashboard-hero-chrome',
  'rounded-[var(--project-card-radius)] px-3 py-3 sm:px-5 sm:py-5',
  'flex flex-col gap-4 sm:gap-5 max-md:gap-2 max-md:px-2 max-md:py-2',
  'font-sans'
);

/** Eyebrow do workspace — pill claro (padrão LandingPage). */
export const projectsDashboardEyebrowClass = 'projects-dashboard-eyebrow';

/** Cabeçalho de seção (grade de projetos). */
export const projectsDashboardSectionLabelClass = cn(
  'projects-dashboard-section-label font-sans text-xs font-bold uppercase tracking-wider',
  'text-[var(--brand-text-strong)]'
);

export const projectsDashboardSectionDescClass = cn(
  'projects-dashboard-section-desc font-sans text-sm font-medium',
  'text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]'
);

/** Badge contador no título */
export const projectsDashboardHeaderBadgeClass = cn(
  'projects-dashboard-count-badge shrink-0 px-2 py-0.5',
  'text-[10px] font-bold uppercase tracking-widest tabular-nums'
);

export const projectsDashboardSearchBtnClass = cn(
  'projects-dash-neu-icon-btn shrink-0'
);

/** Campo de busca local — inset neumórfico (mesmo padrão do select / TasksView). */
export const projectsDashboardSearchFieldClass = cn(
  'projects-dash-neu-search-input',
  'h-11 w-full rounded-full border-0 py-2 pl-10 pr-3 font-sans text-sm font-medium',
  'max-md:h-10 max-md:pl-9 max-md:text-xs',
  'text-[var(--brand-text-strong)] placeholder:text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_40%,transparent)]'
);

export const projectsDashboardSearchIconClass =
  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]';

/** Toggle mobile do resumo — mesmo padrão dos filtros rápidos. */
export function projectsDashboardSummaryToggleClass(expanded: boolean): string {
  return cn(
    'projects-dash-quick-filters-pill w-full justify-between',
    expanded && 'projects-dash-quick-filters-pill--active',
    'lg:hidden min-h-[44px] px-3 py-2.5 text-sm font-semibold max-md:min-h-10'
  );
}

export const projectsDashboardSelectClass = cn(
  'projects-dash-neu-select select select-sm h-9 min-h-[44px] rounded-full border-0',
  'bg-[var(--workspace-stat-bg)] py-1 pl-2 pr-8 text-xs font-medium text-[var(--workspace-stat-text)]',
  'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--workspace-stat-accent)_35%,transparent)]',
  'max-md:min-h-8 max-md:h-8 sm:min-h-8 sm:h-8'
);

/** Pílulas de filtro rápido (empty state / ações auxiliares). */
export function projectsDashboardFilterPillClass(active: boolean): string {
  return cn(
    'projects-dash-filter-pill',
    active && 'projects-dash-filter-pill-active'
  );
}

/**
 * Grupo de filtros rápidos — trilho inset + pills (tema claro, aba ativa roxa/laranja via tokens).
 */
export const projectsDashboardQuickFiltersToolbarClass = cn(
  'projects-dash-quick-filters-toolbar',
  'mb-4 w-full sm:w-auto max-md:mb-2'
);

export function projectsDashboardQuickFiltersPillClass(active: boolean): string {
  return cn(
    'projects-dash-quick-filters-pill',
    active && 'projects-dash-quick-filters-pill--active',
    'min-h-[44px] max-md:min-h-8 max-md:py-1 sm:min-h-0'
  );
}

/** Badge numérico dos filtros — contador no pill laranja (creme) ou pill escuro (muted). */
export function projectsDashboardQuickFiltersCountClass(active: boolean): string {
  return cn(
    'projects-dash-quick-filters-count',
    active
      ? 'projects-dash-quick-filters-count--active'
      : 'projects-dash-quick-filters-count--idle'
  );
}

/** Painéis vazios / mensagens na grade — relevo elevado (evitar bg-surface plano). */
export const projectsDashboardMessagePanelClass = cn(
  'projects-dash-surface-raised rounded-[var(--projects-dash-radius)] p-4 text-center sm:p-5'
);

/** Selects e filtros do dashboard — inset/raised via CSS em index.css (projects-dash-neu-*). */
export const projectsDashboardNeuFieldHintClass =
  'font-sans text-xs text-[var(--workspace-stat-text-muted)]';

/** Banner de sincronização */
export function projectsDashboardSyncAlertClass(variant: 'warning' | 'error'): string {
  return cn(
    'projects-dash-alert mb-4 flex flex-col gap-2 rounded-[var(--projects-dash-radius)] p-3 text-sm sm:flex-row sm:items-center sm:justify-between',
    variant === 'error' ? 'projects-dash-alert-error' : 'projects-dash-alert-warning'
  );
}

export const projectsDashboardSyncAlertBtnClass = (variant: 'warning' | 'error') =>
  cn(
    'projects-dash-neu-btn shrink-0 px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'error' ? 'projects-dash-alert-btn-error' : 'projects-dash-alert-btn-warning'
  );

export const projectsDashboardSyncDismissClass =
  'px-2 py-1 text-xs font-medium opacity-80 transition-opacity hover:opacity-100';

export const projectsDashboardSyncAlertMutedClass =
  'mt-0.5 text-xs opacity-80';

export const projectsDashboardSyncAlertTitleClass = 'font-medium';

/** Faixa de KPIs (WorkspaceDaisyStats + Eficiência) — layout bento. */
export const projectsDashboardStatsRegionClass = cn(
  'projects-dashboard-stats-bento mb-0 mt-0 grid grid-cols-2 gap-2.5 sm:gap-3',
  'sm:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(11rem,1.35fr)] lg:items-stretch',
  'max-md:mb-2 max-md:mt-2 max-md:gap-2'
);

export const projectsDashboardGlobalEfficiencyGridClass = cn(
  'col-span-2 sm:col-span-4 lg:col-span-1 lg:row-span-2'
);

/** Ícone circular nos KPIs */
export const projectsDashboardStatIconPlateClass = 'projects-dashboard-stat-icon-plate';

/** Grade principal + sidebar */
export const projectsDashboardMainGridClass = cn(
  'mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,20rem)] lg:items-start lg:gap-6',
  'xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]'
);

export const projectsDashboardProjectGridClass = cn(
  'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 md:gap-5',
  'max-md:gap-2'
);

/**
 * Painel lateral (métricas + status) — usa o escopo de superfície da página.
 * Classe dedicada + CSS fora de @layer em index.css (prioridade sobre DaisyUI/Tailwind).
 */
export const projectsDashboardSidebarPanelClass = cn(
  appDarkSidebarPanelClass,
  'workspace-panel-neu-shell',
  'relative flex flex-col overflow-hidden font-sans gap-0 p-4 sm:p-5'
);
