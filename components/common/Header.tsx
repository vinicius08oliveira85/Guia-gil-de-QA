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
import { useProjectsStore } from '../../store/projectsStore';
import { isSupabaseAvailable } from '../../services/supabaseService';
import toast from 'react-hot-toast';

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
    const [isSaving, setIsSaving] = useState(false);

    const { saveProjectToSupabase, getSelectedProject } = useProjectsStore();

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

    const handleSave = async () => {
        const selectedProject = getSelectedProject();
        if (!selectedProject) return;

        if (!isSupabaseAvailable()) {
            toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
            return;
        }

        setIsSaving(true);
        try {
            await saveProjectToSupabase(selectedProject.id);
            toast.success(`Projeto "${selectedProject.name}" salvo com sucesso!`);
        } catch (error) {
            toast.error('Erro ao salvar projeto.');
        } finally {
            setIsSaving(false);
        }
    };

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

                    {getSelectedProject() && (
                        <button
                            className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                            aria-label="Salvar"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .724.229l9.075-12.476.401-.562a1.04 1.04 0 0 0-.838-1.66Z" fill="#3ECF8E"></path></svg>
                            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                        </button>
                    )}

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