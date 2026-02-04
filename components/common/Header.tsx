import React, { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { ExpandableTabs } from './ExpandableTabs';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { getActiveColorForTheme } from '../../utils/expandableTabsColors';
import { Settings, GraduationCap, Bell, Moon, Sun, Heart, Monitor, User, LogOut, Sliders } from 'lucide-react';
import { Project } from '../../types';
import { getUnreadCount } from '../../utils/notificationService';
import { NavigationMenu } from './NavigationMenu';
import { useProjectsStore } from '../../store/projectsStore';

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
    onOpenSettings?: () => void;
    onNavigate?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onProjectImported: _onProjectImported, onOpenSettings, onNavigate }) => {
    const { theme, toggleTheme, isOnlyLightSupported } = useTheme();
    const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode();
    const { projects, selectProject, selectedProjectId } = useProjectsStore();
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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
            setShowSettings(false);
            return;
        }

        // Usar o ID do tab para uma lógica mais robusta e legível
        switch (id) {
            case 'settings':
                setShowNotificationDropdown(false);
                setShowSettings((prev) => !prev);
                break;
            case 'beginner-mode':
                toggleBeginnerMode();
                break;
            case 'notifications':
                setShowSettings(false);
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
        { id: 'settings', title: 'Configurações', icon: Settings },
        { id: 'beginner-mode', title: isBeginnerMode ? 'Modo Iniciante' : 'Modo Avançado', icon: GraduationCap },
        { id: 'notifications', title: 'Notificações', icon: Bell },
        { id: 'theme', title: getThemeTitle(), icon: getThemeIcon() },
    ];

    const activeColor = getActiveColorForTheme(theme);

    // Itens de navegação principais
    const navItems = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: '📊', 
            onClick: () => {
                selectProject(null);
                onNavigate?.('dashboard');
            } 
        },
        { 
            id: 'projects', 
            label: 'Projetos', 
            icon: '📁', 
            onClick: () => {
                selectProject(null);
                onNavigate?.('projects');
            },
            badge: projects.length
        },
        { id: 'glossary', label: 'Glossário', icon: '📚', onClick: () => onNavigate?.('glossary') },
    ];

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
                    <NavigationMenu items={navItems} currentPath={selectedProjectId ? 'project' : 'dashboard'} />
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

                        {/* Dropdown de Configurações */}
                        {showSettings && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowSettings(false)}
                                />
                                <div className="absolute top-full left-0 mt-2 z-50 w-48 rounded-xl border border-base-300 bg-base-100 shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button 
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-base-200 transition-colors"
                                        onClick={() => setShowSettings(false)}
                                    >
                                        <User size={16} />
                                        <span>Perfil</span>
                                    </button>
                                    <button 
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-base-200 transition-colors"
                                        onClick={() => {
                                            setShowSettings(false);
                                            onOpenSettings?.();
                                        }}
                                    >
                                        <Sliders size={16} />
                                        <span>Preferências</span>
                                    </button>
                                    <div className="my-1 h-px bg-base-200" />
                                    <button 
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors"
                                        onClick={() => setShowSettings(false)}
                                    >
                                        <LogOut size={16} />
                                        <span>Sair</span>
                                    </button>
                                </div>
                            </>
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