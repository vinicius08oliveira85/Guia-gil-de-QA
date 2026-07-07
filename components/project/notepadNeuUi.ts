import { cn } from '../../utils/cn';
import { projectViewPanel } from '../common/viewUi';
import { notepadViewPanelClass } from './notepadViewNeuUi';

/** Shell do Bloco de Notas — card neu com layout vertical estilo Notepad. */
export const notepadShellClass = cn(
  notepadViewPanelClass,
  'notepad-editor-shell'
);

/** Barra de menus horizontal (Arquivo, Editar, …). */
export const notepadMenuBarClass = cn(
  'flex shrink-0 flex-wrap items-center gap-0 border-b border-[var(--workspace-panel-divider)]',
  'bg-[color-mix(in_srgb,var(--workspace-panel-bg)_92%,var(--workspace-panel-neu-dark))]',
  'px-1 py-0.5'
);

/** Item de menu na barra superior. */
export const notepadMenuTriggerClass = cn(
  'rounded px-2.5 py-1 font-sans text-sm text-[var(--workspace-panel-text)]',
  'hover:bg-[color-mix(in_srgb,var(--workspace-panel-accent)_12%,transparent)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_35%,transparent)]'
);

/** Dropdown do menu. */
export const notepadMenuDropdownClass = cn(
  'absolute left-0 top-full z-30 min-w-[11rem] rounded-md border border-[var(--workspace-panel-divider)]',
  'bg-[var(--workspace-panel-bg)] py-1 shadow-[var(--workspace-panel-neu-raised)]'
);

/** Opção dentro do dropdown. */
export const notepadMenuItemClass = cn(
  'flex w-full items-center px-3 py-1.5 text-left font-sans text-sm text-[var(--workspace-panel-text)]',
  'hover:bg-[color-mix(in_srgb,var(--workspace-panel-accent)_10%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-40'
);

/** Área do editor (textarea). */
export const notepadEditorClass = cn(
  'min-h-0 w-full flex-1 resize-none border-0 bg-[var(--workspace-panel-bg)] p-3',
  'font-mono text-sm leading-relaxed text-[var(--workspace-panel-text)]',
  'outline-none focus:ring-0',
  'placeholder:text-[var(--workspace-panel-text-muted)]'
);

/** Barra de status inferior (Ln, Col, contagem). */
export const notepadStatusBarClass = cn(
  'flex shrink-0 items-center justify-between gap-2 border-t border-[var(--workspace-panel-divider)]',
  'bg-[color-mix(in_srgb,var(--workspace-panel-bg)_90%,var(--workspace-panel-neu-dark))]',
  'px-3 py-1 font-sans text-xs tabular-nums text-[var(--workspace-panel-text-muted)]'
);

/** Shell compacto da coluna fixa lateral. */
export const notepadDockShellClass = cn(
  projectViewPanel,
  'flex min-h-0 flex-1 flex-col overflow-hidden p-0'
);

/** Cabeçalho da coluna fixa. */
export const notepadDockHeaderClass = cn(
  'flex shrink-0 items-center justify-between gap-2 border-b border-[var(--workspace-panel-divider)]',
  'bg-[color-mix(in_srgb,var(--workspace-panel-bg)_92%,var(--workspace-panel-neu-dark))]',
  'px-2 py-1.5'
);

export const notepadDockTitleClass =
  'truncate font-sans text-xs font-semibold text-[var(--workspace-panel-text)]';

/** Alça de redimensionamento da coluna (borda esquerda). */
export const notepadDockResizeHandleClass = cn(
  'group relative w-2 shrink-0 cursor-col-resize touch-none',
  'bg-transparent hover:bg-[color-mix(in_srgb,var(--workspace-panel-accent)_12%,transparent)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_35%,transparent)]'
);

/** Barra de abas internas do bloco de notas. */
export const notepadPageTabsRowClass = cn(
  'flex shrink-0 items-end gap-1 overflow-x-auto border-b border-[var(--workspace-panel-divider)]',
  'bg-[color-mix(in_srgb,var(--workspace-panel-bg)_94%,var(--workspace-panel-neu-dark))]',
  'px-1.5 pt-1.5 [scroll-padding-inline:0.25rem]'
);

export const notepadPageTabClass = cn(
  'group inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-3 py-1.5',
  'font-sans text-xs leading-none text-[var(--workspace-panel-text-muted)]',
  'border-[var(--workspace-panel-divider)]',
  'hover:bg-[color-mix(in_srgb,var(--workspace-panel-accent)_8%,transparent)]'
);

export const notepadPageTabActiveClass = cn(
  notepadPageTabClass,
  'bg-[var(--workspace-panel-bg)] text-[var(--workspace-panel-text)] shadow-[var(--workspace-panel-neu-raised)]'
);

export const notepadPageTabTitleClass = 'min-w-0 flex-1 truncate text-left';

export const notepadPageTabCloseClass = cn(
  'rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
  'hover:bg-[color-mix(in_srgb,var(--workspace-panel-accent)_12%,transparent)]',
  'focus-visible:opacity-100 focus-visible:outline-none'
);

export const notepadPageTabAddClass = cn(
  'mb-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
  'text-[var(--workspace-panel-text-muted)]',
  'hover:bg-[color-mix(in_srgb,var(--workspace-panel-accent)_10%,transparent)] hover:text-[var(--workspace-panel-text)]'
);

export const notepadPageTabRenameInputClass = cn(
  'w-full min-w-0 rounded border border-[var(--workspace-panel-divider)] bg-[var(--workspace-panel-bg)]',
  'px-1 py-0 font-sans text-xs text-[var(--workspace-panel-text)] outline-none',
  'focus-visible:ring-1 focus-visible:ring-[color-mix(in_srgb,var(--workspace-panel-accent)_35%,transparent)]'
);

/** Container externo da coluna fixa. */
export const notepadDockAsideClass = cn(
  'non-printable flex min-h-0 shrink-0 flex-col',
  // A partir de md fixa altura relativa à viewport (evita encolher junto ao
  // conteúdo curto da aba ao lado, ex.: faixa md 768–1023px).
  'md:sticky md:top-[calc(var(--app-header-sticky-offset)+0.5rem)] md:self-start',
  'md:h-[min(78vh,calc(100dvh-var(--app-header-sticky-offset)-10rem))]',
  'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-40 max-md:shadow-[var(--workspace-panel-neu-raised)]'
);
