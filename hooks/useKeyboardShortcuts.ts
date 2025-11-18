import { useEffect } from 'react';

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
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
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

// Shortcuts padrão
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  { key: 'k', ctrl: true, description: 'Abrir busca global' },
  { key: 'n', ctrl: true, description: 'Criar novo projeto' },
  { key: 's', ctrl: true, description: 'Salvar' },
  { key: 'f', ctrl: true, description: 'Focar busca' },
  { key: 'Escape', description: 'Fechar modais' },
];

// Shortcuts exportados para uso no App
export const SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Abrir busca global' },
  ESCAPE: { key: 'Escape', description: 'Fechar modais' },
};
