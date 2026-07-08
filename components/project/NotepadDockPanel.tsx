import React, { useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../../types';
import { cn } from '../../utils/cn';
import { clampNotepadDockWidth } from '../../utils/notepadDockStorage';
import { NotepadView } from './NotepadView';
import {
  notepadDockAsideClass,
  notepadDockHeaderClass,
  notepadDockResizeHandleClass,
  notepadDockTitleClass,
} from './notepadNeuUi';

export interface NotepadDockPanelProps {
  project: Project;
  width: number;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onToggleDock: () => void;
}

export const NotepadDockPanel: React.FC<NotepadDockPanelProps> = ({
  project,
  width,
  onWidthChange,
  onClose,
  onToggleDock,
}) => {
  const resizingRef = useRef(false);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      resizingRef.current = true;
      const startX = e.clientX;
      const startWidth = width;
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!resizingRef.current) return;
        const delta = startX - ev.clientX;
        onWidthChange(clampNotepadDockWidth(startWidth + delta));
      };

      const onUp = (ev: PointerEvent) => {
        resizingRef.current = false;
        target.releasePointerCapture(ev.pointerId);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [onWidthChange, width]
  );

  return (
    <aside
      className={cn(notepadDockAsideClass, 'max-md:w-[min(100%,20rem)]')}
      style={{ width: `${width}px` }}
      aria-label="Coluna fixa do Bloco de Notas"
    >
      <div className="flex min-h-0 flex-1">
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar coluna do bloco de notas"
          className={notepadDockResizeHandleClass}
          onPointerDown={handleResizePointerDown}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className={notepadDockHeaderClass}>
            <span className={notepadDockTitleClass}>Bloco de Notas</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-base-content/72 hover:bg-primary/10 hover:text-base-content"
              aria-label="Fechar coluna fixa do bloco de notas"
              title="Fechar coluna"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>
          <NotepadView
            project={project}
            variant="dock"
            dockOpen
            onToggleDock={onToggleDock}
          />
        </div>
      </div>
    </aside>
  );
};

NotepadDockPanel.displayName = 'NotepadDockPanel';
