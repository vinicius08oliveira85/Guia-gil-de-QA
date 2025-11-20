import React, { useState, Suspense } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { Project } from '../../types';

// Lazy load das tabs
const JiraSettingsTab = React.lazy(() => import('./JiraSettingsTab').then(m => ({ default: m.JiraSettingsTab })));
const SupabaseSettingsTab = React.lazy(() => import('./SupabaseSettingsTab').then(m => ({ default: m.SupabaseSettingsTab })));
const PreferencesTab = React.lazy(() => import('./PreferencesTab').then(m => ({ default: m.PreferencesTab })));

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectImported?: (project: Project) => void;
}

type TabType = 'jira' | 'supabase' | 'preferences';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onProjectImported }) => {
    const [activeTab, setActiveTab] = useState<TabType>('jira');

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'jira', label: 'Jira', icon: '🔗' },
        { id: 'supabase', label: 'Supabase', icon: '💾' },
        { id: 'preferences', label: 'Preferências', icon: '⚙️' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Configurações"
            size="lg"
            maxHeight="90vh"
        >
            <div className="flex flex-col h-full">
                {/* Tab Navigation */}
                <div className="flex border-b border-surface-border mb-4 gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
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

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<LoadingSkeleton variant="card" count={2} />}>
                        {activeTab === 'jira' && (
                            <JiraSettingsTab onProjectImported={onProjectImported} />
                        )}
                        {activeTab === 'supabase' && <SupabaseSettingsTab />}
                        {activeTab === 'preferences' && <PreferencesTab />}
                    </Suspense>
                </div>
            </div>
        </Modal>
    );
};

