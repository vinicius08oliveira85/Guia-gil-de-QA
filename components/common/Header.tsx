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
import { Plus, ChevronLeft, LayoutGrid } from 'lucide-react';
import { Project } from '../../types';
import { useProjectsStore } from '../../store/projectsStore';
import {
  NavigationMenuDrawer,
  NavigationMenuHamburger,
} from './NavigationMenu';
import type { NavigationMenuItem } from './NavigationMenu';
import { cn } from '../../utils/cn';
import { isAnalysisOutdated } from '../../utils/analysisFreshness';
import { getGeneralIAAnalysisSnapshotHash } from '../../services/ai/generalAnalysisService';
import { headerNeuNavPillClass, headerNeuToolbarPillPrimaryClass } from './headerNeuUi';
import { APP_BRAND } from '../landing/landingSections';
import { resolveHeaderBackNavigation } from '../../utils/headerBackNavigation';
import { normalizeProjectWorkflow } from '../../utils/projectWorkflow';

interface HeaderProps {
  onProjectImported?: (project: Project) => void;
  onNavigate?: (view: string) => void;
  onOpenCreateModal?: () => void;
  showDashboardActions?: boolean;
  onLogoClick?: () => void;
  brandTitle?: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuDomId = useId().replace(/:/g, '');

  const getSelectedProject = useProjectsStore(s => s.getSelectedProject);
  const selectProject = useProjectsStore(s => s.selectProject);
  const selectedProjectId = useProjectsStore(s => s.selectedProjectId);
  const selectedProject = getSelectedProject();
  const location = useLocation();
  const navigate = useNavigate();

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

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
  }, [mobileMenuOpen, selectedProject?.id, selectedProject?.generalIAAnalysis, showDashboardActions]);

  const generalAnalysisOutdated = useMemo(() => {
    if (!selectedProject) return false;
    const currentHash = getGeneralIAAnalysisSnapshotHash(selectedProject);
    return isAnalysisOutdated(selectedProject.generalIAAnalysis, currentHash);
  }, [selectedProject]);

  const generalAnalysisStatusLabel = useMemo(() => {
    if (!selectedProject) return '';
    if (normalizeProjectWorkflow(selectedProject.workflow) === 'dev') {
      if ((selectedProject.devProjectFullAnalyses?.length ?? 0) === 0) {
        return 'Assistência Dev com IA ainda não foi executada neste projeto';
      }
      return '';
    }
    if (!generalAnalysisOutdated) return '';
    if (!selectedProject.generalIAAnalysis) {
      return 'Análise geral com IA ainda não foi executada neste projeto';
    }
    return 'Análise geral com IA desatualizada em relação ao estado atual do projeto';
  }, [selectedProject, generalAnalysisOutdated]);

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
    return items;
  }, [onLogoClick, goToProjectsList, showDashboardActions, onOpenCreateModal]);

  const selectedProjectWorkflow = selectedProject
    ? normalizeProjectWorkflow(selectedProject.workflow)
    : undefined;

  const handleHeaderBack = useCallback(() => {
    const back = resolveHeaderBackNavigation(location.pathname, {
      projectWorkflow: selectedProjectWorkflow,
    });
    if (!back) return;
    if (back.targetPath.startsWith('/projects/')) {
      selectProject(null);
    }
    navigate(back.targetPath);
  }, [location.pathname, navigate, selectProject, selectedProjectWorkflow]);

  const headerBackNavItem = useMemo((): NavigationMenuItem | null => {
    if (!onLogoClick) return null;
    const back = resolveHeaderBackNavigation(location.pathname, {
      projectWorkflow: selectedProjectWorkflow,
    });
    if (!back) return null;
    return {
      id: 'header-back',
      label: back.label,
      ariaLabel: back.ariaLabel,
      icon: <ChevronLeft className="h-4 w-4" aria-hidden />,
      onClick: handleHeaderBack,
    };
  }, [onLogoClick, location.pathname, handleHeaderBack, selectedProjectWorkflow]);

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
            'text-base-content/72'
          )}
        >
          {resolvedBrandSubtitle}
        </p>
      </div>
    </>
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        'app-header-shell relative sticky top-0 z-[100] !rounded-none',
        'text-base-content',
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
          <div className="flex h-full min-h-0 min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-2">
            {headerBackNavItem ? (
              <button
                type="button"
                onClick={handleHeaderBack}
                className={cn(headerNeuNavPillClass, 'shrink-0')}
                aria-label={headerBackNavItem.ariaLabel}
              >
                {headerBackNavItem.icon ? (
                  <span className="mr-1 inline-flex shrink-0">{headerBackNavItem.icon}</span>
                ) : null}
                {headerBackNavItem.label}
              </button>
            ) : null}

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
                aria-label="Ir para a página inicial"
              >
                {logoContent}
              </button>
            ) : (
              <div className="flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-2.5">
                {logoContent}
              </div>
            )}
          </div>

          <div className="app-header-actions relative flex min-w-0 max-w-[min(100%,52%)] shrink-0 items-center justify-end gap-1.5 overflow-hidden max-md:max-w-[min(100%,72%)] sm:max-w-[min(100%,58%)] md:gap-2">
            <div className="flex min-w-0 items-center justify-end gap-1.5 overflow-hidden md:gap-2">
              {showDashboardActions && onOpenCreateModal ? (
                <div className="hidden shrink-0 items-center gap-1.5 md:flex">
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className={headerNeuToolbarPillPrimaryClass}
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Novo projeto
                  </button>
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
                  currentId={selectedProjectId == null ? 'projects' : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
