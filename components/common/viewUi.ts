/** Classes compartilhadas entre abas do projeto (Dashboard, Tarefas, Documentos, etc.). */

import { cn } from '../../utils/cn';

/** Padding horizontal alinhado ao header — conteúdo em largura total da viewport. */
export const appContentPaddingX = 'px-3 sm:px-4';

export const projectViewShell =
  'tasks-panel-scope w-full min-w-0 max-w-none space-y-3 sm:space-y-4';

/** Lista de projetos (dashboard inicial). */
export const projectsListShell =
  `tasks-panel-scope w-full min-w-0 max-w-none py-4 sm:py-5 ${appContentPaddingX}`;

export const appPanelClass = 'app-panel';

export const projectViewPanel = cn(appPanelClass, 'p-2.5 sm:p-3.5');

export const outlineActionBtn = cn(
  'app-btn-outline inline-flex min-h-[44px] items-center gap-1.5 px-2.5 py-1.5 text-sm disabled:opacity-50 sm:min-h-9 sm:gap-2 sm:px-3 sm:py-2'
);

export const primaryActionBtn = cn(
  'app-btn-primary-inline inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-50 active:scale-[0.98] sm:min-h-9 sm:gap-2 sm:px-4 sm:py-2'
);

export function filterPillClass(active: boolean): string {
  return cn('app-filter-pill', active && 'app-filter-pill-active');
}

/** Ação circular/compacta na toolbar (ícone ou texto curto). */
export const toolbarActionClass = cn('app-toolbar-action app-element-typography');

export const toolbarActionPrimaryClass = cn(
  'app-toolbar-action app-toolbar-action-primary app-element-typography'
);

/** Badge de contexto (ex.: chave do projeto Jira). */
export const contextBadgeClass = cn(
  'leve-neu-surface-inset app-element-typography shrink-0 px-2 py-0.5 text-xs font-medium text-[var(--leve-header-text-muted)]'
);

/** Chip removível de filtro ativo (dashboard, listas). */
export const activeFilterChipClass = cn(
  'leve-neu-pill app-element-typography inline-flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs text-[var(--leve-header-text-muted)]'
);

export const searchInputClass = cn(
  'app-input h-10 w-full py-2 pl-10 pr-3 text-sm'
);

/** Gatilho de select (inset) — use com NeuSelect/AppSelect. */
export const appSelectClass = cn('app-select h-9 min-h-0 text-sm');

export const appMenuPanelClass = 'app-menu-panel';

export const appMenuItemClass = 'app-menu-item text-left';

export function appMenuItemActiveClass(active: boolean): string {
  return active ? 'app-menu-item-active' : '';
}

export const appNavPillTabClass = cn(
  'app-nav-pill app-element-typography min-h-[44px] shrink-0 snap-start whitespace-nowrap px-2.5 py-1.5 text-sm font-semibold sm:min-h-0 sm:px-3 sm:py-2'
);

/** Card de métrica / bloco em trilha, timeline e análise. */
export const projectViewCard = cn('app-panel p-4 sm:p-5');

export const pageTitleClass =
  'app-element-typography font-heading text-2xl font-bold tracking-tight text-[var(--leve-header-text)] sm:text-[1.65rem]';

export const pageSubtitleClass =
  'app-element-typography w-full text-sm leading-relaxed text-[var(--leve-header-text-muted)]';

/** Container de telas globais (ex.: Configurações). */
export const settingsContentShell = `w-full min-w-0 max-w-none ${appContentPaddingX}`;

/** Grades responsivas para preencher largura disponível. */
export const denseCardGrid =
  'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

export const documentCardGrid =
  'grid w-full grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3';

export const strategicAnalysisGrid =
  'grid w-full grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3';

export const compactMetricTile = cn('leve-neu-surface-inset p-3 sm:p-4');
