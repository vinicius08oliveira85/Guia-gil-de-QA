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
            <div className="win-toolbar border-b border-surface-border bg-surface/95 backdrop-blur-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="win-icon-button"
                                title="Voltar"
                                aria-label="Voltar"
                            >
                                <span className="text-xl">←</span>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
                                <p className="text-sm text-text-secondary mt-1">
                                    Gerencie suas integrações e preferências
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-surface-border bg-surface/50">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-accent text-accent'
                                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-border'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
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

