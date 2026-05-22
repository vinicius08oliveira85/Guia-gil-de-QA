import React, { useState, useEffect } from 'react';
import {
  leveSettingsHeadingSmClass,
  leveSettingsInsetPanelClass,
  leveSettingsInputClass,
  leveSettingsMutedTextClass,
  leveSettingsOutlineBtnClass,
  leveViewInlineCodeClass,
} from '../common/projectCardUi';
import { cn } from '../../utils/cn';
import {
  getKeyboardShortcutPreferences,
  updateKeyboardShortcutPreferences,
} from '../../utils/preferencesService';
import { KeyboardShortcutPreferences, KeyboardShortcutConfig } from '../../types';

export const KeyboardShortcutsEditor: React.FC = () => {
  const [preferences, setPreferences] = useState<KeyboardShortcutPreferences>(
    getKeyboardShortcutPreferences()
  );
  const [editingKey, setEditingKey] = useState<keyof KeyboardShortcutPreferences | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    const handlePreferencesUpdate = () => {
      setPreferences(getKeyboardShortcutPreferences());
    };
    window.addEventListener('preferences-updated', handlePreferencesUpdate);
    return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
  }, []);

  const handleStartEdit = (key: keyof KeyboardShortcutPreferences) => {
    setEditingKey(key);
    setConflictError(null);
  };

  const handleKeyCapture = (event: React.KeyboardEvent, key: keyof KeyboardShortcutPreferences) => {
    event.preventDefault();
    const newConfig: KeyboardShortcutConfig = {
      key: event.key === ' ' ? 'Space' : event.key,
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
    };

    const conflicts = Object.entries(preferences).filter(
      ([k, v]) =>
        k !== key &&
        v.key.toLowerCase() === newConfig.key.toLowerCase() &&
        !!v.ctrl === !!newConfig.ctrl &&
        !!v.shift === !!newConfig.shift &&
        !!v.alt === !!newConfig.alt
    );

    if (conflicts.length > 0) {
      setConflictError(
        `Conflito com: ${conflicts.map(([k]) => getShortcutLabel(k as keyof KeyboardShortcutPreferences)).join(', ')}`
      );
      return;
    }

    const updated = { ...preferences, [key]: newConfig };
    setPreferences(updated);
    updateKeyboardShortcutPreferences(updated);
    setEditingKey(null);
    setConflictError(null);
  };

  const handleReset = () => {
    const defaultShortcuts: KeyboardShortcutPreferences = {
      search: { key: 'k', ctrl: true },
      newProject: { key: 'n', ctrl: true },
      save: { key: 's', ctrl: true },
      focusSearch: { key: 'f', ctrl: true },
      closeModal: { key: 'Escape' },
    };
    setPreferences(defaultShortcuts);
    updateKeyboardShortcutPreferences(defaultShortcuts);
    setEditingKey(null);
    setConflictError(null);
  };

  const formatShortcut = (config: KeyboardShortcutConfig): string => {
    const parts: string[] = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');
    parts.push(config.key === 'Escape' ? 'Esc' : config.key.toUpperCase());
    return parts.join(' + ');
  };

  const getShortcutLabel = (key: keyof KeyboardShortcutPreferences): string => {
    const labels: Record<keyof KeyboardShortcutPreferences, string> = {
      search: 'Busca Global',
      newProject: 'Novo Projeto',
      save: 'Salvar',
      focusSearch: 'Focar Busca',
      closeModal: 'Fechar Modal',
    };
    return labels[key];
  };

  const shortcuts: {
    key: keyof KeyboardShortcutPreferences;
    label: string;
    description: string;
  }[] = [
    { key: 'search', label: 'Busca Global', description: 'Abre a busca global no aplicativo' },
    { key: 'newProject', label: 'Criar Novo Projeto', description: 'Cria um novo projeto' },
    { key: 'save', label: 'Salvar', description: 'Salva as alterações atuais' },
    { key: 'focusSearch', label: 'Focar Busca', description: 'Foca no campo de busca' },
    { key: 'closeModal', label: 'Fechar Modal', description: 'Fecha o modal ou diálogo aberto' },
  ];

  return (
    <div className={leveSettingsInsetPanelClass}>
      <div className="space-y-6">
        <div>
          <h4 className={leveSettingsHeadingSmClass}>Atalhos de Teclado</h4>
          <p className={leveSettingsMutedTextClass}>Personalize os atalhos de teclado do aplicativo</p>
        </div>

        {conflictError && (
          <div className="rounded-lg border border-[color-mix(in_srgb,#e54b4f_30%,transparent)] bg-[color-mix(in_srgb,#e54b4f_8%,var(--leve-header-bg))] p-3 text-sm text-[#e54b4f]">
            {conflictError}
          </div>
        )}

        <div className="divide-y divide-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)]">
          {shortcuts.map(shortcut => (
            <div
              key={shortcut.key}
              className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 space-y-1">
                <h5 className="font-medium text-[var(--leve-header-text)]">{shortcut.label}</h5>
                <p className={leveSettingsMutedTextClass}>{shortcut.description}</p>
              </div>
              {editingKey === shortcut.key ? (
                <input
                  type="text"
                  onKeyDown={e => handleKeyCapture(e, shortcut.key)}
                  placeholder="Pressione as teclas..."
                  className={cn(leveSettingsInputClass, 'w-full sm:w-48')}
                  autoFocus
                />
              ) : (
                <div className="flex shrink-0 items-center gap-3">
                  <kbd className={leveViewInlineCodeClass}>{formatShortcut(preferences[shortcut.key])}</kbd>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(shortcut.key)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--leve-header-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_10%,transparent)]"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)] pt-4">
          <button type="button" onClick={handleReset} className={leveSettingsOutlineBtnClass}>
            Resetar para Padrão
          </button>
        </div>
      </div>
    </div>
  );
};
