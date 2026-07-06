import { cn } from '../../utils/cn';
import { projectTabPanelClass } from '../common/projectTabNeuUi';

/**
 * Tokens visuais da tela Jira x Solus — alinhados ao warm sand das abas do projeto.
 */

/** Painel elevado (importação, distribuição, lista). */
export const jiraSolusInnerPanelClass = cn(
  projectTabPanelClass,
  'jira-solus-inner-panel space-y-4'
);

export const jiraSolusSubtitleClass = cn(
  'max-w-2xl font-sans text-sm leading-relaxed text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]',
  'max-md:text-xs max-md:leading-snug'
);

export const jiraSolusSectionTitleClass = cn(
  'font-sans text-base font-bold text-[var(--brand-text-strong)] sm:text-lg'
);

export const jiraSolusBadgeClass = cn(
  'project-tab-jira-badge inline-flex items-center rounded-full px-2.5 py-0.5',
  'font-sans text-xs font-bold'
);

/* ── Toolbar de importação ───────────────────────────────────── */

export const jiraSolusToolbarClass = 'flex flex-wrap items-end gap-3';

export const jiraSolusFieldClass = 'flex min-w-0 flex-col gap-1';

export const jiraSolusFieldLabelClass = cn(
  'shrink-0 font-sans text-[10px] font-semibold uppercase tracking-wide',
  'text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]'
);

export const jiraSolusInputClass = cn(
  'h-9 min-w-[7rem] rounded-full border-0 px-3.5 font-sans text-sm',
  'bg-[color-mix(in_srgb,var(--project-workspace-highlight)_85%,var(--project-workspace-surface))]',
  'text-[var(--brand-text-strong)] placeholder:text-[color-mix(in_srgb,var(--brand-text-strong)_55%,transparent)]',
  'shadow-[var(--leve-neu-inset)]',
  'transition-[box-shadow] duration-200',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_28%,transparent)]'
);

export const jiraSolusSelectClass = jiraSolusInputClass;

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
  'border border-[color-mix(in_srgb,var(--project-workspace-shadow)_32%,transparent)]',
  'bg-[color-mix(in_srgb,var(--project-workspace-highlight)_90%,var(--project-workspace-surface))]',
  'text-[var(--brand-text-strong)] shadow-[var(--leve-neu-raised)]',
  'transition-[transform,color,border-color,box-shadow] duration-200',
  'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--project-card-accent)_28%,transparent)]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[color-mix(in_srgb,var(--project-card-accent)_45%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none'
);

/** Envelope da lista de tarefas importadas. */
export const jiraSolusListShellClass = cn(
  projectTabPanelClass,
  'jira-solus-list-shell p-2.5 sm:p-3.5 max-md:p-1.5'
);

/* ── Busca rápida ────────────────────────────────────────────── */

export const jiraSolusSearchWrapClass = 'relative';

export const jiraSolusSearchInputClass = cn(
  'jira-solus-search-input',
  'h-10 w-full rounded-full border-0 pl-10 pr-10 font-sans text-sm',
  'bg-[color-mix(in_srgb,var(--project-workspace-highlight)_85%,var(--project-workspace-surface))]',
  'text-[var(--brand-text-strong)] placeholder:text-[color-mix(in_srgb,var(--brand-text-strong)_55%,transparent)]',
  'shadow-[var(--leve-neu-inset)]',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[color-mix(in_srgb,var(--project-card-accent)_28%,transparent)]'
);

/* ── Árvore de filas JSM ─────────────────────────────────────── */

export const jiraFilasQueueTreePanelClass = cn(
  'rounded-[var(--project-card-radius)] border',
  'border-[color-mix(in_srgb,var(--project-workspace-shadow)_30%,transparent)]',
  'bg-[color-mix(in_srgb,var(--project-workspace-surface)_94%,var(--project-workspace-highlight))]',
  'font-sans shadow-[var(--leve-neu-raised)]'
);

export const jiraFilasQueueTreeTitleClass = cn(
  'flex items-center gap-2 border-b px-3 py-2.5',
  'border-[color-mix(in_srgb,var(--project-workspace-shadow)_28%,transparent)]',
  'font-sans text-sm font-bold text-[var(--brand-text-strong)]'
);

export const jiraFilasQueueTreeGroupClass = cn(
  'flex items-center gap-2 px-2 py-1.5 font-sans text-xs text-[var(--brand-text-strong)]'
);

export const jiraFilasQueueTreeItemClass = cn(
  'flex cursor-pointer items-center gap-2 py-1.5 pl-7 pr-2 font-sans text-xs text-[var(--brand-text-strong)]',
  'transition-colors hover:bg-[color-mix(in_srgb,var(--project-card-accent)_8%,transparent)]'
);

export const jiraFilasQueueTreeItemSelectedClass =
  'bg-[color-mix(in_srgb,var(--project-card-accent)_12%,transparent)]';
