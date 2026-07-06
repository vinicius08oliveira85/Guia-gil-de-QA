import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { Project } from '../../types';
import { downloadFile } from '../../utils/exportService';
import { useNotepadPages } from '../../hooks/useNotepadPages';
import { DEFAULT_NOTEPAD_PAGE_TITLE } from '../../utils/notepadPages';
import { cn } from '../../utils/cn';
import {
  notepadViewContentClass,
  notepadViewPageShellClass,
  notepadViewPanelClass,
} from './notepadViewNeuUi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NotepadPageTabs } from './NotepadPageTabs';
import {
  notepadDockShellClass,
  notepadEditorClass,
  notepadMenuBarClass,
  notepadMenuDropdownClass,
  notepadMenuItemClass,
  notepadMenuTriggerClass,
  notepadShellClass,
  notepadStatusBarClass,
} from './notepadNeuUi';

type MenuId = 'arquivo' | 'editar' | 'formatar' | 'exibir';

function getLineCol(text: string, pos: number): { line: number; col: number } {
  const before = text.slice(0, Math.max(0, pos));
  const lines = before.split('\n');
  return {
    line: lines.length,
    col: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}

function safeFilename(name: string): string {
  return name.replace(/[^\w-]+/g, '_').slice(0, 80) || 'projeto';
}

interface NotepadMenuProps {
  label: string;
  menuId: MenuId;
  openMenu: MenuId | null;
  onToggle: (id: MenuId) => void;
  onClose: () => void;
  children: React.ReactNode;
}

const NotepadMenu: React.FC<NotepadMenuProps> = ({
  label,
  menuId,
  openMenu,
  onToggle,
  onClose,
  children,
}) => {
  const isOpen = openMenu === menuId;
  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          notepadMenuTriggerClass,
          isOpen && 'bg-[color-mix(in_srgb,var(--workspace-panel-accent)_14%,transparent)]'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => onToggle(menuId)}
      >
        {label}
      </button>
      {isOpen ? (
        <div className={notepadMenuDropdownClass} role="menu" onMouseLeave={onClose}>
          {children}
        </div>
      ) : null}
    </div>
  );
};

