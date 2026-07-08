import { cn } from '../../utils/cn';
import { notepadViewPanelClass } from './notepadViewNeuUi';

const neuRaised = 'shadow-[var(--workspace-panel-neu-raised)]';

/** Shell do Bloco de Notas — card neu com layout vertical estilo Notepad. */
export const notepadShellClass = cn(
  notepadViewPanelClass,
  'notepad-editor-shell'
);

/** Barra de menus horizontal (Arquivo, Editar, …). */
export const notepadMenuBarClass = cn(
  'flex shrink-0 flex-wrap items-center gap-0 border-b border-base-300',
  'bg-base-200/92 px-1 py-0.5'
);

/** Item de menu na barra superior. */
export const notepadMenuTriggerClass = cn(
  'rounded px-2.5 py-1 font-sans text-sm text-base-content',
  'hover:bg-primary/12',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35'
);

/** Dropdown do menu. */
export const notepadMenuDropdownClass = cn(
  'absolute left-0 top-full z-30 min-w-[11rem] rounded-md border border-base-300',
  'bg-base-100 py-1',
  neuRaised
);

/** Opção dentro do dropdown. */
export const notepadMenuItemClass = cn(
  'flex w-full items-center px-3 py-1.5 text-left font-sans text-sm text-base-content',
  'hover:bg-primary/10',
  'disabled:cursor-not-allowed disabled:opacity-40'
);

/** Área do editor (textarea). */
export const notepadEditorClass = cn(
  'min-h-0 w-full flex-1 resize-none border-0 bg-base-100 p-3',
  'font-mono text-sm leading-relaxed text-base-content',
  'outline-none focus:ring-0',
  'placeholder:text-base-content/72'
);

/** Barra de status inferior (Ln, Col, contagem). */
export const notepadStatusBarClass = cn(
  'flex shrink-0 items-center justify-between gap-2 border-t border-base-300',
  'bg-base-200/90 px-3 py-1 font-sans text-xs tabular-nums text-base-content/72'
);

/**
 * Shell compacto da coluna fixa lateral.
 * A moldura arredondada + sombra vivem no `notepadDockAsideClass`; aqui é apenas
 * o contêiner flexível que preenche a altura, evitando dupla borda/raio (redondo
 * dentro de quadrado).
 */
export const notepadDockShellClass = cn(
  'flex min-h-0 flex-1 flex-col overflow-hidden bg-base-100'
);

/** Cabeçalho da coluna fixa. */
export const notepadDockHeaderClass = cn(
  'flex shrink-0 items-center justify-between gap-2 border-b border-base-300',
  'bg-base-200/92 px-2 py-1.5'
);

export const notepadDockTitleClass =
  'truncate font-sans text-xs font-semibold text-base-content';

/** Alça de redimensionamento da coluna (borda esquerda). */
export const notepadDockResizeHandleClass = cn(
  'group relative w-2 shrink-0 cursor-col-resize touch-none',
  'bg-transparent hover:bg-primary/12',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35'
);

/** Barra de abas internas do bloco de notas. */
export const notepadPageTabsRowClass = cn(
  'flex shrink-0 items-end gap-1 overflow-x-auto border-b border-base-300',
  'bg-base-200/94 px-1.5 pt-1.5 [scroll-padding-inline:0.25rem]'
);

export const notepadPageTabClass = cn(
  'group inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-3 py-1.5',
  'font-sans text-xs leading-none text-base-content/72',
  'border-base-300',
  'hover:bg-primary/8'
);

export const notepadPageTabActiveClass = cn(
  notepadPageTabClass,
  'bg-base-100 text-base-content',
  neuRaised
);

export const notepadPageTabTitleClass = 'min-w-0 flex-1 truncate text-left';

export const notepadPageTabCloseClass = cn(
  'rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
  'hover:bg-primary/12',
  'focus-visible:opacity-100 focus-visible:outline-none'
);

export const notepadPageTabAddClass = cn(
  'mb-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
  'text-base-content/72',
  'hover:bg-primary/10 hover:text-base-content'
);

export const notepadPageTabRenameInputClass = cn(
  'w-full min-w-0 rounded border border-base-300 bg-base-100',
  'px-1 py-0 font-sans text-xs text-base-content outline-none',
  'focus-visible:ring-1 focus-visible:ring-primary/35'
);

/**
 * Container externo da coluna fixa — moldura única arredondada que recorta o
 * cabeçalho, o editor e a barra de status (cantos consistentes) e ocupa a altura
 * disponível até quase o fim da viewport. No mobile vira gaveta lateral sem raio.
 */
export const notepadDockAsideClass = cn(
  'non-printable flex min-h-0 shrink-0 flex-col overflow-hidden rounded-box border border-base-300 bg-base-100',
  'md:sticky md:top-[calc(var(--app-header-sticky-offset)+0.5rem)] md:self-start',
  'md:h-[calc(100dvh-var(--app-header-sticky-offset)-1.5rem)]',
  'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-40 max-md:rounded-none max-md:border-0',
  neuRaised
);
