/** Classes compartilhadas entre abas do projeto (Dashboard, Tarefas, Documentos, etc.). */

export const projectViewShell =
  'tasks-panel-scope mx-auto w-full max-w-[90rem] space-y-4 sm:space-y-5';

export const projectViewPanel =
  'rounded-[var(--rounded-box)] border border-base-300/60 bg-base-100 p-3 soft-shadow sm:p-4';

export const outlineActionBtn =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-base-300/80 bg-base-100 px-3 py-2 text-sm font-medium text-base-content/85 shadow-sm transition-colors hover:border-base-300 hover:bg-base-200/50 disabled:opacity-50 sm:min-h-9';

export const primaryActionBtn =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg border-0 bg-[var(--brand-cta)] px-4 py-2 text-sm font-semibold text-[var(--brand-cta-foreground)] shadow-sm transition-all hover:brightness-[0.97] active:scale-[0.98] disabled:opacity-50 sm:min-h-9';

export function filterPillClass(active: boolean): string {
  return active
    ? 'rounded-lg bg-[var(--brand-cta)] px-3 py-1.5 text-sm font-medium text-[var(--brand-cta-foreground)] shadow-sm'
    : 'rounded-lg border border-base-300/80 bg-base-100 px-3 py-1.5 text-sm font-medium text-base-content/75 transition-colors hover:bg-base-200/60';
}

export const searchInputClass =
  'h-10 w-full rounded-lg border border-base-300/80 bg-base-100 py-2 pl-10 pr-3 text-sm text-base-content shadow-sm placeholder:text-base-content/45 focus:border-[color-mix(in_srgb,var(--brand-cta)_50%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-cta)_22%,transparent)]';

/** Card de métrica / bloco em trilha, timeline e análise. */
export const projectViewCard =
  'rounded-[var(--rounded-box)] border border-base-300/60 bg-base-100 p-4 soft-shadow sm:p-5';

export const pageTitleClass =
  'font-heading text-2xl font-bold tracking-tight text-base-content sm:text-[1.65rem]';

export const pageSubtitleClass = 'w-full text-sm leading-relaxed text-base-content/70';

/** Container de telas globais (ex.: Configurações). */
export const settingsContentShell = 'container mx-auto w-full max-w-[90rem] px-4 sm:px-6';

/** Grades responsivas para preencher largura disponível. */
export const denseCardGrid =
  'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

export const documentCardGrid =
  'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

export const strategicAnalysisGrid =
  'grid w-full grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3';

export const compactMetricTile =
  'rounded-xl border border-base-300/60 bg-base-200/40 p-3 sm:p-4';
