import React, { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { ExpandableTabs } from './ExpandableTabs';
import { useTheme } from '../../hooks/useTheme';
import { getActiveColorForTheme } from '../../utils/expandableTabsColors';
import { BookOpen, Bell, Moon, Sun, Heart, Monitor, Sliders } from 'lucide-react';
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
            case 'settings':
                onOpenSettings?.();
                setShowNotificationDropdown(false);
                break;
            case 'glossary':
                setIsGlossaryOpen(true);
                break;
            case 'notifications':
                setShowNotificationDropdown(true);
                break;
            case 'theme':
                toggleTheme();
                break;
        }
    };

    const tabs = [
        { id: 'settings', title: 'Preferências', icon: Sliders },
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
                        src="/Logo_Moderno_Leve-removebg-preview.png"
                        alt="Logo QA Agile Guide"
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
                        size="6xl"
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