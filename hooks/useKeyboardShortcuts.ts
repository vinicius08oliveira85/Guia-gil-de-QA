import { useEffect } from 'react';
import { getKeyboardShortcutPreferences } from '../utils/preferencesService';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Shortcuts padrão (fallback)
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  { key: 'k', ctrl: true, description: 'Abrir busca global' },
  { key: 'n', ctrl: true, description: 'Criar novo projeto' },
  { key: 's', ctrl: true, description: 'Salvar' },
  { key: 'f', ctrl: true, description: 'Focar busca' },
  { key: 'Escape', description: 'Fechar modais' },
];

// Get shortcuts from preferences or fallback to defaults
const getShortcuts = () => {
  try {
    const prefs = getKeyboardShortcutPreferences();
    return {
      SEARCH: {
        key: prefs.search.key,
        ctrl: prefs.search.ctrl,
        shift: prefs.search.shift,
        alt: prefs.search.alt,
        description: 'Abrir busca global',
      },
      ESCAPE: {
        key: prefs.closeModal.key,
        ctrl: prefs.closeModal.ctrl,
        shift: prefs.closeModal.shift,
        alt: prefs.closeModal.alt,
        description: 'Fechar modais',
      },
    };
  } catch {
    return {
      SEARCH: { key: 'k', ctrl: true, description: 'Abrir busca global' },
      ESCAPE: { key: 'Escape', description: 'Fechar modais' },
    };
  }
};

// Shortcuts exportados para uso no App (usando preferências)
// This is a getter function that always returns current preferences
export const SHORTCUTS = new Proxy({} as ReturnType<typeof getShortcuts>, {
  get(_target, prop) {
    const shortcuts = getShortcuts();
    return shortcuts[prop as keyof typeof shortcuts];
  },
});
