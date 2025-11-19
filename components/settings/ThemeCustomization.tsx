import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { getThemePreferences, updateThemePreferences } from '../../utils/preferencesService';
import { ThemePreferences } from '../../types';
import { applyThemePreview, clearThemePreview } from '../../utils/themeEngine';

export const ThemeCustomization: React.FC = () => {
    const [preferences, setPreferences] = useState<ThemePreferences>(getThemePreferences());
    const [isPreview, setIsPreview] = useState(false);
    const previewTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const handlePreferencesUpdate = () => {
            setPreferences(getThemePreferences());
        };
        window.addEventListener('preferences-updated', handlePreferencesUpdate);
        return () => {
            window.removeEventListener('preferences-updated', handlePreferencesUpdate);
            clearThemePreview();
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
        };
    }, []);

    const handleColorChange = (colorKey: keyof NonNullable<ThemePreferences['customColors']>, value: string) => {
        const updated = {
            ...preferences,
            customColors: {
                ...preferences.customColors,
                [colorKey]: value,
            } as ThemePreferences['customColors'],
        };
        setPreferences(updated);
        applyThemePreview(updated);
        setIsPreview(true);
        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(() => {
            updateThemePreferences(updated);
            setIsPreview(false);
        }, 500);
    };

    const handleSliderChange = (key: keyof ThemePreferences, value: number) => {
        const updated = { ...preferences, [key]: value };
        setPreferences(updated);
        applyThemePreview(updated);
        setIsPreview(true);
        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(() => {
            updateThemePreferences(updated);
            setIsPreview(false);
        }, 500);
    };

    const handleReset = () => {
        const defaultTheme: ThemePreferences = {
            contrast: 100,
            fontSize: 1,
            spacing: 1,
            borderRadius: 6,
            opacity: 100,
        };
        setPreferences(defaultTheme);
        clearThemePreview();
        updateThemePreferences(defaultTheme);
    };

    const colorFields: { key: keyof NonNullable<ThemePreferences['customColors']>; label: string }[] = [
        { key: 'accent', label: 'Cor de Destaque' },
        { key: 'primary', label: 'Cor Primária' },
        { key: 'background', label: 'Fundo' },
        { key: 'surface', label: 'Superfície' },
        { key: 'textPrimary', label: 'Texto Principal' },
        { key: 'textSecondary', label: 'Texto Secundário' },
    ];

    return (
        <Card>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">Personalização de Tema</h4>
                        <p className="text-sm text-text-secondary">
                            Personalize as cores, espaçamentos e outros aspectos visuais do aplicativo
                        </p>
                    </div>
                    {isPreview && (
                        <span className="text-xs text-accent bg-accent/20 px-2 py-1 rounded">Preview ativo</span>
                    )}
                </div>

                {/* Cores Personalizadas */}
                <div className="space-y-4">
                    <h5 className="font-semibold text-text-primary">Cores</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {colorFields.map((field) => (
                            <div key={field.key} className="flex items-center gap-3">
                                <label className="text-sm text-text-secondary w-32">{field.label}</label>
                                <input
                                    type="color"
                                    value={preferences.customColors?.[field.key] || '#00A859'}
                                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                                    className="w-16 h-10 rounded border border-surface-border cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={preferences.customColors?.[field.key] || '#00A859'}
                                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-surface border border-surface-border rounded text-text-primary text-sm"
                                    placeholder="#000000"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ajustes de Visual */}
                <div className="space-y-4">
                    <h5 className="font-semibold text-text-primary">Ajustes de Visual</h5>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-text-secondary">Contraste</label>
                                <span className="text-sm text-text-primary">{preferences.contrast}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={preferences.contrast}
                                onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-text-secondary">Tamanho da Fonte</label>
                                <span className="text-sm text-text-primary">{(preferences.fontSize * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.75"
                                max="1.5"
                                step="0.05"
                                value={preferences.fontSize}
                                onChange={(e) => handleSliderChange('fontSize', Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-text-secondary">Espaçamento</label>
                                <span className="text-sm text-text-primary">{(preferences.spacing * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={preferences.spacing}
                                onChange={(e) => handleSliderChange('spacing', Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-text-secondary">Arredondamento de Bordas</label>
                                <span className="text-sm text-text-primary">{preferences.borderRadius}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={preferences.borderRadius}
                                onChange={(e) => handleSliderChange('borderRadius', Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-text-secondary">Opacidade</label>
                                <span className="text-sm text-text-primary">{preferences.opacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={preferences.opacity}
                                onChange={(e) => handleSliderChange('opacity', Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Ações */}
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

