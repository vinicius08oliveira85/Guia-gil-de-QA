import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { NotepadPage } from '../../types';
import { cn } from '../../utils/cn';
import {
  notepadPageTabActiveClass,
  notepadPageTabAddClass,
  notepadPageTabClass,
  notepadPageTabCloseClass,
  notepadPageTabRenameInputClass,
  notepadPageTabsRowClass,
  notepadPageTabTitleClass,
} from './notepadNeuUi';

export interface NotepadPageTabsProps {
  pages: NotepadPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onClosePage: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  canAddPage: boolean;
  compact?: boolean;
}

export const NotepadPageTabs: React.FC<NotepadPageTabsProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onClosePage,
  onRenamePage,
  canAddPage,
  compact = false,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = useCallback((page: NotepadPage) => {
    setRenamingId(page.id);
    setRenameDraft(page.title);
  }, []);

  const commitRename = useCallback(() => {
    if (!renamingId) return;
    onRenamePage(renamingId, renameDraft);
    setRenamingId(null);
    setRenameDraft('');
  }, [onRenamePage, renameDraft, renamingId]);

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  return (
    <div
      className={cn(notepadPageTabsRowClass, compact && 'px-0.5')}
      role="tablist"
      aria-label="Abas do bloco de notas"
    >
      {pages.map(page => {
        const isActive = page.id === activePageId;
        const isRenaming = renamingId === page.id;
        return (
          <div
            key={page.id}
            className={cn(isActive ? notepadPageTabActiveClass : notepadPageTabClass, 'mr-0.5')}
            role="presentation"
          >
            {isRenaming ? (
              <input
                ref={renameInputRef}
                className={notepadPageTabRenameInputClass}
                value={renameDraft}
                onChange={e => setRenameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setRenamingId(null);
                  }
                }}
                aria-label="Renomear aba do bloco de notas"
              />
            ) : (
              <>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={notepadPageTabTitleClass}
                  onClick={() => onSelectPage(page.id)}
                  onDoubleClick={() => startRename(page)}
                  title={page.title}
                >
                  {page.title}
                </button>
                {pages.length > 1 ? (
                  <button
                    type="button"
                    className={notepadPageTabCloseClass}
                    onClick={e => {
                      e.stopPropagation();
                      onClosePage(page.id);
                    }}
                    aria-label={`Fechar aba ${page.title}`}
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                ) : null}
              </>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className={notepadPageTabAddClass}
        onClick={onAddPage}
        disabled={!canAddPage}
        aria-label="Nova aba do bloco de notas"
        title={canAddPage ? 'Nova aba' : 'Limite de abas atingido'}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
};

NotepadPageTabs.displayName = 'NotepadPageTabs';
