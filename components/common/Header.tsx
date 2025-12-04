import React from 'react';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { Project } from '../../types';

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
    onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProjectImported, onOpenSettings }) => {
    const { theme, toggleTheme } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
    
    return (
        <header
            className="win-toolbar sticky top-0 z-30 shadow-[0_18px_60px_rgba(3,7,23,0.45)]"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-sm min-w-0 py-1.5 sm:py-2 px-3">
                <div className="flex items-center gap-sm min-w-0">
                    <img
                        src="/logo@erasebg-transformed.png"
                        alt="Logo QA Agile Guide"
                        className="h-10 w-auto sm:h-12 flex-shrink-0 logo-leve-shadow"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                    <span className="sr-only">QA Agile Guide</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-xs sm:gap-sm w-full sm:w-auto">
                    <button
                        onClick={() => onOpenSettings?.()}
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
                        aria-pressed={isBeginnerMode}
                    >
                        <span className="text-xl">{isBeginnerMode ? '🎓' : '📚'}</span>
                    </button>
                    <div className="flex-shrink-0">
                        <NotificationBell />
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="win-icon-button"
                        title={`Tema: ${theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : theme === 'leve-saude' ? 'Leve Saúde' : 'Automático'}`}
                        aria-label="Alternar tema"
                        aria-pressed={theme === 'dark'}
                    >
                        <span className="text-xl">
                            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : theme === 'leve-saude' ? '🧡' : '💻'}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
};