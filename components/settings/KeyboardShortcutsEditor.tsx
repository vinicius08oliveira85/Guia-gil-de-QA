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
        <Card>
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Atalhos de Teclado</h4>
                    <p className="text-sm text-text-secondary">
                        Personalize os atalhos de teclado do aplicativo
                    </p>
                </div>

                {conflictError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                        {conflictError}
                    </div>
                )}

                <div className="space-y-4">
                    {shortcuts.map((shortcut) => (
                        <div
                            key={shortcut.key}
                            className="flex items-center justify-between p-4 bg-surface border border-surface-border rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            <div className="flex-1 mr-4">
                                <h5 className="font-semibold text-text-primary mb-1">{shortcut.label}</h5>
                                <p className="text-sm text-text-secondary">{shortcut.description}</p>
                            </div>
                            {editingKey === shortcut.key ? (
                                <input
                                    type="text"
                                    onKeyDown={(e) => handleKeyCapture(e, shortcut.key)}
                                    placeholder="Pressione as teclas..."
                                    className="px-3 py-2 bg-surface-hover border border-accent rounded text-text-primary text-sm w-48 focus:outline-none focus:ring-2 focus:ring-accent"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <kbd className="px-3 py-1 bg-surface-hover border border-surface-border rounded text-sm text-text-primary font-mono">
                                        {formatShortcut(preferences[shortcut.key])}
                                    </kbd>
                                    <button
                                        onClick={() => handleStartEdit(shortcut.key)}
                                        className="px-3 py-1 text-sm text-accent hover:text-accent-light hover:bg-accent/10 rounded transition-colors"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-surface-border">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-surface-hover text-text-primary rounded hover:bg-surface-border transition-colors"
                    >
                        Resetar para Padrão
                    </button>
                </div>
            </div>
        </Card>
    );
};

