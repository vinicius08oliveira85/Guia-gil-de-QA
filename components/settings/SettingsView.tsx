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
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-base-300 bg-base-100/80 backdrop-blur">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="btn btn-ghost btn-sm"
                                title="Voltar"
                                aria-label="Voltar"
                                type="button"
                            >
                                <span className="text-xl">←</span>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">Configurações</h1>
                                <p className="text-sm text-base-content/70 mt-1">
                                    Gerencie suas integrações e preferências
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-base-300 bg-base-100/60">
                <div className="container mx-auto px-4 sm:px-6 py-3">
                    <div className="tabs tabs-boxed overflow-x-auto w-full" role="tablist" aria-label="Abas de configurações">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : ''}`}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                type="button"
                            >
                                <span className="mr-2" aria-hidden="true">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
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

