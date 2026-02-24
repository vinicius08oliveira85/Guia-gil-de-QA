import React, { useState, useEffect } from 'react';
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
  Cloud,
  Plus,
  Loader2,
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
  onNavigate,
  onOpenCreateModal,
  showDashboardActions,
  onLogoClick,
}) => {
  const { theme, toggleTheme, isOnlyLightSupported } = useTheme();
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [expandedButton, setExpandedButton] = useState<'jira' | 'salvar' | 'novo' | 'sync' | null>(
    null
  );

  const { saveProjectToSupabase, getSelectedProject, syncProjectsFromSupabase, updateProject } =
    useProjectsStore();
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
    { id: 'settings', title: 'Configurações', icon: Sliders },
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

  const handleSyncSupabase = async () => {
    if (!isSupabaseAvailable()) {
      toast.error('Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.');
      return;
    }

    setIsSyncingSupabase(true);
    try {
      await syncProjectsFromSupabase();
      toast.success('Projetos sincronizados do Supabase com sucesso!');
    } catch (error) {
      toast.error('Erro ao sincronizar projetos do Supabase.');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-3 min-w-0 py-2 px-3 sm:px-4">
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-2 sm:gap-3 min-w-0 bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Voltar para Meus Projetos"
          >
            <img
              src="/Logo_Moderno_Leve-removebg-preview.png"
              alt="Logo QA Agile Guide"
              className="h-14 w-auto sm:h-16 flex-shrink-0"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold leading-tight truncate">
                QA Agile Guide
              </p>
              <p className="text-xs text-base-content/60 truncate hidden sm:block">
                Gestão de QA ágil, métricas e automação
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/Logo_Moderno_Leve-removebg-preview.png"
              alt="Logo QA Agile Guide"
              className="h-14 w-auto sm:h-16 flex-shrink-0"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold leading-tight truncate">
                QA Agile Guide
              </p>
              <p className="text-xs text-base-content/60 truncate hidden sm:block">
                Gestão de QA ágil, métricas e automação
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 relative">
          <nav className="flex items-center gap-2"></nav>

          <div className="relative">
            <ExpandableTabs
              tabs={tabs}
              activeColor={activeColor}
              onChange={handleTabChange}
              onOutsideClick={() => setExpandedButton(null)}
              leadingContent={
                selectedProject ? (
                  <>
                    <ExpansibleButton
                      icon={
                        isSyncingJira ? (
                          <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" aria-hidden />
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
                              <linearGradient id="jiraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#2684FF" />
                                <stop offset="100%" stopColor="#0052CC" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z"
                              fill="#0052CC"
                              opacity="0.2"
                              transform="translate(1 1)"
                            />
                            <path
                              d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z"
                              fill="url(#jiraGradient)"
                            />
                            <path
                              d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z"
                              fill="#0052CC"
                              opacity="0.2"
                              transform="translate(1 1)"
                            />
                            <path
                              d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z"
                              fill="url(#jiraGradient)"
                            />
                            <path
                              d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z"
                              fill="#0052CC"
                              opacity="0.2"
                              transform="translate(1 1)"
                            />
                            <path
                              d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z"
                              fill="url(#jiraGradient)"
                            />
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
                            fill="#3ECF8E"
                          />
                        </svg>
                      }
                      label={isSaving ? 'Salvando...' : 'Salvar'}
                      onClick={handleSave}
                      disabled={isSaving}
                      ariaLabel="Salvar"
                      isExpanded={expandedButton === 'salvar'}
                      onExpandedChange={expanded => setExpandedButton(expanded ? 'salvar' : null)}
                    />
                  </>
                ) : showDashboardActions ? (
                  <>
                    {onOpenCreateModal && (
                      <ExpansibleButton
                        icon={<Plus className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />}
                        label="Novo"
                        onClick={onOpenCreateModal}
                        ariaLabel="Criar novo projeto"
                        isExpanded={expandedButton === 'novo'}
                        onExpandedChange={expanded => setExpandedButton(expanded ? 'novo' : null)}
                        className="bg-primary text-primary-content hover:bg-primary/90"
                      />
                    )}
                    <ExpansibleButton
                      icon={
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
                            fill="#3ECF8E"
                          />
                        </svg>
                      }
                      label={isSyncingSupabase ? 'Sincronizando...' : 'Sync'}
                      onClick={handleSyncSupabase}
                      disabled={isSyncingSupabase || !isSupabaseAvailable()}
                      ariaLabel="Sincronizar projetos do Supabase"
                      title={
                        !isSupabaseAvailable()
                          ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.'
                          : undefined
                      }
                      isExpanded={expandedButton === 'sync'}
                      onExpandedChange={expanded => setExpandedButton(expanded ? 'sync' : null)}
                    />
                  </>
                ) : undefined
              }
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

          {/* Modal Selecionar Projeto do Jira */}
          <Modal
            isOpen={showJiraProjectSelector}
            onClose={() => {
              setShowJiraProjectSelector(false);
              setSelectedJiraProjectKey('');
            }}
            title="Selecionar Projeto do Jira"
          >
            <div className="space-y-4">
              <p className="text-base-content/70 text-sm">
                Selecione o projeto do Jira para sincronizar apenas as novas tarefas:
              </p>
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Projeto</label>
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
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJiraProjectSelector(false);
                    setSelectedJiraProjectKey('');
                  }}
                  className="btn btn-outline btn-sm rounded-full flex items-center gap-1.5 hover:bg-base-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmJiraProject}
                  disabled={!selectedJiraProjectKey || isSyncingJira}
                  className="btn btn-primary btn-sm rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  {isSyncingJira ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
            </div>
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
