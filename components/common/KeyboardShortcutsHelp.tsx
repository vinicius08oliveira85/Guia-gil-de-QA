import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DEFAULT_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatKey = (shortcut: (typeof DEFAULT_SHORTCUTS)[0]) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-accent text-white rounded-full shadow-lg hover:bg-accent-light transition-colors z-50"
        title="Atalhos de teclado (Ctrl+?)"
      >
        ⌨️
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Atalhos de Teclado">
        <div className="space-y-4">
          <p className="text-text-secondary text-sm mb-4">
            Use estes atalhos para navegar mais rapidamente pela aplicação.
          </p>
          <div className="space-y-2">
            {DEFAULT_SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-surface border border-surface-border rounded-lg"
              >
                <span className="text-text-primary">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-black/20 border border-surface-border rounded text-sm font-mono text-text-primary">
                  {formatKey(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              💡 <strong>Dica:</strong> Pressione{' '}
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-xs">Ctrl + ?</kbd> a qualquer
              momento para ver esta ajuda.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
