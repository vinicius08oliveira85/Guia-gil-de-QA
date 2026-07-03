import { cn } from '../../utils/cn';
import { appDarkSidebarPanelClass, workspaceSurfaceLightClass } from '../common/appPageNeuUi';
import {
  viewHeroToolbarBtnActiveClass,
  viewHeroToolbarBtnClass,
  viewHeroToolbarClass,
  viewHeroToolbarDividerClass,
} from '../common/viewHeroChromeUi';

/**
 * Fundo e escopo da página Meus Projetos — tema CLARO (identidade LandingPage /
 * Jira x Solus). `workspaceSurfaceLightClass` ativa as variáveis e overrides
 * claros em index.css, isolando a mudança das demais telas autenticadas.
 */
export const projectsDashboardPageClass = cn(
  'app-page projects-dash-page',
  workspaceSurfaceLightClass,
  'animate-fade-in min-h-[calc(100vh-4rem)] font-body'
);

/** Badge "Workspace" e chips do cabeçalho */
export const projectsDashboardHeaderBadgeClass = cn(
  'projects-dash-neu-badge shrink-0 px-2.5 py-0.5',
  'text-[10px] font-bold uppercase tracking-widest'
);

export const projectsDashboardSearchBtnClass = cn(
  'projects-dash-neu-icon-btn shrink-0'
);

/** Campo de busca local — inset neumórfico (mesmo padrão do select / TasksView). */
export const projectsDashboardSearchFieldClass = cn(
  'projects-dash-neu-search-input',
  'h-11 w-full rounded-full border-0 py-2 pl-10 pr-3 font-sans text-sm font-medium',
  'max-md:h-10 max-md:pl-9 max-md:text-xs',
  'text-[var(--workspace-panel-text)] placeholder:text-[var(--workspace-panel-text-muted)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_40%,transparent)]'
);

export const projectsDashboardSearchIconClass =
  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--workspace-panel-text-muted)] opacity-80';

/** Toggle mobile do resumo — pill elevado do hero (mesmo padrão dos filtros). */
export function projectsDashboardSummaryToggleClass(expanded: boolean): string {
  return cn(
    expanded ? viewHeroToolbarBtnActiveClass : viewHeroToolbarBtnClass,
    'lg:hidden w-full justify-between min-h-[44px] px-3 py-2.5 text-sm font-semibold',
    'max-md:min-h-10'
  );
}

export const projectsDashboardSelectClass = cn(
  'projects-dash-neu-select select select-sm h-9 min-h-[44px] rounded-full border-0',
  'bg-[var(--workspace-stat-bg)] py-1 pl-2 pr-8 text-xs font-medium text-[var(--workspace-stat-text)]',
  'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--workspace-stat-accent)_35%,transparent)]',
  'max-md:min-h-8 max-md:h-8 sm:min-h-8 sm:h-8'
);

/** Pílulas de filtro rápido (Todos / Com bugs / Atenção) — modelo Filtrar/Exportar */
export function projectsDashboardFilterPillClass(active: boolean): string {
  return active ? viewHeroToolbarBtnActiveClass : viewHeroToolbarBtnClass;
}

/** Grupo de filtros rápidos — trilho inset + pills elevados individuais */
export const projectsDashboardQuickFiltersToolbarClass = cn(
  viewHeroToolbarClass,
  'mb-4 w-full sm:w-auto',
  'max-md:mb-2'
);

export function projectsDashboardQuickFiltersPillClass(active: boolean): string {
  return cn(
    active ? viewHeroToolbarBtnActiveClass : viewHeroToolbarBtnClass,
    'min-h-[44px] max-md:min-h-8 max-md:py-1 sm:min-h-0'
  );
}

/** Badge numérico dos filtros (idle/active), padrão backlog / toolbar do hero. */
export function projectsDashboardQuickFiltersCountClass(active: boolean): string {
  return cn(
    'dashboard-neu-filter-count',
    'inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1.5 py-0',
    'font-sans text-[10px] font-bold tabular-nums leading-none',
    active ? 'workspace-chrome-count-active' : 'workspace-chrome-count-idle'
  );
}

export const projectsDashboardQuickFiltersDividerClass = viewHeroToolbarDividerClass;

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

/** Faixa de KPIs (WorkspaceDaisyStats + Eficiência) */
export const projectsDashboardStatsRegionClass = cn(
  'mb-4 mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(12rem,1.35fr)] lg:items-stretch',
  'max-md:mb-2 max-md:mt-2 max-md:gap-2'
);

/** Grade principal + sidebar */
export const projectsDashboardMainGridClass = cn(
  'mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,20rem)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]'
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
