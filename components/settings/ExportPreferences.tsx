import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { getExportPreferences, updateExportPreferences } from '../../utils/preferencesService';
import type { ExportPreferences as ExportPreferencesType, ExportTemplate, ExportSchedule } from '../../types';
import { startExportScheduler, stopExportScheduler } from '../../utils/exportScheduler';

export const ExportPreferences: React.FC = () => {
    const [preferences, setPreferences] = useState<ExportPreferencesType>(getExportPreferences());
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        const handlePreferencesUpdate = () => {
            setPreferences(getExportPreferences());
        };
        window.addEventListener('preferences-updated', handlePreferencesUpdate);
        return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
    }, []);

    useEffect(() => {
        if (preferences.schedule?.enabled) {
            startExportScheduler(preferences.schedule);
        } else {
            stopExportScheduler();
        }
        return () => stopExportScheduler();
    }, [preferences.schedule]);

    const handleDefaultFormatChange = (format: 'json' | 'csv' | 'markdown') => {
        const updated = { ...preferences, defaultFormat: format };
        setPreferences(updated);
        updateExportPreferences(updated);
    };

    const handleDefaultIncludeChange = (key: 'defaultIncludeMetrics' | 'defaultIncludeTasks' | 'defaultIncludeTestCases', value: boolean) => {
        const updated = { ...preferences, [key]: value };
        setPreferences(updated);
        updateExportPreferences(updated);
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) return;
        const newTemplate: ExportTemplate = {
            id: `template-${Date.now()}`,
            name: newTemplateName,
            format: preferences.defaultFormat,
            includeMetrics: preferences.defaultIncludeMetrics,
            includeTasks: preferences.defaultIncludeTasks,
            includeTestCases: preferences.defaultIncludeTestCases,
        };
        const updated = {
            ...preferences,
            templates: [...preferences.templates, newTemplate],
        };
        setPreferences(updated);
        updateExportPreferences(updated);
        setNewTemplateName('');
    };

    const handleDeleteTemplate = (templateId: string) => {
        const updated = {
            ...preferences,
            templates: preferences.templates.filter(t => t.id !== templateId),
        };
        setPreferences(updated);
        updateExportPreferences(updated);
    };

    const handleScheduleChange = (schedule: Partial<ExportSchedule>) => {
        const updated = {
            ...preferences,
            schedule: { ...preferences.schedule, ...schedule } as ExportSchedule,
        };
        setPreferences(updated);
        updateExportPreferences(updated);
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-base-content mb-2">Preferências de Exportação</h4>
                    <p className="text-sm text-base-content/70 leading-relaxed">
                        Configure as opções padrão de exportação e agendamento automático
                    </p>
                </div>

                {/* Formato Padrão */}
                <div className="space-y-4">
                    <h5 className="font-semibold text-base-content">Formato Padrão</h5>
                    <div className="flex flex-wrap gap-2">
                        {(['json', 'csv', 'markdown'] as const).map((format) => (
                            <button
                                key={format}
                                onClick={() => handleDefaultFormatChange(format)}
                                className={`px-4 py-2 rounded transition-colors ${
                                    preferences.defaultFormat === format
                                        ? 'bg-primary text-primary-content'
                                        : 'bg-base-200 text-base-content hover:bg-base-300'
                                }`}
                            >
                                {format.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Opções Padrão de Inclusão */}
                <div className="space-y-4">
                    <h5 className="font-semibold text-base-content">Opções Padrão de Inclusão</h5>
                    <div className="space-y-3">
                        {[
                            { key: 'defaultIncludeMetrics' as const, label: 'Incluir Métricas' },
                            { key: 'defaultIncludeTasks' as const, label: 'Incluir Tarefas' },
                            { key: 'defaultIncludeTestCases' as const, label: 'Incluir Casos de Teste' },
                        ].map((option) => (
                            <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences[option.key]}
                                    onChange={(e) => handleDefaultIncludeChange(option.key, e.target.checked)}
                                    className="w-4 h-4 text-primary rounded focus:ring-primary/40"
                                />
                                <span className="text-sm text-base-content">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Templates de Exportação */}
                <div className="space-y-4">
                    <h5 className="font-semibold text-base-content">Templates Salvos</h5>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="Nome do template..."
                            className="flex-1 input input-bordered bg-base-100 border-base-300 text-base-content"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveTemplate()}
                        />
                        <button
                            onClick={handleSaveTemplate}
                            disabled={!newTemplateName.trim()}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Salvar Template
                        </button>
                    </div>
                    {preferences.templates.length > 0 ? (
                        <div className="space-y-2">
                            {preferences.templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="flex items-center justify-between p-3 bg-base-200 border border-base-300 rounded"
                                >
                                    <div>
                                        <p className="font-semibold text-base-content">{template.name}</p>
                                        <p className="text-xs text-base-content/70">
                                            {template.format.toUpperCase()} •{' '}
                                            {[
                                                template.includeMetrics && 'Métricas',
                                                template.includeTasks && 'Tarefas',
                                                template.includeTestCases && 'Casos de Teste',
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-base-content/70">Nenhum template salvo</p>
                    )}
                </div>

                {/* Agendamento Automático */}
                <div className="space-y-4 pt-4 border-t border-base-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h5 className="font-semibold text-base-content">Agendamento Automático</h5>
                            <p className="text-sm text-base-content/70 leading-relaxed">
                                Configure exportações automáticas periódicas
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={preferences.schedule?.enabled || false}
                                onChange={(e) =>
                                    handleScheduleChange({
                                        enabled: e.target.checked,
                                        frequency: 'daily',
                                        time: '09:00',
                                        format: preferences.defaultFormat,
                                        includeMetrics: preferences.defaultIncludeMetrics,
                                        includeTasks: preferences.defaultIncludeTasks,
                                        includeTestCases: preferences.defaultIncludeTestCases,
                                        destination: 'download',
                                        notifyOnComplete: true,
                                    })
                                }
                                className="sr-only peer"
                                aria-label="Habilitar agendamento automático"
                            />
                            <div className="w-11 h-6 bg-base-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-base-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {preferences.schedule?.enabled && (
                        <div className="space-y-4 p-4 bg-base-200 border border-base-300 rounded">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-base-content/70 mb-2">Frequência</label>
                                    <select
                                        value={preferences.schedule?.frequency || 'daily'}
                                        onChange={(e) =>
                                            handleScheduleChange({
                                                frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                                            })
                                        }
                                        className="w-full input input-bordered bg-base-100 border-base-300 text-base-content"
                                    >
                                        <option value="daily">Diária</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-base-content/70 mb-2">Horário</label>
                                    <input
                                        type="time"
                                        value={preferences.schedule?.time || '09:00'}
                                        onChange={(e) => handleScheduleChange({ time: e.target.value })}
                                        className="w-full input input-bordered bg-base-100 border-base-300 text-base-content"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-base-content/70 mb-2">Formato</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['json', 'csv', 'markdown'] as const).map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => handleScheduleChange({ format })}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                                preferences.schedule?.format === format
                                                    ? 'bg-primary text-primary-content'
                                                    : 'bg-base-100 text-base-content hover:bg-base-200'
                                            }`}
                                        >
                                            {format.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-base-content/70 mb-2">Destino</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['download', 'supabase'] as const).map((dest) => (
                                        <button
                                            key={dest}
                                            onClick={() => handleScheduleChange({ destination: dest })}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                                preferences.schedule?.destination === dest
                                                    ? 'bg-primary text-primary-content'
                                                    : 'bg-base-100 text-base-content hover:bg-base-200'
                                            }`}
                                        >
                                            {dest === 'download' ? 'Download' : 'Supabase'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.schedule?.notifyOnComplete || false}
                                    onChange={(e) => handleScheduleChange({ notifyOnComplete: e.target.checked })}
                                    className="w-4 h-4 text-primary rounded focus:ring-primary/40"
                                />
                                <span className="text-sm text-base-content">Notificar quando exportação for concluída</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

