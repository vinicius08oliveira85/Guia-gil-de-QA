import React, { useState, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link, Database, Settings as SettingsIcon, Key, HardDrive } from 'lucide-react';
import { BackButton } from '../common/BackButton';
import { LocalDataManagement } from '../common/LocalDataManagement';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Project } from '../../types';
import { cn } from '../../utils/cn';
import {
  leveSettingsContentAreaClass,
  leveSettingsHeaderStickyClass,
  leveSettingsPageClass,
  leveSettingsPanelClass,
  leveSettingsTabActiveClass,
  leveSettingsTabClass,
  leveSettingsTabsNavClass,
  leveViewPageSubtitleClass,
  leveViewPageTitleClass,
} from '../common/projectCardUi';
import { settingsContentShell } from '../common/viewUi';

const lazyLoadTab = (importFn: () => Promise<any>, name: string) => {
  return React.lazy(() =>
    importFn().catch(error => {
      console.error(`Erro ao carregar ${name}:`, error);
      return {
        default: () => (
          <div className="p-6">
            <div className="rounded-[var(--leve-header-radius)] border border-[color-mix(in_srgb,#e54b4f_30%,transparent)] bg-[color-mix(in_srgb,#e54b4f_8%,var(--leve-header-bg))] px-4 py-3 font-sans text-sm text-[#e54b4f]">
              Erro ao carregar {name}. Por favor, recarregue a página.
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

type TabType = 'jira' | 'supabase' | 'local-data' | 'api-keys' | 'preferences';

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'jira', label: 'Jira', icon: Link },
  { id: 'supabase', label: 'Supabase', icon: Database },
  { id: 'local-data', label: 'Dados locais', icon: HardDrive },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'preferences', label: 'Preferências', icon: SettingsIcon },
];

interface SettingsViewProps {
  onProjectImported?: (project: Project) => void;
  onLocalBackupRestored?: () => void | Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onProjectImported,
  onLocalBackupRestored,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('jira');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      navigate('/');
    }
  };

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const index = tabs.findIndex(t => t.id === activeTab);
      if (index < 0) return;
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      } else return;
      if (nextIndex !== index) setActiveTab(tabs[nextIndex].id);
    },
    [activeTab]
  );

  return (
    <div className={leveSettingsPageClass}>
      <div className={leveSettingsHeaderStickyClass}>
        <div className={cn(settingsContentShell, 'py-5 sm:py-6 max-md:py-3')}>
          <div className="flex flex-col gap-6 max-md:gap-3">
            <div className="flex items-start gap-4 max-md:gap-2">
              <BackButton
                className="mt-1 shrink-0 self-start text-[var(--leve-header-text-muted)] hover:text-[var(--leve-header-accent)]"
                onClick={handleClose}
                title="Voltar"
                aria-label="Voltar"
              />
              <div className="min-w-0 flex-1">
                <h1 className={cn(leveViewPageTitleClass, 'max-md:text-2xl sm:text-3xl')}>Configurações</h1>
                <p className={cn(leveViewPageSubtitleClass, 'mt-2 max-md:mt-1 max-md:text-xs')}>
                  Gerencie suas integrações, preferências e configurações do projeto
                </p>
              </div>
            </div>

            <nav
              className={leveSettingsTabsNavClass}
              role="tablist"
              aria-label="Abas de configurações"
            >
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    onKeyDown={handleTabKeyDown}
                    className={isActive ? leveSettingsTabActiveClass : leveSettingsTabClass}
                    data-active={isActive ? 'true' : undefined}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tab-panel-${tab.id}`}
                    type="button"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className={leveSettingsContentAreaClass}>
        <div className={cn(settingsContentShell, 'py-6 max-md:py-3')}>
          <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
            <div
              id={`tab-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className={leveSettingsPanelClass}
            >
              {activeTab === 'jira' && (
                <JiraSettingsTab
                  onProjectImported={onProjectImported}
                  onDirtyChange={setHasUnsavedChanges}
                />
              )}
              {activeTab === 'supabase' && <SupabaseSettingsTab />}
              {activeTab === 'local-data' && (
                <LocalDataManagement onImportComplete={onLocalBackupRestored} />
              )}
              {activeTab === 'api-keys' && (
                <GeminiApiKeysTab onDirtyChange={setHasUnsavedChanges} />
              )}
              {activeTab === 'preferences' && <PreferencesTab />}
            </div>
          </Suspense>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          setShowCloseConfirm(false);
          navigate('/');
        }}
        title="Mudanças não salvas"
        message="Você tem alterações não salvas. Deseja sair mesmo assim?"
        confirmText="Sair sem salvar"
        cancelText="Continuar editando"
        variant="warning"
      />
    </div>
  );
};
