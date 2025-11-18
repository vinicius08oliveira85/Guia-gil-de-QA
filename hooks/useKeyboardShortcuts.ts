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
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;
        
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const SHORTCUTS = {
  CREATE_PROJECT: { key: 'n', ctrl: true, description: 'Criar novo projeto' },
  SAVE: { key: 's', ctrl: true, description: 'Salvar' },
  SEARCH: { key: 'k', ctrl: true, description: 'Buscar' },
  ESCAPE: { key: 'Escape', description: 'Fechar modal' },
  DELETE: { key: 'Delete', description: 'Deletar item selecionado' },
} as const;

