import React, { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { ExpandableTabs } from './ExpandableTabs';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { getActiveColorForTheme } from '../../utils/expandableTabsColors';
import { Settings, GraduationCap, Bell, Moon, Sun, Heart, Monitor } from 'lucide-react';
import { Project } from '../../types';
import { getUnreadCount } from '../../utils/notificationService';

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
    onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProjectImported, onOpenSettings }) => {
    const { theme, toggleTheme } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
    const [selectedTab, setSelectedTab] = useState<number | null>(null);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    // Atualizar contador de notificações não lidas
    useEffect(() => {
        const updateUnreadCount = () => {
            setNotificationUnreadCount(getUnreadCount());
        };
        
        updateUnreadCount();
        const interval = setInterval(updateUnreadCount, 1000);
        
        const handleNotificationCreated = () => {
            updateUnreadCount();
        };
        
        window.addEventListener('notification-created', handleNotificationCreated);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('notification-created', handleNotificationCreated);
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
        switch (theme) {
            case 'dark':
                return 'Tema Escuro';
            case 'light':
                return 'Tema Claro';
            case 'leve-saude':
                return 'Leve Saúde';
            default:
                return 'Tema Automático';
        }
    };

    // Handler para quando um tab é selecionado
    const handleTabChange = (index: number | null) => {
        setSelectedTab(index);
        
        if (index === null) {
            setShowNotificationDropdown(false);
            return;
        }

        // Mapear índices para ações
        // Índice 0: Settings
        // Índice 1: Beginner Mode
        // Índice 2: Notifications
        // Índice 3: Theme
        
        if (index === 0) {
            onOpenSettings?.();
            setSelectedTab(null);
        } else if (index === 1) {
            toggleBeginnerMode();
            setSelectedTab(null);
        } else if (index === 2) {
            setShowNotificationDropdown(true);
        } else if (index === 3) {
            toggleTheme();
            setSelectedTab(null);
        }
    };

    const tabs = [
        { title: 'Configurações', icon: Settings },
        { title: isBeginnerMode ? 'Modo Iniciante' : 'Modo Avançado', icon: GraduationCap },
        { title: 'Notificações', icon: Bell },
        { title: getThemeTitle(), icon: getThemeIcon() },
    ];

    const activeColor = getActiveColorForTheme(theme);

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
                        className="h-16 w-auto sm:h-20 flex-shrink-0 logo-leve-shadow"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                    <span className="sr-only">QA Agile Guide</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-xs sm:gap-sm w-full sm:w-auto relative">
                    <div className="relative">
                        <ExpandableTabs
                            tabs={tabs}
                            activeColor={activeColor}
                            onChange={handleTabChange}
                        />
                        
                        {/* Badge de notificações não lidas */}
                        {notificationUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-danger/90 text-white text-[0.65rem] rounded-full w-5 h-5 flex items-center justify-center shadow-[0_6px_18px_rgba(255,92,112,0.45)] pointer-events-none z-10">
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
                                    setSelectedTab(null);
                                }}
                            />
                            <div className="absolute right-0 top-full mt-2 z-50 w-80">
                                <NotificationBell 
                                    isOpen={showNotificationDropdown}
                                    onClose={() => {
                                        setShowNotificationDropdown(false);
                                        setSelectedTab(null);
                                    }}
                                    showButton={false}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};