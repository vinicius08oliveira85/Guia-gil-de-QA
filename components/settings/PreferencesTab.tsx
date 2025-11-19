import React from 'react';
import { Card } from '../common/Card';

export const PreferencesTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Preferências</h3>
                <p className="text-text-secondary text-sm">
                    Configure suas preferências pessoais do aplicativo
                </p>
            </div>

            <Card>
                <div className="space-y-4">
                    <p className="text-text-secondary text-sm">
                        As configurações de preferências estarão disponíveis em breve.
                    </p>
                    <div className="space-y-2 text-sm text-text-secondary">
                        <p>Funcionalidades planejadas:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Preferências de notificações</li>
                            <li>Configurações de tema personalizado</li>
                            <li>Atalhos de teclado personalizados</li>
                            <li>Preferências de exportação</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

