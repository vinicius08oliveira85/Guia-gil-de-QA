import { cn } from '../../utils/cn';

/**
 * Superfície escura #4B433D + neumorfismo — fundo das telas autenticadas.
 * Estilos em index.css (fora de @layer). Não usar na landing pública.
 */
export const appDarkPageSurfaceClass = 'app-dark-page-surface';

/** Faixa hero (dashboard-hero-chrome): título, KPIs, filtros. */
export const appDarkHeroChromeMarkerClass = 'app-dark-hero-chrome';

/** Painel lateral Meus Projetos (métricas / alertas). */
export const appDarkSidebarPanelClass = 'projects-dashboard-sidebar-panel';

/**
 * Marcador no `document.body` — modais/menus em portal herdam tokens escuros
 * (ver `styles/app-global-dark-neu.css`).
 */
export const appDarkNeuRootClass = 'app-dark-neu-root';

/** Escopo da tela Configurações — tokens em index.css (`.settings-view-scope`). */
export const settingsViewScopeClass = 'settings-view-scope app-neu-scope';
