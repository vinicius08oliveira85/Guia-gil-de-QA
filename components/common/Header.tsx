import React, { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { ExpandableTabs } from './ExpandableTabs';
import { useTheme } from '../../hooks/useTheme';
import { getActiveColorForTheme } from '../../utils/expandableTabsColors';
import { Settings, BookOpen, Bell, Moon, Sun, Heart, Monitor, User, LogOut, Sliders } from 'lucide-react';
import { Project } from '../../types';
import { getUnreadCount } from '../../utils/notificationService';
import { Modal } from './Modal';
import { GlossaryView } from '../glossary/GlossaryView';

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
    onOpenSettings?: () => void;
    onNavigate?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onProjectImported: _onProjectImported, onOpenSettings, onNavigate }) => {
    const { theme, toggleTheme, isOnlyLightSupported } = useTheme();
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

    // Atualizar contador de notificações não lidas
    useEffect(() => {
        const updateUnreadCount = () => {
            const count = getUnreadCount();
            setNotificationUnreadCount(count);
        };
        
        updateUnreadCount();
        // O polling com setInterval é ineficiente. A atualização via evento é a melhor abordagem.
        window.addEventListener('notification-created', updateUnreadCount);
        
        return () => {
            window.removeEventListener('notification-created', updateUnreadCount);
        };
    }, []);

    // Obter ícone do tema baseado no tema atual
    const getThemeIcon = () => {
        switch (theme) {
            case 'dark':
                return Moon;
            case 'light':
                return Sun;
            case 'leve-saude':
                return Heart;
            default:
                return Monitor;
        }
    };

    // Obter título do tema
    const getThemeTitle = () => {
        // Temas suportados: light e dark não mostram "(em breve)"
        const supportedThemes = ['light', 'dark'];
        const suffix = supportedThemes.includes(theme) ? '' : ' (em breve)';
        switch (theme) {
            case 'dark':
                return `Tema Escuro${suffix}`;
            case 'light':
                return 'Tema Claro';
            case 'leve-saude':
                return `Leve Saúde${suffix}`;
            default:
                return `Tema Automático${suffix}`;
        }
    };

    // Handler para quando um tab é selecionado
    const handleTabChange = (id: string | null) => {
        if (id === null) {
            setShowNotificationDropdown(false);
            return;
        }

        // Usar o ID do tab para uma lógica mais robusta e legível
        switch (id) {
            case 'glossary':
                setIsGlossaryOpen(true);
                break;
            case 'notifications':
                setShowNotificationDropdown(true);
                break;
            case 'theme':
                toggleTheme();
                break;
            default:
                break;
        }
    };

    const tabs = [
        { id: 'glossary', title: 'Glossário', icon: BookOpen },
        { id: 'notifications', title: 'Notificações', icon: Bell },
        { id: 'theme', title: getThemeTitle(), icon: getThemeIcon() },
    ];

    const activeColor = getActiveColorForTheme(theme);

    return (
        <header
            className="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-3 min-w-0 py-2 px-3 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <img
                        src="/logo@erasebg-transformed.png"
                        alt="Logo QA Agile Guide"
                        className="h-10 w-auto sm:h-12 flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                    <div className="min-w-0">
                        <p className="text-sm sm:text-base font-semibold leading-tight truncate">QA Agile Guide</p>
                        <p className="text-xs text-base-content/60 truncate hidden sm:block">
                            Gestão de QA ágil, métricas e automação
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 sm:gap-2 relative">
                    <nav className="flex items-center gap-2"></nav>
                    
                    {/* Container Relativo para segurar o menu no lugar certo */}
                    <div className="relative">
                    
                    {/* O BOTÃO (Atualizado com onClick) */}
                    <button 
                        onClick={() => setMenuAberto(!menuAberto)}
                        className={`relative flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 border 
                        ${menuAberto ? 'bg-base-200 text-blue-600 border-blue-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-base-200'}
                        `}
                    >
                        {/* Ícone de Engrenagem */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                        <circle cx="12" cy="12" r="3"/>
                        </svg>
                        
                        {/* Texto que aparece quando expande */}
                        <span className={`${menuAberto ? 'ml-2 block' : 'hidden group-hover:block ml-2'}`}>
                        Configurações
                        </span>
                    </button>

                    {/* O MENU DROPDOWN (A parte que faltava no seu código!) */}
                    {menuAberto && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Meu Perfil</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onOpenSettings?.(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Preferências</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sair</a>
                        </div>
                        </div>
                    )}
                    </div>

                    <div className="relative">
                        <ExpandableTabs
                            tabs={tabs}
                            activeColor={activeColor}
                            onChange={handleTabChange}
                        />
                        
                        {/* Badge de notificações não lidas */}
                        {notificationUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-error text-error-content text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center shadow-sm pointer-events-none z-10">
                                {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                            </span>
                        )}
                    </div>

                    {/* Dropdown de notificações */}
                    {showNotificationDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                    setShowNotificationDropdown(false);
                                }}
                            />
                            <div className="absolute right-0 top-full mt-2 z-50 w-80">
                                <NotificationBell 
                                    isOpen={showNotificationDropdown}
                                    onClose={() => {
                                        setShowNotificationDropdown(false);
                                    }}
                                    showButton={false}
                                />
                            </div>
                        </>
                    )}

                    {/* Modal do Glossário */}
                    <Modal
                        isOpen={isGlossaryOpen}
                        onClose={() => setIsGlossaryOpen(false)}
                        title="Glossário"
                        size="xl"
                    >
                        <GlossaryView />
                    </Modal>

                    {/* Badge para temas ainda não suportados (leve-saude, auto) */}
                    {isOnlyLightSupported && (
                        <span className="badge badge-outline badge-sm hidden sm:inline-flex">
                            Tema em breve
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
};