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
        <Card>
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Preferências de Notificações</h4>
                    <p className="text-sm text-text-secondary">
                        Escolha quais tipos de notificações você deseja receber
                    </p>
                </div>

                <div className="space-y-4">
                    {notificationTypes.map((type) => (
                        <div
                            key={type.key}
                            className="flex items-start justify-between p-4 bg-surface border border-surface-border rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            <div className="flex-1 mr-4">
                                <h5 className="font-semibold text-text-primary mb-1">{type.label}</h5>
                                <p className="text-sm text-text-secondary">{type.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences[type.key]}
                                    onChange={() => handleToggle(type.key)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

