import React, { useState, useEffect } from 'react';
import {
  leveSettingsHeadingSmClass,
  leveSettingsInsetPanelClass,
  leveSettingsMutedTextClass,
  leveSettingsToggleTrackClass,
} from '../common/projectCardUi';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../utils/preferencesService';
import { NotificationPreferences as NotificationPrefsType } from '../../types';

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPrefsType>(
    getNotificationPreferences()
  );

  useEffect(() => {
    const handlePreferencesUpdate = () => {
      setPreferences(getNotificationPreferences());
    };
    window.addEventListener('preferences-updated', handlePreferencesUpdate);
    return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
  }, []);

  const handleToggle = (key: keyof NotificationPrefsType) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    updateNotificationPreferences(updated);
  };

  const notificationTypes: {
    key: keyof NotificationPrefsType;
    label: string;
    description: string;
  }[] = [
    {
      key: 'bugCreated',
      label: 'Bug Criado',
      description: 'Receber notificação quando um novo bug for criado',
    },
    {
      key: 'testFailed',
      label: 'Teste Falhou',
      description: 'Receber notificação quando um teste falhar',
    },
    {
      key: 'deadlineApproaching',
      label: 'Prazo se Aproximando',
      description: 'Receber notificação quando um prazo estiver próximo',
    },
    {
      key: 'taskAssigned',
      label: 'Tarefa Atribuída',
      description: 'Receber notificação quando uma tarefa for atribuída a você',
    },
    {
      key: 'commentAdded',
      label: 'Comentário Adicionado',
      description: 'Receber notificação quando um comentário for adicionado',
    },
    {
      key: 'taskCompleted',
      label: 'Tarefa Completada',
      description: 'Receber notificação quando uma tarefa for completada',
    },
  ];

  return (
    <div className={leveSettingsInsetPanelClass}>
      <div className="space-y-6">
        <div>
          <h4 className={leveSettingsHeadingSmClass}>Preferências de Notificações</h4>
          <p className={leveSettingsMutedTextClass}>
            Escolha quais tipos de notificações você deseja receber
          </p>
        </div>

        <div className="divide-y divide-base-content/12">
          {notificationTypes.map(type => (
            <div
              key={type.key}
              className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex-1 space-y-1">
                <h5 className="font-medium text-base-content">{type.label}</h5>
                <p className={leveSettingsMutedTextClass}>{type.description}</p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={preferences[type.key]}
                  onChange={() => handleToggle(type.key)}
                  className="peer sr-only"
                  aria-label={`${type.label}: ${preferences[type.key] ? 'ativado' : 'desativado'}`}
                />
                <div className={leveSettingsToggleTrackClass} />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
