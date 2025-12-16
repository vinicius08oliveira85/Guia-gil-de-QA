import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { getKeyboardShortcutPreferences, updateKeyboardShortcutPreferences } from '../../utils/preferencesService';
import { KeyboardShortcutPreferences, KeyboardShortcutConfig } from '../../types';

export const KeyboardShortcutsEditor: React.FC = () => {
    const [preferences, setPreferences] = useState<KeyboardShortcutPreferences>(getKeyboardShortcutPreferences());
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

        // Validate for conflicts
        const conflicts = Object.entries(preferences)
            .filter(([k, v]) => k !== key && 
                v.key.toLowerCase() === newConfig.key.toLowerCase() &&
                !!v.ctrl === !!newConfig.ctrl &&
                !!v.shift === !!newConfig.shift &&
                !!v.alt === !!newConfig.alt
            );

        if (conflicts.length > 0) {
            setConflictError(`Conflito com: ${conflicts.map(([k]) => getShortcutLabel(k as keyof KeyboardShortcutPreferences)).join(', ')}`);
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

    const shortcuts: { key: keyof KeyboardShortcutPreferences; label: string; description: string }[] = [
        { key: 'search', label: 'Busca Global', description: 'Abre a busca global no aplicativo' },
        { key: 'newProject', label: 'Criar Novo Projeto', description: 'Cria um novo projeto' },
        { key: 'save', label: 'Salvar', description: 'Salva as alterações atuais' },
        { key: 'focusSearch', label: 'Focar Busca', description: 'Foca no campo de busca' },
        { key: 'closeModal', label: 'Fechar Modal', description: 'Fecha o modal ou diálogo aberto' },
    ];

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-base-content mb-2">Atalhos de Teclado</h4>
                    <p className="text-sm text-base-content/70 leading-relaxed">
                        Personalize os atalhos de teclado do aplicativo
                    </p>
                </div>

                {conflictError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                        {conflictError}
                    </div>
                )}

                <div className="divide-y divide-base-300">
                    {shortcuts.map((shortcut) => (
                        <div
                            key={shortcut.key}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 first:pt-0 last:pb-0"
                        >
                            <div className="flex-1 space-y-1">
                                <h5 className="font-medium text-base-content">{shortcut.label}</h5>
                                <p className="text-sm text-base-content/70 leading-relaxed">{shortcut.description}</p>
                            </div>
                            {editingKey === shortcut.key ? (
                                <input
                                    type="text"
                                    onKeyDown={(e) => handleKeyCapture(e, shortcut.key)}
                                    placeholder="Pressione as teclas..."
                                    className="px-3 py-2 bg-base-200 border border-primary rounded text-base-content text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center gap-3 shrink-0">
                                    <kbd className="px-3 py-1.5 bg-base-200 border border-base-300 rounded text-sm text-base-content font-mono">
                                        {formatShortcut(preferences[shortcut.key])}
                                    </kbd>
                                    <button
                                        onClick={() => handleStartEdit(shortcut.key)}
                                        className="px-3 py-1.5 text-sm text-primary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-base-300">
                    <button
                        onClick={handleReset}
                        className="btn btn-secondary text-sm"
                    >
                        Resetar para Padrão
                    </button>
                </div>
            </div>
        </Card>
    );
};

