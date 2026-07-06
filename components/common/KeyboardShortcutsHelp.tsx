import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DEFAULT_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import {
  modalNeuKbdClass,
  modalNeuListClass,
  modalNeuListRowClass,
  modalNeuMutedTextClass,
  modalNeuStrongTextClass,
  modalNeuTipClass,
} from './modalListNeuUi';
import { cn } from '../../utils/cn';

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
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Atalhos de Teclado">
      <div className="space-y-4">
        <p className={cn('text-sm', modalNeuMutedTextClass)}>
          Use estes atalhos para navegar mais rapidamente pela aplicação.
        </p>
        <ul className={modalNeuListClass} role="list">
          {DEFAULT_SHORTCUTS.map((shortcut, index) => (
            <li key={index}>
              <div className={modalNeuListRowClass}>
                <span className={cn('text-sm font-medium', modalNeuStrongTextClass)}>
                  {shortcut.description}
                </span>
                <kbd className={modalNeuKbdClass}>{formatKey(shortcut)}</kbd>
              </div>
            </li>
          ))}
        </ul>
        <div className={modalNeuTipClass}>
          <p>
            <strong>Dica:</strong> Pressione{' '}
            <kbd className={cn(modalNeuKbdClass, 'mx-0.5')}>Ctrl + ?</kbd> a qualquer momento
            para ver esta ajuda.
          </p>
        </div>
      </div>
    </Modal>
  );
};
