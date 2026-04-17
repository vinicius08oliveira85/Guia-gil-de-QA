import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { NotificationBell } from './NotificationBell';
import { ExpandableTabs } from './ExpandableTabs';
import { ExpansibleButton } from './ExpansibleButton';
import { useTheme } from '../../hooks/useTheme';
import { getActiveColorForTheme } from '../../utils/expandableTabsColors';
import {
    BookOpen,
    Bell,
    Moon,
    Sun,
    Heart,
    Monitor,
    Sliders,
    Plus,
    Loader2,
    ChevronLeft,
    Menu,
    X,
    LayoutGrid,
} from 'lucide-react';
import { Project } from '../../types';
import { getUnreadCount } from '../../utils/notificationService';
import { Modal } from './Modal';
import { GlossaryView } from '../glossary/GlossaryView';
import { useProjectsStore } from '../../store/projectsStore';
import { useJiraSync } from '../../hooks/useJiraSync';
import { isSupabaseAvailable } from '../../services/supabaseService';
import toast from 'react-hot-toast';

interface HeaderProps {
    onProjectImported?: (project: Project) => void;
    onOpenSettings?: () => void;
    onNavigate?: (view: string) => void;
    onOpenCreateModal?: () => void;
    showDashboardActions?: boolean;
    onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    onProjectImported: _onProjectImported,
    onOpenSettings,
    onNavigate: _onNavigate,
    onOpenCreateModal,
    showDashboardActions,
    onLogoClick,
}) => {
    const { theme, toggleTheme } = useTheme();
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
    const [expandedButton, setExpandedButton] = useState<'jira' | 'salvar' | 'novo' | 'sync' | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    const { saveProjectToSupabase, getSelectedProject, syncProjectsFromSupabase, updateProject } = useProjectsStore();
    const selectedProject = getSelectedProject();
    const {
        handleSyncJira,
        isSyncingJira,
        showJiraProjectSelector,
        setShowJiraProjectSelector,
        availableJiraProjects,
        selectedJiraProjectKey,
        setSelectedJiraProjectKey,
        handleConfirmJiraProject,
    } = useJiraSync(selectedProject ?? null, updateProject);

    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

    useEffect(() => {
        const updateUnreadCount = () => {
            const count = getUnreadCount();
            setNotificationUnreadCount(count);
        };

        updateUnreadCount();
        window.addEventListener('notification-created', updateUnreadCount);

        return () => {
            window.removeEventListener('notification-created', updateUnreadCount);
        };
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeMobileMenu();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [mobileMenuOpen, closeMobileMenu]);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const el = mobileMenuPanelRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        el?.focus();
    }, [mobileMenuOpen]);

    /** Permite cabeçalhos sticky nas views (ex.: ProjectView) logo abaixo deste header. */
    useLayoutEffect(() => {
        const el = headerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const setVar = () => {
            const h = Math.ceil(el.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--app-header-h', `${h}px`);
        };
        setVar();
        const ro = new ResizeObserver(setVar);
        ro.observe(el);
        return () => {
            ro.disconnect();
        };
    }, [mobileMenuOpen, selectedProject?.id, showDashboardActions]);

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

    const handleTabChange = (id: string | null) => {
        if (id === null) {
            setShowNotificationDropdown(false);
            return;
        }

        switch (id) {
            case 'settings':
                onOpenSettings?.();
                setShowNotificationDropdown(false);
                closeMobileMenu();
                break;
            case 'glossary':
                setIsGlossaryOpen(true);
                closeMobileMenu();
                break;
            case 'notifications':
                setShowNotificationDropdown(true);
                closeMobileMenu();
                break;
            case 'theme':
                toggleTheme();
                break;
        }
    };

    const tabs = [
        { id: 'settings', title: 'Configurações', icon: Sliders },
        { id: 'glossary', title: 'Glossário', icon: BookOpen },
        { id: 'notifications', title: 'Notificações', icon: Bell },
        { id: 'theme', title: getThemeTitle(), icon: getThemeIcon() },
    ];

    const activeColor = getActiveColorForTheme(theme);

    const handleSave = async () => {
        const proj = getSelectedProject();
        if (!proj) return;

        if (!isSupabaseAvailable()) {
            toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
            return;
        }

        setIsSaving(true);
        try {
            await saveProjectToSupabase(proj.id);
            toast.success(`Projeto "${proj.name}" salvo com sucesso!`);
        } catch {
            toast.error('Erro ao salvar projeto.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncSupabase = async () => {
        if (!isSupabaseAvailable()) {
            toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
            return;
        }

        setIsSyncingSupabase(true);
        try {
            await syncProjectsFromSupabase();
            toast.success('Projetos sincronizados do Supabase com sucesso!');
        } catch {
            toast.error('Erro ao sincronizar projetos do Supabase.');
        } finally {
            setIsSyncingSupabase(false);
        }
    };

    const supabaseBoltIcon = (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0" aria-hidden>
            <path
                d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .724.229l9.075-12.476.401-.562a1.04 1.04 0 0 0-.838-1.66Z"
                fill="#3ECF8E"
            />
        </svg>
    );

    const logoContent = (
        <>
            <img
                src="/Logo_Moderno_Leve-removebg-preview.png"
                alt=""
                aria-hidden="true"
                className="h-10 w-auto flex-shrink-0 sm:h-12"
                loading="lazy"
                decoding="async"
                draggable={false}
            />
            <div className="min-w-0">
                <p className="font-heading text-balance text-sm font-semibold leading-tight text-base-content sm:text-base">QA Agile Guide</p>
                <p className="hidden truncate font-body text-xs text-balance text-base-content/60 sm:block">Gestão de QA ágil, métricas e automação</p>
            </div>
        </>
    );

    const leadingContent =
        selectedProject ? (
            <>
                <ExpansibleButton
                    icon={
                        isSyncingJira ? (
                            <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin" aria-hidden />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0" aria-hidden>
                                <defs>
                                    <linearGradient id="jiraGradientHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#2684FF" />
                                        <stop offset="100%" stopColor="#0052CC" />
                                    </linearGradient>
                                </defs>
                                <path d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z" fill="#0052CC" opacity="0.2" transform="translate(1 1)" />
                                <path d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z" fill="url(#jiraGradientHeader)" />
                                <path d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z" fill="#0052CC" opacity="0.2" transform="translate(1 1)" />
                                <path d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z" fill="url(#jiraGradientHeader)" />
                                <path d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z" fill="#0052CC" opacity="0.2" transform="translate(1 1)" />
                                <path d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z" fill="url(#jiraGradientHeader)" />
                            </svg>
                        )
                    }
                    label={isSyncingJira ? 'Sincronizando...' : 'Jira'}
                    onClick={handleSyncJira}
                    disabled={isSyncingJira}
                    ariaLabel="Sincronizar com Jira"
                    isExpanded={expandedButton === 'jira'}
                    onExpandedChange={(expanded) => setExpandedButton(expanded ? 'jira' : null)}
                />
                <ExpansibleButton
                    icon={
                        isSaving ? (
                            <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin text-primary" aria-hidden />
                        ) : (
                            supabaseBoltIcon
                        )
                    }
                    label={isSaving ? 'Salvando...' : 'Salvar'}
                    onClick={handleSave}
                    disabled={isSaving}
                    ariaLabel="Salvar"
                    isExpanded={expandedButton === 'salvar'}
                    onExpandedChange={(expanded) => setExpandedButton(expanded ? 'salvar' : null)}
                />
            </>
        ) : showDashboardActions ? (
            <>
                {onOpenCreateModal && (
                    <ExpansibleButton
                        icon={<Plus className="h-[18px] w-[18px] flex-shrink-0" aria-hidden />}
                        label="Novo"
                        onClick={onOpenCreateModal}
                        ariaLabel="Criar novo projeto"
                        isExpanded={expandedButton === 'novo'}
                        onExpandedChange={(expanded) => setExpandedButton(expanded ? 'novo' : null)}
                        className="bg-primary text-primary-content hover:bg-primary/90"
                    />
                )}
                <ExpansibleButton
                    icon={
                        isSyncingSupabase ? (
                            <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin text-primary" aria-hidden />
                        ) : (
                            supabaseBoltIcon
                        )
                    }
                    label={isSyncingSupabase ? 'Sincronizando...' : 'Sync'}
                    onClick={handleSyncSupabase}
                    disabled={isSyncingSupabase || !isSupabaseAvailable()}
                    ariaLabel="Sincronizar projetos do Supabase"
                    title={!isSupabaseAvailable() ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.' : undefined}
                    isExpanded={expandedButton === 'sync'}
                    onExpandedChange={(expanded) => setExpandedButton(expanded ? 'sync' : null)}
                />
            </>
        ) : undefined;

    return (
        <header
            ref={headerRef}
            className="relative sticky top-0 z-50 border-b border-base-200/50 bg-base-100/70 backdrop-blur-md transition-all duration-200"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="container mx-auto min-w-0 px-3 py-2 sm:px-4">
                <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
                    {onLogoClick ? (
                        <button
                            type="button"
                            onClick={onLogoClick}
                            className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-transparent p-1 text-left transition-all duration-200 hover:border-base-300/60 hover:bg-base-200/40 sm:min-h-0 sm:gap-3 sm:p-0"
                            aria-label="Voltar para Meus Projetos"
                        >
                            <ChevronLeft className="h-5 w-5 shrink-0 text-base-content/70" aria-hidden />
                            {logoContent}
                        </button>
                    ) : (
                        <div className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 sm:min-h-0 sm:gap-3">{logoContent}</div>
                    )}

                    <div className="relative flex shrink-0 items-center gap-2">
                        <div className="relative hidden md:block">
                            <ExpandableTabs
                                className="flex flex-wrap items-center gap-2"
                                tabs={tabs}
                                activeColor={activeColor}
                                onChange={handleTabChange}
                                onOutsideClick={() => setExpandedButton(null)}
                                leadingContent={
                                    leadingContent ? (
                                        <div className="flex flex-wrap items-center gap-2">{leadingContent}</div>
                                    ) : undefined
                                }
                            />

                            {notificationUnreadCount > 0 && (
                                <span className="pointer-events-none absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[0.65rem] text-error-content shadow-sm">
                                    {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                </span>
                            )}
                        </div>

                        <div className="relative md:hidden">
                            <button
                                ref={mobileMenuButtonRef}
                                type="button"
                                className="win-icon-button"
                                aria-expanded={mobileMenuOpen}
                                aria-controls="header-mobile-menu"
                                aria-haspopup="menu"
                                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
                                onClick={() => setMobileMenuOpen((o) => !o)}
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                            </button>

                            {mobileMenuOpen && (
                                <>
                                    <button
                                        type="button"
                                        className="fixed inset-0 z-40 bg-base-content/30 backdrop-blur-sm md:hidden"
                                        aria-label="Fechar menu"
                                        onClick={closeMobileMenu}
                                    />
                                    <div
                                        ref={mobileMenuPanelRef}
                                        id="header-mobile-menu"
                                        role="menu"
                                        aria-label="Menu de navegação"
                                        className="absolute right-0 top-full z-50 mt-1 flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),20rem)] flex-col overflow-y-auto rounded-box border border-base-300 bg-base-100/95 p-2 shadow-xl backdrop-blur-md"
                                    >
                                        <div className="mb-1 flex items-center justify-between gap-2 border-b border-base-200/80 px-1 pb-2">
                                            <span className="font-heading text-xs font-semibold uppercase tracking-wide text-base-content/70">
                                                Menu
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-circle btn-xs min-h-8 min-w-8"
                                                aria-label="Fechar menu"
                                                onClick={closeMobileMenu}
                                            >
                                                <X className="h-4 w-4" aria-hidden />
                                            </button>
                                        </div>

                                        <nav className="flex flex-col gap-0.5 font-body" aria-label="Navegação principal">
                                            {onLogoClick && (
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-base-content transition-colors hover:bg-base-200/80"
                                                    onClick={() => {
                                                        onLogoClick();
                                                        closeMobileMenu();
                                                    }}
                                                >
                                                    <LayoutGrid className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                                                    Meus projetos
                                                </button>
                                            )}

                                            {selectedProject && leadingContent && (
                                                <div className="my-1 flex flex-wrap items-center gap-2 border-y border-base-200/60 py-2">
                                                    {leadingContent}
                                                </div>
                                            )}

                                            {!selectedProject && showDashboardActions && leadingContent && (
                                                <div className="my-1 flex flex-wrap items-center gap-2 border-y border-base-200/60 py-2">
                                                    {leadingContent}
                                                </div>
                                            )}

                                            {tabs.map((tab) => {
                                                const Icon = tab.icon;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        role="menuitem"
                                                        className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-base-content transition-colors hover:bg-base-200/80"
                                                        onClick={() => handleTabChange(tab.id)}
                                                    >
                                                        <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                                                        {tab.title}
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showNotificationDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            setShowNotificationDropdown(false);
                        }}
                    />
                    <div className="absolute right-2 top-full z-[60] mt-2 w-[min(100vw-1rem,20rem)] sm:right-4 sm:w-80">
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

            <Modal isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} title="Glossário" size="6xl">
                <GlossaryView />
            </Modal>

            <Modal
                isOpen={showJiraProjectSelector}
                onClose={() => {
                    setShowJiraProjectSelector(false);
                    setSelectedJiraProjectKey('');
                }}
                title="Selecionar Projeto do Jira"
            >
                <div className="space-y-4">
                    <p className="text-sm text-base-content/70">Selecione o projeto do Jira para sincronizar apenas as novas tarefas:</p>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-base-content">Projeto</label>
                        <select
                            value={selectedJiraProjectKey}
                            onChange={(e) => setSelectedJiraProjectKey(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">Selecione um projeto...</option>
                            {availableJiraProjects.map((proj) => (
                                <option key={proj.key} value={proj.key}>
                                    {proj.name} ({proj.key})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowJiraProjectSelector(false);
                                setSelectedJiraProjectKey('');
                            }}
                            className="btn btn-outline btn-sm rounded-full transition-all duration-200 hover:bg-base-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmJiraProject}
                            disabled={!selectedJiraProjectKey || isSyncingJira}
                            className="btn btn-primary btn-sm rounded-full shadow-sm transition-all duration-200 active:scale-[0.98] gap-2"
                        >
                            {isSyncingJira ? (
                                <>
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                                    Sincronizando…
                                </>
                            ) : (
                                'Sincronizar'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </header>
    );
};
