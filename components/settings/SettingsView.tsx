import React, { useState, Suspense } from 'react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { Project } from '../../types';

// Lazy load das tabs
const JiraSettingsTab = React.lazy(() => import('./JiraSettingsTab').then(m => ({ default: m.JiraSettingsTab })));
const SupabaseSettingsTab = React.lazy(() => import('./SupabaseSettingsTab').then(m => ({ default: m.SupabaseSettingsTab })));
const PreferencesTab = React.lazy(() => import('./PreferencesTab').then(m => ({ default: m.PreferencesTab })));

interface SettingsViewProps {
    onClose: () => void;
    onProjectImported?: (project: Project) => void;
}

type TabType = 'jira' | 'supabase' | 'preferences';

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose, onProjectImported }) => {
    const [activeTab, setActiveTab] = useState<TabType>('jira');

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'jira', label: 'Jira', icon: '🔗' },
        { id: 'supabase', label: 'Supabase', icon: '💾' },
        { id: 'preferences', label: 'Preferências', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header v0-like */}
            <div className="sticky top-0 z-20 border-b border-base-300 bg-base-100/95 backdrop-blur-sm">
                <div className="container mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onClose}
                                    className="btn btn-ghost btn-sm rounded-full"
                                    title="Voltar"
                                    aria-label="Voltar"
                                    type="button"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">Configurações</h1>
                                    <p className="text-sm text-base-content/70 mt-1 max-w-2xl">
                                        Gerencie suas integrações, preferências e configurações do projeto
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Tab Navigation */}
                        <div className="tabs tabs-boxed overflow-x-auto w-full" role="tablist" aria-label="Abas de configurações">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'tab-active bg-primary text-primary-content' : ''}`}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`tab-panel-${tab.id}`}
                                    type="button"
                                >
                                    <span aria-hidden="true">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 py-6">
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        {activeTab === 'jira' && (
                            <JiraSettingsTab onProjectImported={onProjectImported} />
                        )}
                        {activeTab === 'supabase' && <SupabaseSettingsTab />}
                        {activeTab === 'preferences' && <PreferencesTab />}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

