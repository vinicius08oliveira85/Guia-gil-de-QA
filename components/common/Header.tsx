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
            <header
                className="win-toolbar sticky top-0 z-30 shadow-[0_25px_80px_rgba(3,7,23,0.45)]"
                style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
                <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 min-w-0 py-2 sm:py-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-[18px] bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-[0_15px_40px_rgba(14,109,253,0.45)] border border-white/20 flex-shrink-0">
                            <CompassIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[0.75rem] uppercase tracking-[0.35em] text-text-tertiary mb-1">
                                Windows 12 Edition
                            </p>
                            <h1 className="text-lg sm:text-2xl font-semibold text-text-primary line-clamp-2 text-balance">
                                QA Agile Guide
                            </h1>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="win-icon-button"
                            title="Configurações"
                            aria-label="Abrir configurações"
                        >
                            <span className="text-xl">⚙️</span>
                        </button>
                        <button
                            onClick={toggleBeginnerMode}
                            className={`win-icon-button ${isBeginnerMode ? 'bg-accent/20 text-white shadow-[0_10px_25px_rgba(14,109,253,0.35)]' : ''}`}
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
                            className="win-icon-button"
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