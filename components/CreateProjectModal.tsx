import React, { useState, useCallback, useEffect } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
import { Input } from './common/Input';
import { ProjectTemplateSelector } from './common/ProjectTemplateSelector';
import { FileImportModal } from './common/FileImportModal';
import {
  getJiraConfig,
  getJiraProjects,
  importJiraProject,
  JiraProject,
} from '../services/jiraService';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useProjectsStore } from '../store/projectsStore';
import { logger } from '../utils/logger';
import { RefreshCw } from 'lucide-react';
import { BackButton } from './common/BackButton';
import { cn } from '../utils/cn';
import { neuTrackClass } from './common/neuUi';
import { AppSelect } from './common/AppSelect';
import {
  createProjectCancelBtnClass,
  createProjectFieldLabelClass,
  createProjectFormSelectClass,
  createProjectInsetPanelClass,
  createProjectInputClass,
  createProjectModalBodyClass,
  createProjectModalDescClass,
  createProjectModalFooterClass,
  createProjectModalShellClass,
  createProjectModalTitleClass,
  createProjectOptionCardClass,
  createProjectOptionDescClass,
  createProjectOptionTitleClass,
  createProjectPrimaryBtnClass,
  createProjectSectionLabelClass,
  createProjectTextareaClass,
} from './createProject/createProjectModalNeuUi';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
  onOpenSettings?: () => void;
  onProjectImported?: (project: Project) => void;
  /** Sinaliza criação em andamento (ex.: botão “Novo Projeto” no dashboard). */
  onCreateBusyChange?: (busy: boolean) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  onOpenSettings,
  onProjectImported,
  onCreateBusyChange,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showJiraImport, setShowJiraImport] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState('');
  const [isLoadingJiraProjects, setIsLoadingJiraProjects] = useState(false);
  const [isImportingJira, setIsImportingJira] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(
    null
  );
  const [jiraConfigStatus, setJiraConfigStatus] = useState<'unknown' | 'configured' | 'missing'>(
    'unknown'
  );
  const [showFileImportModal, setShowFileImportModal] = useState(false);

  const { handleError, handleSuccess } = useErrorHandler();
  const { importProject } = useProjectsStore();

  const handleClose = useCallback(() => {
    setShowTemplates(false);
    setShowJiraImport(false);
    setNewName('');
    setNewDesc('');
    setSelectedTemplate(undefined);
    setSelectedJiraProjectKey('');
    setImportProgress(null);
    setShowFileImportModal(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const checkJiraConfig = async () => {
      try {
        const config = await getJiraConfig();
        setJiraConfigStatus(config ? 'configured' : 'missing');
      } catch {
        setJiraConfigStatus('missing');
      }
    };
    checkJiraConfig();
  }, [isOpen]);

  const loadJiraProjects = useCallback(
    async (useCache: boolean = true) => {
      try {
        const jiraConfig = await getJiraConfig();
        if (!jiraConfig) {
          setJiraConfigStatus('missing');
          return;
        }
        setJiraConfigStatus('configured');
        if (useCache) {
          const cacheKey = `jira_projects_${jiraConfig.url}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const { projects, timestamp } = JSON.parse(cached);
              const cacheAge = Date.now() - timestamp;
              if (Array.isArray(projects) && projects.length > 0 && cacheAge < 5 * 60 * 1000) {
                setJiraProjects(projects);
                return;
              }
              if (cacheAge >= 5 * 60 * 1000) localStorage.removeItem(cacheKey);
            } catch {
              localStorage.removeItem(cacheKey);
            }
          }
        }
        setIsLoadingJiraProjects(true);
        const projects = await getJiraProjects(jiraConfig, useCache);
        if (Array.isArray(projects) && projects.length > 0) {
          setJiraProjects(projects);
          const cacheKey = `jira_projects_${jiraConfig.url}`;
          localStorage.setItem(cacheKey, JSON.stringify({ projects, timestamp: Date.now() }));
        } else {
          setJiraProjects([]);
          handleError(
            new Error(
              'Nenhum projeto encontrado no Jira. Verifique se você tem acesso a projetos.'
            ),
            'Carregar Projetos'
          );
        }
      } catch (error) {
        logger.error('Erro ao carregar projetos do Jira', 'CreateProjectModal', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido ao carregar projetos do Jira';
        handleError(new Error(errorMessage), 'Carregar Projetos');
        setJiraProjects([]);
      } finally {
        setIsLoadingJiraProjects(false);
      }
    },
    [handleError]
  );

  const handleImportJiraProject = useCallback(async () => {
    if (!selectedJiraProjectKey) {
      handleError(new Error('Selecione um projeto do Jira'), 'Importar do Jira');
      return;
    }
    try {
      const jiraConfig = await getJiraConfig();
      if (!jiraConfig) return;
      setIsImportingJira(true);
      setImportProgress({ current: 0 });
      const importedProject = await importJiraProject(
        jiraConfig,
        selectedJiraProjectKey,
        (current, total) => {
          setImportProgress({ current, total });
        }
      );
      await importProject(importedProject);
      handleSuccess('Projeto importado do Jira com sucesso!');
      handleClose();
      onProjectImported?.(importedProject);
    } catch (error) {
      logger.error('Erro ao importar projeto do Jira', 'CreateProjectModal', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido ao importar projeto do Jira';
      handleError(new Error(errorMessage), 'Importar do Jira');
    } finally {
      setIsImportingJira(false);
      setImportProgress(null);
    }
  }, [
    selectedJiraProjectKey,
    importProject,
    handleClose,
    onProjectImported,
    handleError,
    handleSuccess,
  ]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    onCreateBusyChange?.(true);
    try {
      await onCreateProject(newName.trim(), newDesc.trim(), selectedTemplate);
      handleClose();
    } finally {
      onCreateBusyChange?.(false);
    }
  }, [newName, newDesc, selectedTemplate, onCreateProject, handleClose, onCreateBusyChange]);

  const handleImportFromFile = useCallback(
    async (project: Project) => {
      await importProject(project);
      handleSuccess('Projeto importado com sucesso!');
      handleClose();
      onProjectImported?.(project);
    },
    [importProject, handleSuccess, handleClose, onProjectImported]
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Criar Novo Projeto"
        size="2xl"
        panelClassName={createProjectModalShellClass}
        bodyClassName={createProjectModalBodyClass}
        titleClassName={createProjectModalTitleClass}
        ariaDescribedBy={!showTemplates && !showJiraImport ? 'create-project-desc' : undefined}
        footer={
          <div
            className={cn(
              'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
              createProjectModalFooterClass
            )}
          >
            <button type="button" onClick={handleClose} className={createProjectCancelBtnClass}>
              Cancelar
            </button>
            {!showJiraImport && (
              <button
                type="button"
                onClick={handleCreate}
                className={createProjectPrimaryBtnClass}
                disabled={!newName.trim() || newName.length > 100}
              >
                {showTemplates ? 'Criar com Template' : 'Criar'}
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {!showTemplates && !showJiraImport ? (
            <>
              <p id="create-project-desc" className={createProjectModalDescClass}>
                Crie um projeto do zero, use um template ou importe do Jira ou de um arquivo.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowTemplates(true)}
                  type="button"
                  className={createProjectOptionCardClass}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      📋
                    </span>
                    <div className="space-y-0.5">
                      <p className={createProjectOptionTitleClass}>Usar Template</p>
                      <p className={createProjectOptionDescClass}>
                        Recomendado para começar mais rápido com um checklist inicial.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    setShowJiraImport(true);
                    if (jiraConfigStatus === 'configured') await loadJiraProjects();
                    else setJiraConfigStatus('missing');
                  }}
                  type="button"
                  className={createProjectOptionCardClass}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🔗
                    </span>
                    <div className="space-y-0.5">
                      <p className={createProjectOptionTitleClass}>Importar do Jira</p>
                      <p className={createProjectOptionDescClass}>
                        Importe um projeto existente do Jira com todas as tarefas e casos de teste.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShowFileImportModal(true)}
                  type="button"
                  className={createProjectOptionCardClass}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      📁
                    </span>
                    <div className="space-y-0.5">
                      <p className={createProjectOptionTitleClass}>Importar de arquivo</p>
                      <p className={createProjectOptionDescClass}>
                        Importe um projeto a partir de um arquivo JSON exportado anteriormente.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <div className="grid gap-4">
                <Input
                  id="proj-name"
                  label={<span className={createProjectFieldLabelClass}>Nome do Projeto *</span>}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: E-commerce App"
                  className={createProjectInputClass}
                  maxLength={100}
                  error={
                    newName.length > 100 ? 'O nome deve ter no máximo 100 caracteres' : undefined
                  }
                  helperText={newName.length > 80 ? `${newName.length}/100 caracteres` : undefined}
                />
                <label className="form-control w-full">
                  <div className="label py-0 pb-1.5">
                    <span className={createProjectFieldLabelClass}>Descrição</span>
                  </div>
                  <textarea
                    id="proj-desc"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    className={createProjectTextareaClass}
                    placeholder="Breve descrição do projeto..."
                  />
                </label>
              </div>
            </>
          ) : showJiraImport ? (
            <div className="space-y-4">
              <BackButton
                className="self-start"
                onClick={() => {
                  setShowJiraImport(false);
                  setSelectedJiraProjectKey('');
                }}
                aria-label="Voltar"
              />
              {jiraConfigStatus === 'missing' && (
                <div className="alert alert-warning">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                    <div className="min-w-0">
                      <p className="font-medium">Necessário a configuração do Jira</p>
                      <p className="text-sm opacity-80">
                        Configure a integração para listar e importar projetos.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={createProjectPrimaryBtnClass}
                      onClick={() => {
                        onOpenSettings?.();
                        handleClose();
                      }}
                    >
                      Configurar Jira
                    </button>
                  </div>
                </div>
              )}
              <div className={createProjectInsetPanelClass}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className={createProjectSectionLabelClass}>
                      Selecione o projeto para importar:
                    </label>
                    <button
                      onClick={() => loadJiraProjects(false)}
                      className="inline-flex items-center gap-1 self-start text-xs font-semibold text-[var(--workspace-panel-accent)] hover:text-[var(--workspace-panel-text)] hover:underline sm:self-auto disabled:opacity-60"
                      title="Atualizar lista de projetos"
                      disabled={isLoadingJiraProjects || jiraConfigStatus !== 'configured'}
                      aria-label="Atualizar lista de projetos do Jira"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isLoadingJiraProjects ? 'animate-spin' : ''}`}
                        aria-hidden
                      />
                      Atualizar
                    </button>
                  </div>
                  {jiraConfigStatus !== 'configured' ? (
                    <div className="text-center py-8">
                      <p className="text-base-content/70 text-sm">
                        Configure o Jira para visualizar a lista de projetos.
                      </p>
                    </div>
                  ) : isLoadingJiraProjects ? (
                    <div className="flex justify-center py-8">
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"
                        aria-label="Carregando projetos do Jira"
                      />
                    </div>
                  ) : jiraProjects.length > 0 ? (
                    <>
                      <AppSelect
                        value={selectedJiraProjectKey}
                        onChange={v => setSelectedJiraProjectKey(v)}
                        className={createProjectFormSelectClass}
                      >
                        <option value="">Selecione um projeto...</option>
                        {jiraProjects.map(project => (
                          <option key={project.key} value={project.key}>
                            {project.key} - {project.name}
                          </option>
                        ))}
                      </AppSelect>
                      <button
                        onClick={handleImportJiraProject}
                        disabled={!selectedJiraProjectKey || isImportingJira}
                        className={cn(createProjectPrimaryBtnClass, 'w-full')}
                      >
                        {isImportingJira
                          ? importProgress?.total
                            ? `Importando... ${importProgress.current} de ${importProgress.total}`
                            : `Importando... ${importProgress?.current ?? ''} tarefas`
                          : 'Importar Projeto'}
                      </button>
                      {isImportingJira && importProgress && (
                        <div
                          className={cn(neuTrackClass, 'h-2.5 w-full')}
                          aria-label="Progresso de importação"
                        >
                          <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-300"
                            style={{
                              width: importProgress.total
                                ? `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%`
                                : '50%',
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-base-content/70 text-sm">
                        Nenhum projeto encontrado. Verifique suas permissões no Jira.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <BackButton
                className="self-start"
                onClick={() => setShowTemplates(false)}
                aria-label="Voltar"
              />
              <ProjectTemplateSelector
                onSelectTemplate={templateId => {
                  setSelectedTemplate(templateId);
                  setShowTemplates(false);
                }}
                onClose={() => setShowTemplates(false)}
              />
              {selectedTemplate && (
                <div className="alert alert-success">
                  <span>Template selecionado! Preencha os dados abaixo.</span>
                </div>
              )}
              <div className="grid gap-4">
                <Input
                  id="proj-name-template"
                  label={<span className={createProjectFieldLabelClass}>Nome do Projeto</span>}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className={createProjectInputClass}
                  maxLength={100}
                />
                <label className="form-control w-full">
                  <div className="label py-0 pb-1.5">
                    <span className={createProjectFieldLabelClass}>Descrição</span>
                  </div>
                  <textarea
                    id="proj-desc-template"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    className={createProjectTextareaClass}
                    placeholder="Breve descrição do projeto..."
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <FileImportModal
        isOpen={showFileImportModal}
        onClose={() => setShowFileImportModal(false)}
        importType="project"
        onImportProject={handleImportFromFile}
      />
    </>
  );
};
