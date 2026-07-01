const STORAGE_PREFIX = 'qa-notepad-dock:';

export const NOTEPAD_DOCK_DEFAULT_WIDTH = 360;
export const NOTEPAD_DOCK_MIN_WIDTH = 260;
export const NOTEPAD_DOCK_MAX_WIDTH = 560;

export interface NotepadDockState {
  open: boolean;
  width: number;
  activePageId?: string;
}

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function clampNotepadDockWidth(width: number): number {
  return Math.min(NOTEPAD_DOCK_MAX_WIDTH, Math.max(NOTEPAD_DOCK_MIN_WIDTH, Math.round(width)));
}

export function loadNotepadDockState(projectId: string): NotepadDockState {
  if (typeof window === 'undefined') {
    return { open: false, width: NOTEPAD_DOCK_DEFAULT_WIDTH };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return { open: false, width: NOTEPAD_DOCK_DEFAULT_WIDTH };
    const parsed = JSON.parse(raw) as Partial<NotepadDockState>;
    return {
      open: parsed.open === true,
      width: clampNotepadDockWidth(parsed.width ?? NOTEPAD_DOCK_DEFAULT_WIDTH),
      activePageId:
        typeof parsed.activePageId === 'string' && parsed.activePageId.length > 0
          ? parsed.activePageId
          : undefined,
    };
  } catch {
    return { open: false, width: NOTEPAD_DOCK_DEFAULT_WIDTH };
  }
}

export function saveNotepadDockState(projectId: string, state: NotepadDockState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      storageKey(projectId),
      JSON.stringify({
        open: state.open,
        width: clampNotepadDockWidth(state.width),
        ...(state.activePageId ? { activePageId: state.activePageId } : {}),
      })
    );
  } catch {
    /* quota ou modo privado */
  }
}
