import React, { useState, useEffect } from 'react';
import {
  leveSettingsCheckboxPanelClass,
  leveSettingsHeadingSmClass,
  leveSettingsHeadingXsClass,
  leveSettingsInsetPanelClass,
  leveSettingsInputClass,
  leveSettingsMutedTextClass,
  leveSettingsSelectClass,
  leveSettingsStrongTextClass,
  leveSettingsToggleTrackClass,
  leveTaskModalTabsStripClass,
  leveViewFilterPillClass,
  leveViewPrimaryBtnClass,
} from '../common/projectCardUi';
import { cn } from '../../utils/cn';
import { getExportPreferences, updateExportPreferences } from '../../utils/preferencesService';
import type {
  ExportPreferences as ExportPreferencesType,
  ExportTemplate,
  ExportSchedule,
} from '../../types';
import { startExportScheduler, stopExportScheduler } from '../../utils/exportScheduler';
import { AppSelect } from '../common/AppSelect';

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

  const handleDefaultIncludeChange = (
    key: 'defaultIncludeMetrics' | 'defaultIncludeTasks' | 'defaultIncludeTestCases',
    value: boolean
  ) => {
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
    <div className={leveSettingsInsetPanelClass}>
      <div className="space-y-6">
        <div>
          <h4 className={leveSettingsHeadingSmClass}>Preferências de Exportação</h4>
          <p className={leveSettingsMutedTextClass}>
            Configure as opções padrão de exportação e agendamento automático
          </p>
        </div>

        {/* Formato Padrão */}
        <div className="space-y-4">
          <h5 className={leveSettingsHeadingXsClass}>Formato Padrão</h5>
          <div className={cn(leveTaskModalTabsStripClass, 'w-fit max-w-full')}>
            {(['json', 'csv', 'markdown'] as const).map(format => (
              <button
                key={format}
                type="button"
                onClick={() => handleDefaultFormatChange(format)}
                className={leveViewFilterPillClass(preferences.defaultFormat === format)}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Opções Padrão de Inclusão */}
        <div className="space-y-4">
          <h5 className={leveSettingsHeadingXsClass}>Opções Padrão de Inclusão</h5>
          <div className="space-y-3">
            {[
              { key: 'defaultIncludeMetrics' as const, label: 'Incluir Métricas' },
              { key: 'defaultIncludeTasks' as const, label: 'Incluir Tarefas' },
              { key: 'defaultIncludeTestCases' as const, label: 'Incluir Casos de Teste' },
            ].map(option => (
              <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[option.key]}
                  onChange={e => handleDefaultIncludeChange(option.key, e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary/40"
                />
                <span className="text-sm text-[var(--leve-header-text)]">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Templates de Exportação */}
        <div className="space-y-4">
          <h5 className={leveSettingsHeadingXsClass}>Templates Salvos</h5>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTemplateName}
              onChange={v => setNewTemplateName(v)}
              placeholder="Nome do template..."
              className={cn(leveSettingsInputClass, 'flex-1')}
              onKeyPress={e => e.key === 'Enter' && handleSaveTemplate()}
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!newTemplateName.trim()}
              className={cn(leveViewPrimaryBtnClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              Salvar Template
            </button>
          </div>
          {preferences.templates.length > 0 ? (
            <div className="space-y-2">
              {preferences.templates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)] bg-[var(--leve-header-bg)] p-3"
                >
                  <div>
                    <p className={leveSettingsStrongTextClass}>{template.name}</p>
                    <p className="text-xs text-[var(--leve-header-text-muted)]">
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
            <p className={leveSettingsMutedTextClass}>Nenhum template salvo</p>
          )}
        </div>

        {/* Agendamento Automático */}
        <div className="space-y-4 border-t border-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)] pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h5 className={leveSettingsHeadingXsClass}>Agendamento Automático</h5>
              <p className={leveSettingsMutedTextClass}>
                Configure exportações automáticas periódicas
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferences.schedule?.enabled || false}
                onChange={e =>
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
              <div className={leveSettingsToggleTrackClass} />
            </label>
          </div>

          {preferences.schedule?.enabled && (
            <div className={cn(leveSettingsCheckboxPanelClass, 'space-y-4')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[var(--leve-header-text-muted)]">Frequência</label>
                  <AppSelect
                    value={preferences.schedule?.frequency || 'daily'}
                    onChange={e =>
                      handleScheduleChange({
                        frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                      })
                    }
                    className={cn(leveSettingsSelectClass, 'w-full')}
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </AppSelect>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--leve-header-text-muted)]">Horário</label>
                  <input
                    type="time"
                    value={preferences.schedule?.time || '09:00'}
                    onChange={e => handleScheduleChange({ time: e.target.value })}
                    className={cn(leveSettingsInputClass, 'w-full')}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--leve-header-text-muted)]">Formato</label>
                <div className={cn(leveTaskModalTabsStripClass, 'w-fit max-w-full')}>
                  {(['json', 'csv', 'markdown'] as const).map(format => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleScheduleChange({ format })}
                      className={leveViewFilterPillClass(preferences.schedule?.format === format)}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--leve-header-text-muted)]">Destino</label>
                <div className={cn(leveTaskModalTabsStripClass, 'w-fit max-w-full')}>
                  {(['download', 'supabase'] as const).map(dest => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => handleScheduleChange({ destination: dest })}
                      className={leveViewFilterPillClass(preferences.schedule?.destination === dest)}
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
                  onChange={e => handleScheduleChange({ notifyOnComplete: e.target.checked })}
                  className="w-4 h-4 text-primary rounded focus:ring-primary/40"
                />
                <span className="text-sm text-[var(--leve-header-text)]">
                  Notificar quando exportação for concluída
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
