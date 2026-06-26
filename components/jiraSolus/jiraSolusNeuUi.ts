import { cn } from '../../utils/cn';

/**
 * Identidade visual clara/neumórfica da tela Jira x Solus — mesma linguagem
 * da LandingPage (fundo bege `--app-neu-bg`, painel branco `app-surface`,
 * título com gradiente de marca e cards roxos `--project-card-*`).
 */

/* ── Painel branco (envelope) ─────────────────────────────────── */

export const jiraSolusInnerPanelClass = cn(
  'app-surface rounded-[var(--leve-header-radius)] p-4 font-sans sm:p-5'
);

/* ── Tipografia de marca ──────────────────────────────────────── */

export const jiraSolusSubtitleClass = cn(
  'mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--brand-text-muted)] sm:text-base'
);

export const jiraSolusSectionTitleClass = cn(
  'font-sans text-lg font-bold text-[var(--brand-text-strong)] sm:text-xl'
);

export const jiraSolusBadgeClass = cn(
  'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold',
  'bg-[var(--brand-chip)] text-[var(--brand-text-strong)]'
);

/* ── Toolbar de importação (campos + botões claros) ───────────── */

export const jiraSolusToolbarClass = 'flex flex-wrap items-end gap-3';

export const jiraSolusFieldClass = 'flex min-w-0 flex-col gap-1';

export const jiraSolusFieldLabelClass = cn(
  'shrink-0 font-sans text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-text-muted)]'
);

export const jiraSolusInputClass = cn(
  'h-9 min-w-[7rem] rounded-full border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] px-3.5',
  'font-sans text-sm text-[var(--brand-text-strong)] placeholder:text-[var(--brand-text-muted)]',
  'transition-[border-color,box-shadow] duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]'
);

export const jiraSolusSelectClass = cn(
  'h-9 min-w-[10rem] rounded-full border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] px-3.5',
  'font-sans text-sm text-[var(--brand-text-strong)]'
);

export const jiraSolusPrimaryBtnClass = cn(
  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 font-sans text-sm font-semibold',
  'bg-[var(--project-card-accent)] text-[var(--brand-cta-foreground)]',
  'shadow-[0_2px_8px_color-mix(in_srgb,var(--project-card-accent)_35%,transparent)]',
  'transition-[transform,box-shadow,background-color] duration-200',
  'hover:-translate-y-0.5 hover:bg-[var(--brand-cta-hover)]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none'
);

export const jiraSolusSecondaryBtnClass = cn(
  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 font-sans text-sm font-semibold',
  'border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] text-[var(--brand-text-strong)]',
  'transition-[transform,color,border-color] duration-200',
  'hover:-translate-y-0.5 hover:text-[var(--project-card-accent)]',
  'hover:border-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none'
);

/* ── Lista de tarefas importadas ──────────────────────────────── */

export const jiraSolusListShellClass = cn(
  'rounded-[var(--leve-header-radius)] bg-[color-mix(in_srgb,var(--app-neu-bg)_70%,white)] p-2 sm:p-3'
);

/* ── Busca rápida (input claro) ───────────────────────────────── */

export const jiraSolusSearchWrapClass = 'relative';

export const jiraSolusSearchInputClass = cn(
  'h-10 w-full rounded-full border border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] pl-10 pr-10',
  'font-sans text-sm text-[var(--brand-text-strong)] placeholder:text-[var(--brand-text-muted)]',
  'transition-[border-color,box-shadow] duration-200',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]'
);

/* ── Árvore de filas JSM (sidebar) ───────────────────────────── */

export const jiraFilasQueueTreePanelClass = cn(
  'rounded-[var(--leve-header-radius)] border border-[var(--brand-surface-border)]',
  'bg-[color-mix(in_srgb,var(--app-neu-bg)_55%,white)] font-sans'
);

export const jiraFilasQueueTreeTitleClass = cn(
  'flex items-center gap-2 border-b border-[var(--brand-surface-border)] px-3 py-2.5',
  'font-sans text-sm font-bold text-[var(--brand-text-strong)]'
);

export const jiraFilasQueueTreeGroupClass = cn(
  'flex items-center gap-2 px-2 py-1.5',
  'font-sans text-xs text-[var(--brand-text-strong)]'
);

export const jiraFilasQueueTreeItemClass = cn(
  'flex cursor-pointer items-center gap-2 py-1.5 pl-7 pr-2',
  'font-sans text-xs text-[var(--brand-text-strong)]',
  'transition-colors hover:bg-[color-mix(in_srgb,var(--project-card-accent)_8%,transparent)]'
);

export const jiraFilasQueueTreeItemSelectedClass =
  'bg-[color-mix(in_srgb,var(--project-card-accent)_12%,transparent)]';
