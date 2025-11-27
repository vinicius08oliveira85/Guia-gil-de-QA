import React, { useState, Suspense } from 'react';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { Project } from '../../types';

// Lazy load do SettingsModal
const SettingsModal = React.lazy(() => import('../settings/SettingsModal').then(m => ({ default: m.SettingsModal })));

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
}

/**
 * Header principal da aplicação com design Windows 12
 * Inclui logo, controles de tema, modo iniciante e configurações
 */
export const Header: React.FC<HeaderProps> = ({ onProjectImported }) => {
    const { theme, toggleTheme } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
    const [showSettings, setShowSettings] = useState(false);
    
    return (
        <>
            <header
                className="sticky top-0 z-30 backdrop-blur-2xl border-b border-cyan-500/10 bg-gradient-to-r from-slate-900/98 via-slate-900/95 to-slate-900/98 shadow-[0_4px_30px_rgba(0,0,0,0.3),0_0_60px_rgba(34,211,238,0.08)]"
                style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
            >
                <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 min-w-0 py-2 sm:py-3 px-3">
                    {/* Logo e título */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-fuchsia-500/10 border border-cyan-400/30 shadow-[0_8px_32px_rgba(34,211,238,0.2)] overflow-hidden flex items-center justify-center flex-shrink-0 backdrop-blur-xl">
                            <img
                                src="/qa-agile-guide-logo.svg"
                                alt="Logo QA Agile Guide"
                                className="h-full w-full object-contain p-1.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                            <span className="sr-only">QA Agile Guide</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-cyan-400/70 mb-0.5 font-medium">
                                Laboratório de QA em Software
                            </p>
                            <h1 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-slate-100 via-cyan-200 to-violet-200 bg-clip-text text-transparent line-clamp-2 text-balance">
                                QA Agile Guide
                            </h1>
                        </div>
                    </div>
                    
                    {/* Controles */}
                    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                        {/* Botão Configurações */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="group relative w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-700/60 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-cyan-500/20"
                            title="Configurações"
                            aria-label="Abrir configurações"
                        >
                            <span className="text-lg group-hover:scale-110 transition-transform duration-200">⚙️</span>
                        </button>
                        
                        {/* Botão Modo Iniciante */}
                        <button
                            onClick={toggleBeginnerMode}
                            className={`group relative w-10 h-10 rounded-xl border transition-all duration-200 flex items-center justify-center shadow-lg ${
                                isBeginnerMode 
                                    ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-violet-500/50 shadow-violet-500/25' 
                                    : 'bg-slate-800/60 border-slate-700/50 hover:border-violet-500/40 hover:bg-slate-700/60'
                            }`}
                            title={isBeginnerMode ? 'Modo Iniciante: Ativado (clique para desativar)' : 'Modo Iniciante: Desativado (clique para ativar)'}
                            aria-label="Alternar modo iniciante"
                            aria-pressed={isBeginnerMode}
                        >
                            <span className={`text-lg transition-transform duration-200 ${isBeginnerMode ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {isBeginnerMode ? '🎓' : '📚'}
                            </span>
                        </button>
                        
                        {/* Notificações */}
                        <div className="flex-shrink-0">
                            <NotificationBell />
                        </div>
                        
                        {/* Botão Tema */}
                        <button
                            onClick={toggleTheme}
                            className="group relative w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 hover:bg-slate-700/60 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-amber-500/20"
                            title={`Tema: ${theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Automático'}`}
                            aria-label="Alternar tema"
                            aria-pressed={theme === 'dark'}
                        >
                            <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                                {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
                            </span>
                        </button>
                    </div>
                </div>
                
                {/* Linha de destaque inferior com gradiente */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
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
