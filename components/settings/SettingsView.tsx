import React, { useState, Suspense, useCallback } from 'react';
import { Link, Database, Settings as SettingsIcon, Key } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Project } from '../../types';
import { cn } from '../../utils/cn';

// Lazy load das tabs com tratamento de erro
const lazyLoadTab = (importFn: () => Promise<any>, name: string) => {
    return React.lazy(() => 
        importFn().catch((error) => {
            console.error(`Erro ao carregar ${name}:`, error);
            // Retornar um componente de fallback em caso de erro
            return {
                default: () => (
                    <div className="p-6">
                        <div className="alert alert-error">
                            <span>Erro ao carregar {name}. Por favor, recarregue a página.</span>
                        </div>
                    </div>
                )
            };
        })
    );
};

const JiraSettingsTab = lazyLoadTab(() => import('./JiraSettingsTab').then(m => ({ default: m.JiraSettingsTab })), 'JiraSettingsTab');
const SupabaseSettingsTab = lazyLoadTab(() => import('./SupabaseSettingsTab').then(m => ({ default: m.SupabaseSettingsTab })), 'SupabaseSettingsTab');
const PreferencesTab = lazyLoadTab(() => import('./PreferencesTab').then(m => ({ default: m.PreferencesTab })), 'PreferencesTab');
const GeminiApiKeysTab = lazyLoadTab(() => import('./GeminiApiKeysTab').then(m => ({ default: m.GeminiApiKeysTab })), 'GeminiApiKeysTab');

interface SettingsViewProps {
    onClose: () => void;
    onProjectImported?: (project: Project) => void;
}

type TabType = 'jira' | 'supabase' | 'preferences' | 'api-keys';

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose, onProjectImported }) => {
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

    const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
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
    }, [activeTab, tabs]);

    const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'jira', label: 'Jira', icon: Link },
        { id: 'supabase', label: 'Supabase', icon: Database },
        { id: 'api-keys', label: 'API Keys', icon: Key },
        { id: 'preferences', label: 'Preferências', icon: SettingsIcon },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-base-100">
            {/* Header melhorado */}
            <div className="sticky top-0 z-20 border-b border-base-300 bg-base-100/95 backdrop-blur-sm">
                <div className="container mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col gap-6">
                        {/* Header com título e subtítulo */}
                        <div className="flex items-start gap-4">
                            <button
                                onClick={handleClose}
                                className="btn btn-ghost btn-sm rounded-full shrink-0 mt-1 gap-1"
                                title="Voltar"
                                aria-label="Voltar"
                                type="button"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="sr-only sm:not-sr-only text-sm">Voltar</span>
                            </button>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
                                    Configurações
                                </h1>
                                <p className="text-sm text-base-content/70 mt-2 max-w-2xl leading-relaxed">
                                    Gerencie suas integrações, preferências e configurações do projeto
                                </p>
                            </div>
                        </div>
                        
                        {/* Tab Navigation melhorada */}
                        <div className="border-b border-base-300" role="tablist" aria-label="Abas de configurações">
                            <nav className="flex gap-1 overflow-x-auto no-scrollbar">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            onKeyDown={handleTabKeyDown}
                                            className={cn(
                                                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                                'hover:text-base-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                                                isActive
                                                    ? 'border-primary text-primary'
                                                    : 'border-transparent text-base-content/70 hover:border-base-300'
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
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        <div id={`tab-panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
                            {activeTab === 'jira' && (
                                <JiraSettingsTab onProjectImported={onProjectImported} onDirtyChange={setHasUnsavedChanges} />
                            )}
                            {activeTab === 'supabase' && <SupabaseSettingsTab />}
                            {activeTab === 'api-keys' && <GeminiApiKeysTab onDirtyChange={setHasUnsavedChanges} />}
                            {activeTab === 'preferences' && <PreferencesTab />}
                        </div>
                    </Suspense>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showCloseConfirm}
                onClose={() => setShowCloseConfirm(false)}
                onConfirm={() => { setShowCloseConfirm(false); onClose(); }}
                title="Mudanças não salvas"
                message="Você tem alterações não salvas. Deseja sair mesmo assim?"
                confirmText="Sair sem salvar"
                cancelText="Continuar editando"
                variant="warning"
            />
        </div>
    );
};

