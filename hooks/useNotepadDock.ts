import { useCallback, useEffect, useState } from 'react';
import {
  clampNotepadDockWidth,
  loadNotepadDockState,
  saveNotepadDockState,
  type NotepadDockState,
} from '../utils/notepadDockStorage';

export function useNotepadDock(projectId: string) {
  const [state, setState] = useState<NotepadDockState>(() => loadNotepadDockState(projectId));

  useEffect(() => {
    setState(loadNotepadDockState(projectId));
  }, [projectId]);

  useEffect(() => {
    saveNotepadDockState(projectId, state);
  }, [projectId, state]);

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, open: !prev.open }));
  }, []);

  const open = useCallback(() => {
    setState(prev => ({ ...prev, open: true }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setState(prev => ({ ...prev, width: clampNotepadDockWidth(width) }));
  }, []);

  const setActivePageId = useCallback((activePageId: string) => {
    setState(prev => ({ ...prev, activePageId }));
  }, []);

  return {
    isOpen: state.open,
    width: state.width,
    activePageId: state.activePageId,
    toggle,
    open,
    close,
    setWidth,
    setActivePageId,
  };
}
