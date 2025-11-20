import React, { useState, Suspense } from 'react';
import { CompassIcon } from './Icons';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Project } from '../../types';

// Lazy load do SettingsModal
const SettingsModal = React.lazy(() => import('../settings/SettingsModal').then(m => ({ default: m.SettingsModal })));

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
}

export const Header: React.FC<HeaderProps> = ({ onProjectImported }) => {
    const { theme, toggleTheme } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
    const [showSettings, setShowSettings] = useState(false);
    
    return (
        <>
            <header className="mica px-3 py-2 sm:p-4 sticky top-0 z-20 shadow-lg" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-accent p-2 rounded-lg shadow-md flex-shrink-0">
                            <CompassIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-text-primary line-clamp-2 text-balance">
                            QA Agile Guide
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="min-h-[44px] min-w-[44px] p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-hover active:scale-95 active:opacity-80 flex-shrink-0"
                            title="Configurações"
                            aria-label="Abrir configurações"
                        >
                            <span className="text-xl">⚙️</span>
                        </button>
                        <button
                            onClick={toggleBeginnerMode}
                            className={`min-h-[44px] min-w-[44px] p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-hover active:scale-95 active:opacity-80 flex-shrink-0 ${isBeginnerMode ? 'bg-accent/20 text-accent' : ''}`}
                            title={isBeginnerMode ? 'Modo Iniciante: Ativado (clique para desativar)' : 'Modo Iniciante: Desativado (clique para ativar)'}
                            aria-label="Alternar modo iniciante"
                        >
                            <span className="text-xl">{isBeginnerMode ? '🎓' : '📚'}</span>
                        </button>
                        <div className="flex-shrink-0">
                            <NotificationBell />
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="min-h-[44px] min-w-[44px] p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-hover active:scale-95 active:opacity-80 flex-shrink-0"
                            title={`Tema: ${theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Automático'}`}
                            aria-label="Alternar tema"
                        >
                            <span className="text-xl">{theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}</span>
                        </button>
                    </div>
                </div>
            </header>
            <Suspense fallback={null}>
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onProjectImported={onProjectImported}
                />
            </Suspense>
        </>
    );
};