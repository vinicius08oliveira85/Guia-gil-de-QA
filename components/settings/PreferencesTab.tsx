import React, { useState, Suspense, lazy } from 'react';
import { Bell, Keyboard, Upload } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { cn } from '../../utils/cn';

// Lazy load preference components
const NotificationPreferences = lazy(() =>
  import('./NotificationPreferences').then(m => ({ default: m.NotificationPreferences }))
);
const KeyboardShortcutsEditor = lazy(() =>
  import('./KeyboardShortcutsEditor').then(m => ({ default: m.KeyboardShortcutsEditor }))
);
const ExportPreferences = lazy(() =>
  import('./ExportPreferences').then(m => ({ default: m.ExportPreferences }))
);

type PreferenceSection = 'notifications' | 'shortcuts' | 'export';

export const PreferencesTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<PreferenceSection>('notifications');

  const sections: {
    id: PreferenceSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'shortcuts', label: 'Atalhos', icon: Keyboard },
    { id: 'export', label: 'Exportação', icon: Upload },
  ];

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div>
        <h3 className="text-xl font-bold text-base-content mb-2">Preferências</h3>
        <p className="text-base-content/70 text-sm leading-relaxed">
          Configure suas preferências pessoais do aplicativo
        </p>
      </div>

      {/* Navegação por seções */}
      <div className="border-b border-base-300">
        <nav
          className="flex gap-1 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Seções de preferências"
        >
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  'hover:text-base-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/70 hover:border-base-300'
                )}
                role="tab"
                aria-selected={isActive}
                aria-controls={`preference-panel-${section.id}`}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
        <div
          id={`preference-panel-${activeSection}`}
          role="tabpanel"
          aria-labelledby={`preference-tab-${activeSection}`}
        >
          {activeSection === 'notifications' && <NotificationPreferences />}
          {activeSection === 'shortcuts' && <KeyboardShortcutsEditor />}
          {activeSection === 'export' && <ExportPreferences />}
        </div>
      </Suspense>
    </div>
  );
};
