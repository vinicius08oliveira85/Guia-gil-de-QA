import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { getNotificationPreferences, updateNotificationPreferences } from '../../utils/preferencesService';
import { NotificationPreferences as NotificationPrefsType } from '../../types';

export const NotificationPreferences: React.FC = () => {
    const [preferences, setPreferences] = useState<NotificationPrefsType>(getNotificationPreferences());

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

    const notificationTypes: { key: keyof NotificationPrefsType; label: string; description: string }[] = [
        { key: 'bugCreated', label: 'Bug Criado', description: 'Receber notificação quando um novo bug for criado' },
        { key: 'testFailed', label: 'Teste Falhou', description: 'Receber notificação quando um teste falhar' },
        { key: 'deadlineApproaching', label: 'Prazo se Aproximando', description: 'Receber notificação quando um prazo estiver próximo' },
        { key: 'taskAssigned', label: 'Tarefa Atribuída', description: 'Receber notificação quando uma tarefa for atribuída a você' },
        { key: 'commentAdded', label: 'Comentário Adicionado', description: 'Receber notificação quando um comentário for adicionado' },
        { key: 'taskCompleted', label: 'Tarefa Completada', description: 'Receber notificação quando uma tarefa for completada' },
    ];

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-base-content mb-2">Preferências de Notificações</h4>
                    <p className="text-sm text-base-content/70 leading-relaxed">
                        Escolha quais tipos de notificações você deseja receber
                    </p>
                </div>

                <div className="divide-y divide-base-300">
                    {notificationTypes.map((type) => (
                        <div
                            key={type.key}
                            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                        >
                            <div className="flex-1 space-y-1">
                                <h5 className="font-medium text-base-content">{type.label}</h5>
                                <p className="text-sm text-base-content/70 leading-relaxed">{type.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={preferences[type.key]}
                                    onChange={() => handleToggle(type.key)}
                                    className="sr-only peer"
                                    aria-label={`${type.label}: ${preferences[type.key] ? 'ativado' : 'desativado'}`}
                                />
                                <div className="w-11 h-6 bg-base-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-base-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

