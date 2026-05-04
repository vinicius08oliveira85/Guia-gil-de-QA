import React, { useState, useCallback, useEffect } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
import { Card } from './common/Card';
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
        size="xl"
        ariaDescribedBy={!showTemplates && !showJiraImport ? 'create-project-desc' : undefined}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost rounded-full w-full sm:w-auto"
            >
              Cancelar
            </button>
            {!showJiraImport && (
              <button
                type="button"
                onClick={handleCreate}
                className="btn btn-primary rounded-full w-full sm:w-auto"
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
              <p id="create-project-desc" className="text-sm text-base-content/70">
                Crie um projeto do zero, use um template ou importe do Jira ou de um arquivo.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowTemplates(true)}
                  type="button"
                  className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      📋
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold">Usar Template</p>
                      <p className="text-sm text-base-content/70">
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
                  className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🔗
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold">Importar do Jira</p>
                      <p className="text-sm text-base-content/70">
                        Importe um projeto existente do Jira com todas as tarefas e casos de teste.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShowFileImportModal(true)}
                  type="button"
                  className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      📁
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold">Importar de arquivo</p>
                      <p className="text-sm text-base-content/70">
                        Importe um projeto a partir de um arquivo JSON exportado anteriormente.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <div className="grid gap-4">
                <Input
                  id="proj-name"
                  label="Nome do Projeto *"
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: E-commerce App"
                  maxLength={100}
                  error={
                    newName.length > 100 ? 'O nome deve ter no máximo 100 caracteres' : undefined
                  }
                  helperText={newName.length > 80 ? `${newName.length}/100 caracteres` : undefined}
                />
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Descrição</span>
                  </div>
                  <textarea
                    id="proj-desc"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    className="textarea textarea-bordered w-full"
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
                      className="btn btn-primary rounded-full w-full sm:w-auto"
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
              <Card className="p-4 sm:p-6" hoverable={false}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="block text-sm font-medium text-base-content">
                      Selecione o projeto para importar:
                    </label>
                    <button
                      onClick={() => loadJiraProjects(false)}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto disabled:opacity-60"
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
                      <select
                        value={selectedJiraProjectKey}
                        onChange={e => setSelectedJiraProjectKey(e.target.value)}
                        className="select select-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                      >
                        <option value="">Selecione um projeto...</option>
                        {jiraProjects.map(project => (
                          <option key={project.key} value={project.key}>
                            {project.key} - {project.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleImportJiraProject}
                        disabled={!selectedJiraProjectKey || isImportingJira}
                        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isImportingJira
                          ? importProgress?.total
                            ? `Importando... ${importProgress.current} de ${importProgress.total}`
                            : `Importando... ${importProgress?.current ?? ''} tarefas`
                          : 'Importar Projeto'}
                      </button>
                      {isImportingJira && importProgress && (
                        <div
                          className="w-full bg-base-200 rounded-full h-2.5"
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
              </Card>
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
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Nome do Projeto</span>
                  </div>
                  <input
                    id="proj-name-template"
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </label>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Descrição</span>
                  </div>
                  <textarea
                    id="proj-desc-template"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    className="textarea textarea-bordered w-full"
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
