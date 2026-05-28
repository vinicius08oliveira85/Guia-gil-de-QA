import React, { useState, Suspense } from 'react';
import { Keyboard, Upload } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { cn } from '../../utils/cn';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import {
  leveSettingsSectionSubtitleClass,
  leveSettingsSectionTitleClass,
  leveSettingsPrefsTabsTrackClass,
  leveSettingsSubTabClass,
} from '../common/projectCardUi';

const KeyboardShortcutsEditor = lazyWithRetry(() =>
  import('./KeyboardShortcutsEditor').then(m => ({ default: m.KeyboardShortcutsEditor }))
);
const ExportPreferences = lazyWithRetry(() =>
  import('./ExportPreferences').then(m => ({ default: m.ExportPreferences }))
);

type PreferenceSection = 'shortcuts' | 'export';

export const PreferencesTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<PreferenceSection>('shortcuts');

  const sections: {
    id: PreferenceSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'shortcuts', label: 'Atalhos', icon: Keyboard },
    { id: 'export', label: 'Exportação', icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className={leveSettingsSectionTitleClass}>Preferências</h3>
        <p className={cn(leveSettingsSectionSubtitleClass, 'mt-2')}>
          Configure suas preferências pessoais do aplicativo
        </p>
      </div>

      <div>
        <nav
          className={leveSettingsPrefsTabsTrackClass}
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
                className={leveSettingsSubTabClass(isActive)}
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
          {activeSection === 'shortcuts' && <KeyboardShortcutsEditor />}
          {activeSection === 'export' && <ExportPreferences />}
        </div>
      </Suspense>
    </div>
  );
};
