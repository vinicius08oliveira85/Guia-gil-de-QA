import React, { useState, useEffect } from 'react';
import { useProjectsStore } from '../../store/projectsStore';
import { NavigationMenu } from './NavigationMenu';
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

export const Header: React.FC<HeaderProps> = ({ onProjectImported: _onProjectImported, onOpenSettings }) => {
    const { projects, selectedProjectId, selectProject } = useProjectsStore();
    const { theme, toggleTheme, isOnlyLightSupported } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
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
    const handleTabChange = (index: number | null) => {
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
        } else if (index === 1) {
            toggleBeginnerMode();
        } else if (index === 2) {
            setShowNotificationDropdown(true);
        } else if (index === 3) {
            toggleTheme();
        }
    };

    const tabs = [
        { title: 'Configurações', icon: Settings },
        { title: isBeginnerMode ? 'Modo Iniciante' : 'Modo Avançado', icon: GraduationCap },
        { title: 'Notificações', icon: Bell },
        { title: getThemeTitle(), icon: getThemeIcon() },
    ];

    const activeColor = getActiveColorForTheme(theme);

    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '📊',
            onClick: () => selectProject(null),
        },
        {
            id: 'projects',
            label: 'Projetos',
            icon: '📁',
            onClick: () => selectProject(null),
            badge: projects.length,
        },
    ];

    return (
        <header
            className="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 min-w-0 py-2 px-3 sm:px-4">
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

                {/* Menu de Navegação Principal */}
                <div className="flex-1 flex justify-center md:justify-start md:px-8">
                    <NavigationMenu items={navItems} currentPath={selectedProjectId ? 'projects' : 'dashboard'} />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto relative">
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