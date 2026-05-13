import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  useId,
} from 'react';
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
  LayoutGrid,
  MoreVertical,
} from 'lucide-react';
import { Project } from '../../types';
import { getUnreadCount } from '../../utils/notificationService';
import { Modal } from './Modal';
import { GlossaryView } from '../glossary/GlossaryView';
import { useProjectsStore } from '../../store/projectsStore';
import { useJiraSync } from '../../hooks/useJiraSync';
import { isSupabaseAvailable } from '../../services/supabaseService';
import toast from 'react-hot-toast';
import {
  NavigationMenuDrawer,
  NavigationMenuHamburger,
  NavigationMenuRail,
} from './NavigationMenu';
import type { NavigationMenuItem } from './NavigationMenu';
import { cn } from '../../utils/cn';

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
  const [expandedButton, setExpandedButton] = useState<'jira' | 'salvar' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuDomId = useId().replace(/:/g, '');

  const saveProjectToSupabase = useProjectsStore(s => s.saveProjectToSupabase);
  const getSelectedProject = useProjectsStore(s => s.getSelectedProject);
  const syncProjectsFromSupabase = useProjectsStore(s => s.syncProjectsFromSupabase);
  const updateProject = useProjectsStore(s => s.updateProject);
  const selectProject = useProjectsStore(s => s.selectProject);
  const selectedProjectId = useProjectsStore(s => s.selectedProjectId);
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

  /** Lista principal de projetos: limpa seleção no store e reutiliza o handler do App (URL / settings). */
  const goToProjectsList = useCallback(() => {
    selectProject(null);
    onLogoClick?.();
  }, [selectProject, onLogoClick]);

  const utilityMenuRef = useRef<HTMLDetailsElement>(null);
  const closeUtilityMenu = useCallback(() => {
    if (utilityMenuRef.current) utilityMenuRef.current.open = false;
  }, []);

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
      document.documentElement.style.setProperty('--app-header-sticky-offset', `${h}px`);
    };
    setVar();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(setVar);
    });
    ro.observe(el);
    window.addEventListener('resize', setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setVar);
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
        closeUtilityMenu();
        break;
      case 'glossary':
        setIsGlossaryOpen(true);
        closeMobileMenu();
        closeUtilityMenu();
        break;
      case 'notifications':
        setShowNotificationDropdown(true);
        closeMobileMenu();
        closeUtilityMenu();
        break;
      case 'theme':
        toggleTheme();
        closeUtilityMenu();
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
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      aria-hidden
    >
      <path
        d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .724.229l9.075-12.476.401-.562a1.04 1.04 0 0 0-.838-1.66Z"
        fill="var(--chart-1)"
      />
    </svg>
  );

  const mobileDrawerItems = useMemo((): NavigationMenuItem[] => {
    if (!onLogoClick) return [];
    const items: NavigationMenuItem[] = [
      {
        id: 'projects',
        label: 'Meus projetos',
        icon: <LayoutGrid className="h-5 w-5" aria-hidden />,
        onClick: goToProjectsList,
      },
    ];
    if (showDashboardActions && onOpenCreateModal) {
      items.push({
        id: 'new-project',
        label: 'Novo projeto',
        icon: <Plus className="h-5 w-5" aria-hidden />,
        onClick: () => onOpenCreateModal(),
      });
    }
    if (showDashboardActions) {
      items.push({
        id: 'sync-supabase',
        label: isSyncingSupabase ? 'Sincronizando…' : 'Sincronizar com a nuvem',
        icon: supabaseBoltIcon,
        onClick: () => {
          void handleSyncSupabase();
        },
      });
    }
    return items;
  }, [
    onLogoClick,
    goToProjectsList,
    showDashboardActions,
    onOpenCreateModal,
    isSyncingSupabase,
    handleSyncSupabase,
  ]);

  const mainNavRailItems = useMemo((): NavigationMenuItem[] => {
    if (!onLogoClick) return [];
    return [
      {
        id: 'projects',
        label: 'Projetos',
        icon: <LayoutGrid className="h-4 w-4" aria-hidden />,
        onClick: goToProjectsList,
      },
    ];
  }, [onLogoClick, goToProjectsList]);

  const logoContent = (
    <>
      <img
        src="/Logo_Moderno_Leve-removebg-preview.png"
        alt=""
        aria-hidden="true"
        className="h-8 w-auto shrink-0 sm:h-9"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="min-w-0 border-l-2 border-[oklch(var(--p))] pl-2.5 sm:pl-3">
        <p
          className={cn(
            'text-balance text-sm font-semibold leading-tight sm:text-base',
            '[font-family:var(--font-sans)] tracking-[var(--letter-spacing)] text-[var(--foreground)]'
          )}
        >
          QA Agile Guide
        </p>
        <p
          className={cn(
            'hidden truncate text-xs text-balance sm:block',
            '[font-family:var(--font-sans)] tracking-[var(--letter-spacing)]',
            'text-[color-mix(in_srgb,var(--foreground)_58%,transparent)]'
          )}
        >
          Gestão de QA ágil, métricas e automação
        </p>
      </div>
    </>
  );

  const leadingContent = selectedProject ? (
    <>
      <ExpansibleButton
        icon={
          isSyncingJira ? (
            <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin" aria-hidden />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
              aria-hidden
            >
              <defs>
                <linearGradient id="jiraGradientHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--chart-4)" />
                  <stop offset="100%" stopColor="var(--color-primary-deep)" />
                </linearGradient>
              </defs>
              <path
                d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z"
                fill="var(--chart-4)"
                opacity="0.2"
                transform="translate(1 1)"
              />
              <path d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z" fill="url(#jiraGradientHeader)" />
              <path
                d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z"
                fill="var(--chart-4)"
                opacity="0.2"
                transform="translate(1 1)"
              />
              <path d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z" fill="url(#jiraGradientHeader)" />
              <path
                d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z"
                fill="var(--chart-4)"
                opacity="0.2"
                transform="translate(1 1)"
              />
              <path d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z" fill="url(#jiraGradientHeader)" />
            </svg>
          )
        }
        label={isSyncingJira ? 'Sincronizando...' : 'Jira'}
        onClick={handleSyncJira}
        disabled={isSyncingJira}
        ariaLabel="Sincronizar com Jira"
        isExpanded={expandedButton === 'jira'}
        onExpandedChange={expanded => setExpandedButton(expanded ? 'jira' : null)}
      />
      <ExpansibleButton
        icon={
          isSaving ? (
            <Loader2
              className="h-[18px] w-[18px] flex-shrink-0 animate-spin text-primary"
              aria-hidden
            />
          ) : (
            supabaseBoltIcon
          )
        }
        label={isSaving ? 'Salvando...' : 'Salvar'}
        onClick={handleSave}
        disabled={isSaving}
        ariaLabel="Salvar"
        isExpanded={expandedButton === 'salvar'}
        onExpandedChange={expanded => setExpandedButton(expanded ? 'salvar' : null)}
      />
    </>
  ) : undefined;

  const mobileLeadingSlot =
    leadingContent && (selectedProject || (!selectedProject && showDashboardActions)) ? (
      <div className="flex flex-wrap items-center gap-2">{leadingContent}</div>
    ) : undefined;

  return (
    <header
      ref={headerRef}
      className={cn(
        'relative sticky top-0 z-[100] mica !rounded-none border-b overflow-x-visible overflow-y-visible md:overflow-y-hidden',
        'border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]',
        'bg-[color-mix(in_srgb,var(--background)_78%,transparent)]',
        'text-[var(--foreground)] shadow-lg',
        'transition-[background-color,box-shadow,border-color,color] duration-300 ease-out'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className={cn('mx-auto w-full min-w-0 max-w-full px-3 sm:px-6')}>
        <div
          className={cn(
            'box-border flex h-[var(--app-header-h)] min-h-0 min-w-0 items-center justify-between gap-2 overflow-x-visible overflow-y-visible md:overflow-y-hidden',
            'sm:gap-3'
          )}
        >
          {onLogoClick ? (
            <button
              type="button"
              onClick={goToProjectsList}
              className={cn(
                'group flex min-h-0 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[var(--radius)] p-1 text-left',
                'border border-transparent bg-transparent',
                'transition-[background-color,border-color,box-shadow] duration-200 ease-out',
                'hover:border-[color-mix(in_srgb,var(--foreground)_14%,transparent)]',
                'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(var(--p))]',
                'sm:min-h-0 sm:gap-3 sm:p-0'
              )}
              aria-label="Voltar para Meus Projetos"
            >
              <span
                className={cn(
                  'pointer-events-none flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center',
                  'rounded-full border border-transparent transition-all duration-200',
                  'group-hover:border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]',
                  'group-hover:bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)]'
                )}
                aria-hidden
              >
                <ChevronLeft className="h-5 w-5 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] group-hover:text-[var(--foreground)]" />
              </span>
              {logoContent}
            </button>
          ) : (
            <div className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 sm:min-h-0 sm:gap-3">
              {logoContent}
            </div>
          )}

          <div className="relative flex min-w-0 shrink-0 items-center gap-2 overflow-x-visible">
            {showDashboardActions && (
              <div className="hidden shrink-0 flex-col items-stretch gap-1 border-r border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pr-2 md:flex md:flex-row md:items-center md:gap-1">
                {onOpenCreateModal && (
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className={cn(
                      'btn btn-sm gap-1.5 whitespace-nowrap rounded-[var(--radius)] border-0 shadow-sm',
                      'bg-[oklch(var(--p))] text-[oklch(var(--pc))]',
                      'hover:bg-[color-mix(in_oklch,oklch(var(--p))_88%,oklch(var(--bc)))]'
                    )}
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Novo projeto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleSyncSupabase()}
                  disabled={isSyncingSupabase || !isSupabaseAvailable()}
                  className={cn(
                    'btn btn-ghost btn-sm whitespace-nowrap font-medium rounded-[var(--radius)]',
                    'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]'
                  )}
                  title={
                    !isSupabaseAvailable()
                      ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.'
                      : undefined
                  }
                >
                  {isSyncingSupabase ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                      Sincronizando…
                    </span>
                  ) : (
                    'Sincronizar'
                  )}
                </button>
              </div>
            )}
            {mainNavRailItems.length > 0 && (
              <NavigationMenuRail
                items={mainNavRailItems}
                currentId={selectedProjectId == null ? 'projects' : undefined}
                className="shrink-0 border-l border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pl-2"
              />
            )}
            <div className="relative hidden overflow-visible md:block">
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

            <div className="relative z-[110] flex shrink-0 items-center gap-1 md:hidden">
              <details ref={utilityMenuRef} className="dropdown dropdown-end relative z-[120]">
                <summary className="win-icon-button list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden">
                  <span className="sr-only">
                    Mais opções: configurações, glossário, notificações e tema
                  </span>
                  <MoreVertical className="h-5 w-5" aria-hidden />
                </summary>
                <ul className="dropdown-content menu menu-sm z-[130] mt-2 w-56 rounded-box border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[color-mix(in_srgb,var(--background)_96%,transparent)] p-2 text-[var(--foreground)] shadow-xl backdrop-blur-md transition-colors duration-300">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <li key={tab.id}>
                        <button
                          type="button"
                          className={cn(
                            'btn btn-ghost btn-sm flex min-h-[44px] w-full items-center justify-start gap-2 rounded-[var(--radius)] border-0 text-left font-medium normal-case',
                            'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]'
                          )}
                          onClick={() => handleTabChange(tab.id)}
                        >
                          <Icon className="h-5 w-5 shrink-0 text-[oklch(var(--p))]" aria-hidden />
                          {tab.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
              <NavigationMenuHamburger
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                triggerRef={mobileMenuButtonRef}
                controlsId={mobileMenuDomId}
              />
              <NavigationMenuDrawer
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                items={mobileDrawerItems}
                panelRef={mobileMenuPanelRef}
                menuId={mobileMenuDomId}
                title="Navegação"
                leadingSlot={mobileLeadingSlot}
              />
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

      <Modal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        title="Glossário"
        size="6xl"
      >
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
          <p className="text-sm text-base-content/70">
            Selecione o projeto do Jira para sincronizar apenas as novas tarefas:
          </p>
          <div>
            <label className="mb-2 block text-sm font-medium text-base-content">Projeto</label>
            <select
              value={selectedJiraProjectKey}
              onChange={e => setSelectedJiraProjectKey(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">Selecione um projeto...</option>
              {availableJiraProjects.map(proj => (
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
              className="btn btn-ghost btn-sm rounded-[var(--radius)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmJiraProject}
              disabled={!selectedJiraProjectKey || isSyncingJira}
              className={cn(
                'btn btn-sm gap-2 rounded-[var(--radius)] border-0 shadow-sm transition-all duration-200 active:scale-[0.98]',
                'bg-[oklch(var(--p))] text-[oklch(var(--pc))]',
                'hover:bg-[color-mix(in_oklch,oklch(var(--p))_88%,oklch(var(--bc)))]'
              )}
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
