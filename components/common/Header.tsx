import React from 'react';
import { CompassIcon } from './Icons';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';

export const Header = React.memo(() => {
    const { theme, toggleTheme } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
    
    return (
        <header className="mica p-3 sm:p-4 sticky top-0 z-20 shadow-lg" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-accent p-2 rounded-lg shadow-md">
                        <CompassIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-text-primary">QA Agile Guide</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleBeginnerMode}
                        className={`min-h-[44px] min-w-[44px] p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-hover active:scale-95 active:opacity-80 ${isBeginnerMode ? 'bg-accent/20 text-accent' : ''}`}
                        title={isBeginnerMode ? 'Modo Iniciante: Ativado (clique para desativar)' : 'Modo Iniciante: Desativado (clique para ativar)'}
                        aria-label="Alternar modo iniciante"
                    >
                        {isBeginnerMode ? '🎓' : '📚'}
                    </button>
                    <NotificationBell />
                    <button
                        onClick={toggleTheme}
                        className="min-h-[44px] min-w-[44px] p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-hover active:scale-95 active:opacity-80"
                        title={`Tema: ${theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Automático'}`}
                        aria-label="Alternar tema"
                    >
                        {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
                    </button>
                </div>
            </div>
        </header>
    );
});