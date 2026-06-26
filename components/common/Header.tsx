import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  useId,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExpansibleButton } from './ExpansibleButton';
import { JiraBrandIcon } from './JiraBrandIcon';
import {
  Plus,
  Loader2,
  ChevronLeft,
  LayoutGrid,
} from 'lucide-react';
import { Project } from '../../types';
import { Modal } from './Modal';
import { useProjectsStore } from '../../store/projectsStore';
import { useTaskTrackingHeaderStore } from '../../store/taskTrackingHeaderStore';
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
import { APP_BRAND } from '../landing/landingSections';
import { resolveHeaderBackNavigation } from '../../utils/headerBackNavigation';

interface HeaderProps {
  onProjectImported?: (project: Project) => void;
  onNavigate?: (view: string) => void;
  onOpenCreateModal?: () => void;
  showDashboardActions?: boolean;
  onLogoClick?: () => void;
  /** Título exibido ao lado da logo (padrão: QA Agile Guide). */
  brandTitle?: string;
  /** Subtítulo exibido abaixo do título (padrão: tagline do app). */
  brandSubtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onProjectImported: _onProjectImported,
  onNavigate: _onNavigate,
  onOpenCreateModal,
  showDashboardActions,
  onLogoClick,
  brandTitle,
  brandSubtitle,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
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
  const taskTrackingJiraAction = useTaskTrackingHeaderStore(s => s.jiraAction);
  const location = useLocation();
  const navigate = useNavigate();
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

  /** Volta para a tela anterior conforme a rota atual (Menu ou Projetos). */
  const handleHeaderBack = useCallback(() => {
    const back = resolveHeaderBackNavigation(location.pathname);
    if (!back) return;
    if (back.targetPath === '/projects') {
      selectProject(null);
    }
    navigate(back.targetPath);
  }, [location.pathname, navigate, selectProject]);

  const headerBackNavItem = useMemo((): NavigationMenuItem | null => {
    if (!onLogoClick) return null;
    const back = resolveHeaderBackNavigation(location.pathname);
    if (!back) return null;
    return {
      id: 'header-back',
      label: back.label,
      ariaLabel: back.ariaLabel,
      icon: <ChevronLeft className="h-4 w-4" aria-hidden />,
      onClick: handleHeaderBack,
    };
  }, [onLogoClick, location.pathname, handleHeaderBack]);

  const resolvedBrandTitle = brandTitle ?? APP_BRAND.title;
  const resolvedBrandSubtitle = brandSubtitle ?? APP_BRAND.subtitle;

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
          <span>{resolvedBrandTitle}</span>
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
          {resolvedBrandSubtitle}
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
        isExpanded={false}
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
        isExpanded={false}
      />
    </>
  ) : undefined;

  /** Botão Jira da tela Acompanhamento de Tarefas — registrado pelo painel de Filas. */
  const taskTrackingJiraButton = taskTrackingJiraAction ? (
    <ExpansibleButton
      neuVariant="header"
      icon={
        taskTrackingJiraAction.isSyncing ? (
          <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin" aria-hidden />
        ) : (
          <JiraBrandIcon className="h-[18px] w-[18px] flex-shrink-0" />
        )
      }
      label={taskTrackingJiraAction.isSyncing ? 'Atualizando…' : 'Jira'}
      onClick={taskTrackingJiraAction.onSync}
      disabled={taskTrackingJiraAction.disabled}
      ariaLabel="Atualizar fila exportada do Jira"
      title={taskTrackingJiraAction.title}
      isExpanded={false}
    />
  ) : null;

  const mobileLeadingSlot = (() => {
    const showProjectLeading =
      leadingContent && (selectedProject || (!selectedProject && showDashboardActions));
    if (!showProjectLeading && !taskTrackingJiraButton) return undefined;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {showProjectLeading ? leadingContent : null}
        {taskTrackingJiraButton}
      </div>
    );
  })();

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
              aria-label={
                selectedProject
                  ? 'Voltar para Meus Projetos'
                  : showDashboardActions
                    ? 'Voltar para a página inicial'
                    : 'Voltar'
              }
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

          <div className="app-header-actions relative flex min-w-0 max-w-[min(100%,52%)] shrink-0 items-center justify-end gap-1.5 overflow-hidden max-md:max-w-[min(100%,72%)] sm:max-w-[min(100%,58%)] md:gap-2">
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
            {headerBackNavItem ? (
              <NavigationMenuRail
                items={[headerBackNavItem]}
                neuVariant="header"
                className="shrink-0 border-l border-[color-mix(in_srgb,var(--project-card-neu-light)_22%,transparent)] pl-2"
              />
            ) : null}
            {leadingContent ? (
              <div className="relative hidden min-w-0 shrink-0 items-center gap-1.5 overflow-hidden md:flex">
                {leadingContent}
              </div>
            ) : null}
            {taskTrackingJiraButton ? (
              <div className="relative hidden min-w-0 shrink-0 items-center gap-1.5 overflow-hidden md:flex">
                {taskTrackingJiraButton}
              </div>
            ) : null}

            <div className="relative z-[110] flex shrink-0 items-center gap-1 md:hidden">
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
