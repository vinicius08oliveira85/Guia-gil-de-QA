import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  useId,
} from 'react';
import { ExpandableTabs } from './ExpandableTabs';
import { ExpansibleButton } from './ExpansibleButton';
import { useTheme } from '../../hooks/useTheme';
import {
  BookOpen,
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
import { isAnalysisOutdated } from '../../utils/analysisFreshness';
import { getGeneralIAAnalysisSnapshotHash } from '../../services/ai/generalAnalysisService';
import { AppSelect } from '../common/AppSelect';
import {
  headerNeuToolbarPillPrimaryClass,
  headerNeuToolbarPillSecondaryClass,
} from './headerNeuUi';

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
  }, [
    mobileMenuOpen,
    selectedProject?.id,
    selectedProject?.generalIAAnalysis,
    showDashboardActions,
  ]);

  const generalAnalysisOutdated = useMemo(() => {
    if (!selectedProject) return false;
    const currentHash = getGeneralIAAnalysisSnapshotHash(selectedProject);
    return isAnalysisOutdated(selectedProject.generalIAAnalysis, currentHash);
  }, [selectedProject]);

  const generalAnalysisStatusLabel = useMemo(() => {
    if (!selectedProject || !generalAnalysisOutdated) return '';
    if (!selectedProject.generalIAAnalysis) {
      return 'Análise geral com IA ainda não foi executada neste projeto';
    }
    return 'Análise geral com IA desatualizada em relação ao estado atual do projeto';
  }, [selectedProject, generalAnalysisOutdated]);

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
      return;
    }

    switch (id) {
      case 'settings':
        onOpenSettings?.();
        closeMobileMenu();
        closeUtilityMenu();
        break;
      case 'glossary':
        setIsGlossaryOpen(true);
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
    { id: 'theme', title: getThemeTitle(), icon: getThemeIcon() },
  ];

  const activeColor = 'text-[var(--project-card-accent)]';

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
      <span className="app-header-logo-plate" aria-hidden>
        <img
          src="/Logo_Moderno_Leve-removebg-preview.png"
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </span>
      <div className="min-w-0 border-l-2 border-[var(--brand-cta)] pl-2.5 sm:pl-3">
        <p
          className={cn(
            'flex items-center gap-2 text-balance text-sm font-semibold leading-tight sm:text-base',
            'app-brand-title app-element-typography'
          )}
        >
          <span>QA Agile Guide</span>
          {generalAnalysisOutdated && (
            <span
              className="app-header-analysis-dot"
              role="status"
              title={generalAnalysisStatusLabel}
              aria-label={generalAnalysisStatusLabel}
            />
          )}
        </p>
        <p
          className={cn(
            'hidden truncate text-xs text-balance lg:block',
            '[font-family:var(--font-sans)] tracking-[var(--letter-spacing)]',
            'text-[var(--leve-header-text-muted)]'
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
        neuVariant="header"
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
        neuVariant="header"
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
        'app-header-shell relative sticky top-0 z-[100] !rounded-none',
        'text-[var(--leve-header-text)]',
        'transition-[background-color,box-shadow,border-color,color] duration-300 ease-out'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <div className={cn('mx-auto w-full min-w-0 max-w-full px-3 sm:px-4')}>
        <div
          className={cn(
            'app-header-toolbar box-border flex h-[var(--app-header-h)] min-h-0 min-w-0 items-center justify-between gap-2 overflow-hidden',
            'sm:gap-2.5'
          )}
        >
          {onLogoClick ? (
            <button
              type="button"
              onClick={goToProjectsList}
              className={cn(
                'group flex h-full min-h-0 min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-[var(--radius)] p-0.5 text-left sm:gap-2.5',
                'border border-transparent bg-transparent',
                'transition-[background-color,border-color,box-shadow] duration-200 ease-out',
                'hover:border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]',
                'hover:bg-[color-mix(in_srgb,var(--leve-neu-bg)_88%,var(--leve-neu-light))]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(var(--p))]'
              )}
              aria-label="Voltar para Meus Projetos"
            >
              <span
                className={cn(
                  'pointer-events-none flex h-9 w-9 shrink-0 items-center justify-center',
                  'rounded-full border border-transparent transition-all duration-200',
                  'group-hover:border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]',
                  'group-hover:bg-[color-mix(in_srgb,var(--leve-neu-bg)_88%,var(--leve-neu-light))]'
                )}
                aria-hidden
              >
                <ChevronLeft className="h-5 w-5 text-[var(--leve-header-text-muted)] group-hover:text-[var(--leve-header-text)]" />
              </span>
              {logoContent}
            </button>
          ) : (
            <div className="flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-2.5">
              {logoContent}
            </div>
          )}

          <div className="relative flex min-w-0 max-w-[min(100%,52%)] shrink-0 items-center justify-end gap-1.5 overflow-hidden sm:max-w-[min(100%,58%)] md:gap-2">
            {showDashboardActions && (
              <div className="hidden shrink-0 items-center gap-1.5 md:flex">
                {onOpenCreateModal && (
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className={headerNeuToolbarPillPrimaryClass}
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Novo projeto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleSyncSupabase()}
                  disabled={isSyncingSupabase || !isSupabaseAvailable()}
                  className={headerNeuToolbarPillSecondaryClass}
                  title={
                    !isSupabaseAvailable()
                      ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.'
                      : undefined
                  }
                >
                  {isSyncingSupabase ? (
                    <span className="inline-flex items-center gap-1.5">
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
                neuVariant="header"
                className="shrink-0 border-l border-[color-mix(in_srgb,var(--project-card-neu-light)_22%,transparent)] pl-2"
              />
            )}
            <div className="relative hidden min-w-0 overflow-hidden md:block">
              <ExpandableTabs
                neuVariant="header"
                className="flex max-w-full flex-nowrap items-center gap-1.5"
                tabs={tabs}
                activeColor={activeColor}
                onChange={handleTabChange}
                onOutsideClick={() => setExpandedButton(null)}
                leadingContent={
                  leadingContent ? (
                    <div className="flex flex-nowrap items-center gap-1.5">{leadingContent}</div>
                  ) : undefined
                }
              />
            </div>

            <div className="relative z-[110] flex shrink-0 items-center gap-1 md:hidden">
              <details ref={utilityMenuRef} className="dropdown dropdown-end relative z-[120]">
                <summary className="win-icon-button list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden">
                  <span className="sr-only">Mais opções: configurações, glossário e tema</span>
                  <MoreVertical className="h-5 w-5" aria-hidden />
                </summary>
                <ul
                  className="dropdown-content menu menu-sm app-surface fixed right-3 z-[130] w-56 rounded-box p-2 text-[var(--leve-header-text)] shadow-xl transition-colors duration-300"
                  style={{ top: 'calc(var(--app-header-sticky-offset, 4.5rem) + 0.25rem)' }}
                >
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
                currentId={selectedProjectId == null ? 'projects' : undefined}
              />
            </div>
          </div>
        </div>
      </div>

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
            <AppSelect
              value={selectedJiraProjectKey}
              onChange={v => setSelectedJiraProjectKey(v)}
              className="select select-bordered w-full"
            >
              <option value="">Selecione um projeto...</option>
              {availableJiraProjects.map(proj => (
                <option key={proj.key} value={proj.key}>
                  {proj.name} ({proj.key})
                </option>
              ))}
            </AppSelect>
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