export const NotepadView: React.FC<{
  project: Project;
  onUpdateProject?: (project: Project) => void;
  variant?: 'page' | 'dock';
  dockOpen?: boolean;
  onToggleDock?: () => void;
}> = ({ project, variant = 'page', dockOpen = false, onToggleDock }) => {
  const {
    pages,
    activePage,
    activePageId,
    setActivePageId,
    updateContent,
    createPage,
    renamePage,
    clearPage,
    removePage,
    loadFileIntoPage,
    canAddPage,
    maxPages,
  } = useNotepadPages(project);

  const [content, setContent] = useState(activePage?.content ?? '');
  const [wordWrap, setWordWrap] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [closePageId, setClosePageId] = useState<string | null>(null);
  const [lastFindIndex, setLastFindIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(activePage?.content ?? '');
    setCursorPos(0);
  }, [activePageId]);

  useEffect(() => {
    if (document.activeElement === textareaRef.current) return;
    const fromStore = activePage?.content ?? '';
    setContent(prev => (prev === fromStore ? prev : fromStore));
  }, [activePage?.content, activePage]);

  const applyContent = useCallback(
    (next: string) => {
      setContent(next);
      updateContent(next);
    },
    [updateContent]
  );

  const updateCursorFromTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    setCursorPos(el.selectionStart ?? 0);
  }, []);

  const handleChange = (value: string) => {
    applyContent(value);
  };

  const handleNewTab = () => {
    if (!canAddPage) {
      toast.error(`Limite de ${maxPages} abas atingido.`);
      return;
    }
    const pageId = createPage();
    if (pageId) {
      toast.success('Nova aba criada.');
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const handleClearTab = () => {
    if (!content.trim()) {
      clearPage(activePageId);
      textareaRef.current?.focus();
      return;
    }
    setConfirmClearOpen(true);
  };

  const handleConfirmClear = () => {
    clearPage(activePageId);
    setContent('');
    setConfirmClearOpen(false);
    textareaRef.current?.focus();
  };

  const handleClosePage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page && page.content.trim()) {
      setClosePageId(pageId);
      return;
    }
    removePage(pageId);
  };

  const handleConfirmClosePage = () => {
    if (closePageId) {
      removePage(closePageId);
      setClosePageId(null);
    }
  };

  const handleOpenFile: React.ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activePage) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      loadFileIntoPage(activePage.id, text, file.name);
      setContent(text);
      toast.success(`Arquivo "${file.name}" carregado na aba atual.`);
      textareaRef.current?.focus();
    };
    reader.onerror = () => toast.error('Não foi possível ler o arquivo.');
    reader.readAsText(file);
  };

  const handleSaveAs = () => {
    const pageTitle = activePage?.title?.trim() || DEFAULT_NOTEPAD_PAGE_TITLE;
    const filename = `${safeFilename(project.name)}-${safeFilename(pageTitle)}.txt`;
    downloadFile(content, filename, 'text/plain;charset=utf-8');
    toast.success('Arquivo salvo.');
  };

  const handleFindNext = () => {
    const query = findQuery.trim();
    if (!query) return;
    const haystack = content;
    const start = lastFindIndex + (findOpen ? query.length : 0);
    let idx = haystack.indexOf(query, start >= haystack.length ? 0 : start);
    if (idx < 0 && start > 0) {
      idx = haystack.indexOf(query, 0);
    }
    if (idx < 0) {
      toast.error('Texto não encontrado.');
      return;
    }
    setLastFindIndex(idx);
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(idx, idx + query.length);
      setCursorPos(idx);
    }
  };

  const closeMenu = () => setOpenMenu(null);

  const toggleMenu = (id: MenuId) => {
    setOpenMenu(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notepad-menu]')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const root = textareaRef.current?.closest('[data-notepad-menu]');
      if (!root?.contains(document.activeElement)) return;
      if (e.key === 's') {
        e.preventDefault();
        handleSaveAs();
      } else if (e.key === 'f') {
        e.preventDefault();
        setFindOpen(true);
        setLastFindIndex(textareaRef.current?.selectionStart ?? 0);
      } else if (e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const { line, col } = getLineCol(content, cursorPos);
  const charCount = content.length;
  const isDock = variant === 'dock';
  const shellClass = isDock ? notepadDockShellClass : notepadShellClass;

  const editor = (
    <div className={shellClass} data-notepad-menu>
      <nav className={notepadMenuBarClass} aria-label="Menu do Bloco de Notas">
        <NotepadMenu
          label="Arquivo"
          menuId="arquivo"
          openMenu={openMenu}
          onToggle={toggleMenu}
          onClose={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              handleNewTab();
            }}
          >
            Nova aba
            <span className="ml-auto pl-4 text-xs text-[var(--workspace-panel-text-muted)]">Ctrl+T</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              fileInputRef.current?.click();
            }}
          >
            Abrir na aba atual…
          </button>
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              handleSaveAs();
            }}
          >
            Salvar aba como…
          </button>
        </NotepadMenu>

        <NotepadMenu
          label="Editar"
          menuId="editar"
          openMenu={openMenu}
          onToggle={toggleMenu}
          onClose={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              setFindOpen(true);
              setLastFindIndex(textareaRef.current?.selectionStart ?? 0);
            }}
          >
            Localizar…
            <span className="ml-auto pl-4 text-xs text-[var(--workspace-panel-text-muted)]">Ctrl+F</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              handleClearTab();
            }}
          >
            Limpar aba atual
          </button>
        </NotepadMenu>

        <NotepadMenu
          label="Formatar"
          menuId="formatar"
          openMenu={openMenu}
          onToggle={toggleMenu}
          onClose={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              setWordWrap(w => !w);
            }}
          >
            {wordWrap ? '✓ ' : ''}Quebra automática de linha
          </button>
        </NotepadMenu>

        <NotepadMenu
          label="Exibir"
          menuId="exibir"
          openMenu={openMenu}
          onToggle={toggleMenu}
          onClose={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            className={notepadMenuItemClass}
            onClick={() => {
              closeMenu();
              setShowStatusBar(s => !s);
            }}
          >
            {showStatusBar ? '✓ ' : ''}Barra de status
          </button>
          {onToggleDock ? (
            <button
              type="button"
              role="menuitem"
              className={notepadMenuItemClass}
              onClick={() => {
                closeMenu();
                onToggleDock();
              }}
            >
              {dockOpen ? '✓ ' : ''}
              {isDock ? 'Fechar coluna fixa' : 'Coluna fixa ao navegar'}
            </button>
          ) : null}
        </NotepadMenu>
      </nav>

      <NotepadPageTabs
        pages={pages}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
        onAddPage={handleNewTab}
        onClosePage={handleClosePage}
        onRenamePage={renamePage}
        canAddPage={canAddPage}
        compact={isDock}
      />

      <textarea
        ref={textareaRef}
        className={cn(notepadEditorClass, !wordWrap && 'whitespace-pre overflow-x-auto')}
        style={wordWrap ? undefined : { whiteSpace: 'pre', overflowWrap: 'normal' }}
        value={content}
        onChange={e => handleChange(e.target.value)}
        onSelect={updateCursorFromTextarea}
        onKeyUp={updateCursorFromTextarea}
        onClick={updateCursorFromTextarea}
        spellCheck={false}
        role="tabpanel"
        aria-label={`Editor da aba ${activePage?.title ?? 'bloco de notas'}`}
        placeholder="Digite suas anotações aqui…"
      />

      {showStatusBar ? (
        <div className={notepadStatusBarClass} role="status" aria-live="polite">
          <span>
            Ln {line}, Col {col}
          </span>
          <span>{charCount.toLocaleString('pt-BR')} caracteres</span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={isDock ? 'flex min-h-0 min-w-0 flex-1 flex-col' : notepadViewPageShellClass}>
      <div className={isDock ? undefined : notepadViewContentClass}>
      {editor}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleOpenFile}
      />

      <Modal
        isOpen={findOpen}
        onClose={() => setFindOpen(false)}
        title="Localizar"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFindOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleFindNext}>
              Localizar próximo
            </Button>
          </div>
        }
      >
        <label className="block font-sans text-sm text-[var(--workspace-panel-text)]">
          Localizar o quê:
          <input
            type="text"
            className="app-input mt-1.5 w-full"
            value={findQuery}
            onChange={e => setFindQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFindNext();
              }
            }}
            autoFocus
          />
        </label>
      </Modal>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar aba atual?"
        message="O conteúdo desta aba será apagado. Deseja continuar?"
        confirmText="Sim, limpar"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={closePageId != null}
        onClose={() => setClosePageId(null)}
        onConfirm={handleConfirmClosePage}
        title="Fechar aba?"
        message="Esta aba contém texto. Fechar irá descartar o conteúdo não salvo em arquivo externo."
        confirmText="Fechar aba"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

NotepadView.displayName = 'NotepadView';
