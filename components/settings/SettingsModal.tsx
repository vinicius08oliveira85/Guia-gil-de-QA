import React, { useState, Suspense } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { Project } from '../../types';

// Lazy load das tabs com tratamento de erro
const lazyLoadTab = (importFn: () => Promise<any>, name: string) => {
  return React.lazy(() =>
    importFn().catch(error => {
      console.error(`Erro ao carregar ${name}:`, error);
      // Retornar um componente de fallback em caso de erro
      return {
        default: () => (
          <div className="p-6">
            <div className="alert alert-error">
              <span>Erro ao carregar {name}. Por favor, recarregue a página.</span>
            </div>
          </div>
        ),
      };
    })
  );
};

const JiraSettingsTab = lazyLoadTab(
  () => import('./JiraSettingsTab').then(m => ({ default: m.JiraSettingsTab })),
  'JiraSettingsTab'
);
const SupabaseSettingsTab = lazyLoadTab(
  () => import('./SupabaseSettingsTab').then(m => ({ default: m.SupabaseSettingsTab })),
  'SupabaseSettingsTab'
);
const PreferencesTab = lazyLoadTab(
  () => import('./PreferencesTab').then(m => ({ default: m.PreferencesTab })),
  'PreferencesTab'
);
const GeminiApiKeysTab = lazyLoadTab(
  () => import('./GeminiApiKeysTab').then(m => ({ default: m.GeminiApiKeysTab })),
  'GeminiApiKeysTab'
);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectImported?: (project: Project) => void;
}

type TabType = 'jira' | 'supabase' | 'preferences' | 'api-keys';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onProjectImported,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('jira');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'jira', label: 'Jira', icon: '🔗' },
    { id: 'supabase', label: 'Supabase', icon: '💾' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' },
    { id: 'preferences', label: 'Preferências', icon: '⚙️' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações" size="2xl" maxHeight="92vh">
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] mb-4 gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[oklch(var(--p))] text-[oklch(var(--p))]'
                  : 'border-transparent text-base-content/70 hover:text-base-content hover:border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
            {activeTab === 'jira' && <JiraSettingsTab onProjectImported={onProjectImported} />}
            {activeTab === 'supabase' && <SupabaseSettingsTab />}
            {activeTab === 'api-keys' && <GeminiApiKeysTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
          </Suspense>
        </div>
      </div>
    </Modal>
  );
};
