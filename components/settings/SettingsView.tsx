import React, { useState, Suspense, useCallback } from 'react';
import { Link, Database, Settings as SettingsIcon, Key, HardDrive } from 'lucide-react';
import { BackButton } from '../common/BackButton';
import { LocalDataManagement } from '../common/LocalDataManagement';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Project } from '../../types';
import { cn } from '../../utils/cn';
import { pageSubtitleClass, settingsContentShell } from '../common/viewUi';

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

type TabType = 'jira' | 'supabase' | 'local-data' | 'api-keys' | 'preferences';

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'jira', label: 'Jira', icon: Link },
  { id: 'supabase', label: 'Supabase', icon: Database },
  { id: 'local-data', label: 'Dados locais', icon: HardDrive },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'preferences', label: 'Preferências', icon: SettingsIcon },
];

interface SettingsViewProps {
  onClose: () => void;
  onProjectImported?: (project: Project) => void;
  /** Após importar backup JSON do IndexedDB, recarregar projetos no store. */
  onLocalBackupRestored?: () => void | Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onClose,
  onProjectImported,
  onLocalBackupRestored,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('jira');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
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
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Header melhorado */}
      <div className="sticky top-0 z-20 border-b border-base-300/60 bg-base-100 soft-shadow">
        <div className={cn(settingsContentShell, 'py-5 sm:py-6')}>
          <div className="flex flex-col gap-6">
            {/* Header com título e subtítulo */}
            <div className="flex items-start gap-4">
              <BackButton
                className="shrink-0 mt-1 self-start"
                onClick={handleClose}
                title="Voltar"
                aria-label="Voltar"
              />
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                  Configurações
                </h1>
                <p className={cn(pageSubtitleClass, 'mt-2')}>
                  Gerencie suas integrações, preferências e configurações do projeto
                </p>
              </div>
            </div>

            {/* Tab Navigation melhorada */}
            <nav
              className="no-scrollbar flex gap-4 overflow-x-auto border-b border-base-300/70 sm:gap-6"
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
                    className={cn(
                      'relative inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap px-0.5 pb-2.5 pt-1 font-heading text-sm transition-colors sm:min-h-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] focus-visible:ring-offset-2',
                      isActive
                        ? 'font-semibold text-base-content after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-error after:content-[""]'
                        : 'font-medium text-base-content/55 hover:text-base-content/85'
                    )}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tab-panel-${tab.id}`}
                    type="button"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-base-200/30">
        <div className={cn(settingsContentShell, 'py-6')}>
          <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
            <div
              id={`tab-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="rounded-[var(--rounded-box)] border border-base-300/60 bg-base-100 p-4 soft-shadow sm:p-5"
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
          onClose();
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
