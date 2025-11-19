import React, { useState, Suspense, lazy } from 'react';
import { Card } from '../common/Card';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

// Lazy load preference components
const NotificationPreferences = lazy(() => import('./NotificationPreferences').then(m => ({ default: m.NotificationPreferences })));
const KeyboardShortcutsEditor = lazy(() => import('./KeyboardShortcutsEditor').then(m => ({ default: m.KeyboardShortcutsEditor })));
const ExportPreferences = lazy(() => import('./ExportPreferences').then(m => ({ default: m.ExportPreferences })));

type PreferenceSection = 'notifications' | 'shortcuts' | 'export';

export const PreferencesTab: React.FC = () => {
    const [activeSection, setActiveSection] = useState<PreferenceSection>('notifications');

    const sections: { id: PreferenceSection; label: string; icon: string }[] = [
        { id: 'notifications', label: 'Notificações', icon: '🔔' },
        { id: 'shortcuts', label: 'Atalhos', icon: '⌨️' },
        { id: 'export', label: 'Exportação', icon: '📤' },
    ];

    return (
        <div className="space-y-6 p-4">
            <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Preferências</h3>
                <p className="text-text-secondary text-sm">
                    Configure suas preferências pessoais do aplicativo
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b border-surface-border pb-4">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                            activeSection === section.id
                                ? 'bg-accent/20 text-accent-light'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span className="mr-2">{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>

            <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                {activeSection === 'notifications' && <NotificationPreferences />}
                {activeSection === 'shortcuts' && <KeyboardShortcutsEditor />}
                {activeSection === 'export' && <ExportPreferences />}
            </Suspense>
        </div>
    );
};

