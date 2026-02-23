import React, { useMemo, useState, useCallback } from 'react';
import { Project } from '../types';
import { Modal } from './common/Modal';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { ProjectTemplateSelector } from './common/ProjectTemplateSelector';
import { TrashIcon } from './common/Icons';
import { useIsMobile } from '../hooks/useIsMobile';
import { Badge } from './common/Badge';
import { ProgressIndicator } from './common/ProgressIndicator';
import { Plus, RefreshCw } from 'lucide-react';
import { ProjectCard } from './common/ProjectCard';
import { ConsolidatedMetrics } from './common/ConsolidatedMetrics';
import { getJiraConfig, getJiraProjects, importJiraProject, JiraProject } from '../services/jiraService';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { logger } from '../utils/logger';
import { useProjectsStore } from '../store/projectsStore';
import { EmptyState } from './common/EmptyState';
import { isSupabaseAvailable } from '../services/supabaseService';

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
    onOpenSettings?: () => void;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, onOpenSettings }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showJiraImport, setShowJiraImport] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
    const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
    const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState('');
    const [isLoadingJiraProjects, setIsLoadingJiraProjects] = useState(false);
    const [isImportingJira, setIsImportingJira] = useState(false);
    const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(null);
    const [jiraConfigStatus, setJiraConfigStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown');
    // Visualização sempre em grade - removido viewMode
    // Ordenação fixa por nome - removido sortBy
    // Filtros removidos - removido selectedTags e showTagFilter
    // Esquema API removido - removido showSchemaModal
    
    const isMobile = useIsMobile();
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; project: Project | null }>({
        isOpen: false,
        project: null,
    });
    const { handleError, handleSuccess } = useErrorHandler();
    const { importProject, supabaseLoadFailed, supabaseLoadError, loadProjects, isLoading } = useProjectsStore();

    // Função para navegar para uma tarefa específica
    const handleNavigateToTask = useCallback((projectId: string, taskId: string) => {
        // Armazenar taskId no sessionStorage para ser lido pelo ProjectView
        sessionStorage.setItem('taskIdToFocus', taskId);
        // Selecionar o projeto (isso abrirá o ProjectView)
        onSelectProject(projectId);
    }, [onSelectProject]);

    // Verificar se Jira está configurado ao montar o componente
    React.useEffect(() => {
        const checkJiraConfig = async () => {
            try {
                const config = await getJiraConfig();
                setJiraConfigStatus(config ? 'configured' : 'missing');
            } catch {
                setJiraConfigStatus('missing');
            }
        };
        checkJiraConfig();
    }, []);

    // Escutar eventos para abrir modal de criação
    React.useEffect(() => {
        const handleOpenModal = () => setIsCreating(true);
        window.addEventListener('open-create-project-modal', handleOpenModal);
        return () => {
            window.removeEventListener('open-create-project-modal', handleOpenModal);
        };
    }, []);

    // Filtros por tags removidos

    const loadJiraProjects = async (useCache: boolean = true) => {
        try {
            const jiraConfig = await getJiraConfig();
            if (!jiraConfig) {
                setJiraConfigStatus('missing');
                return;
            }
            setJiraConfigStatus('configured');

            // Verificar cache primeiro (válido por 5 minutos)
            if (useCache) {
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const { projects, timestamp } = JSON.parse(cached);
                        const cacheAge = Date.now() - timestamp;
                        
                        if (Array.isArray(projects) && projects.length > 0 && cacheAge < 5 * 60 * 1000) {
                            logger.debug(`Usando projetos do cache: ${projects.length}`, 'ProjectsDashboard');
                            setJiraProjects(projects);
                            return;
                        } else if (cacheAge >= 5 * 60 * 1000) {
                            logger.debug('Cache expirado, fazendo nova requisição', 'ProjectsDashboard');
                            localStorage.removeItem(cacheKey);
                        }
                    } catch (e) {
                        logger.warn('Cache inválido, continuando com requisição', 'ProjectsDashboard', e);
                        localStorage.removeItem(cacheKey);
                    }
                }
            }

            setIsLoadingJiraProjects(true);
            logger.info('Carregando projetos do Jira', 'ProjectsDashboard', { url: jiraConfig.url, email: jiraConfig.email });
            
            const projects = await getJiraProjects(jiraConfig, useCache);
            logger.info(`Projetos recebidos do Jira: ${projects.length}`, 'ProjectsDashboard', projects);
            
            if (Array.isArray(projects) && projects.length > 0) {
                setJiraProjects(projects);
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.setItem(cacheKey, JSON.stringify({
                    projects,
                    timestamp: Date.now()
                }));
                logger.info(`${projects.length} projetos salvos no cache`, 'ProjectsDashboard');
            } else {
                logger.warn('Nenhum projeto encontrado no Jira', 'ProjectsDashboard');
                setJiraProjects([]);
                handleError(new Error('Nenhum projeto encontrado no Jira. Verifique se você tem acesso a projetos.'), 'Carregar Projetos');
            }
        } catch (error) {
            logger.error('Erro ao carregar projetos do Jira', 'ProjectsDashboard', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar projetos do Jira';
            handleError(new Error(errorMessage), 'Carregar Projetos');
            setJiraProjects([]);
        } finally {
            setIsLoadingJiraProjects(false);
        }
    };

    const handleImportJiraProject = async () => {
        if (!selectedJiraProjectKey) {
            handleError(new Error('Selecione um projeto do Jira'), 'Importar do Jira');
            return;
        }

        try {
            const jiraConfig = await getJiraConfig();
            if (!jiraConfig) {
                setJiraConfigStatus('missing');
                return;
            }
            setJiraConfigStatus('configured');

            setIsImportingJira(true);
            setImportProgress({ current: 0 });

            logger.info(`Iniciando importação do projeto ${selectedJiraProjectKey}`, 'ProjectsDashboard');

            const importedProject = await importJiraProject(
                jiraConfig,
                selectedJiraProjectKey,
                (current, total) => {
                    setImportProgress({ current, total });
                }
            );

            // Adicionar projeto ao store
            await importProject(importedProject);

            handleSuccess('Projeto importado do Jira com sucesso!');
            
            // Fechar modal e limpar estados
            setIsCreating(false);
            setShowJiraImport(false);
            setSelectedJiraProjectKey('');
            setImportProgress(null);
            
            // Selecionar o projeto importado
            onSelectProject(importedProject.id);
        } catch (error) {
            logger.error('Erro ao importar projeto do Jira', 'ProjectsDashboard', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao importar projeto do Jira';
            handleError(new Error(errorMessage), 'Importar do Jira');
        } finally {
            setIsImportingJira(false);
            setImportProgress(null);
        }
    };

    const handleCreate = async () => {
        if (newName.trim()) {
            await onCreateProject(newName.trim(), newDesc.trim(), selectedTemplate);
            setIsCreating(false);
            setNewName('');
            setNewDesc('');
            setSelectedTemplate(undefined);
        }
    };

    const handleDelete = async () => {
        if (deleteModalState.project) {
            await onDeleteProject(deleteModalState.project.id);
            setDeleteModalState({ isOpen: false, project: null });
        }
    };
    
    const openDeleteModal = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        setDeleteModalState({ isOpen: true, project });
    };


    // Projetos ordenados por nome (fixo)
    const filteredProjects = useMemo(() => {
        return [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }, [projects]);


    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-base-100 to-base-200/60">
            <div className="container mx-auto w-full max-w-7xl px-4 py-4 sm:py-6">
                {/* Header */}
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2">
                            <span className="badge badge-outline badge-sm border-primary/30 text-primary bg-primary/10">
                                Workspace
                            </span>
                            <span className="text-sm text-base-content/60 hidden sm:inline">
                                {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">
                            Meus Projetos
                        </h1>
                        <p className="text-sm text-base-content/70 max-w-2xl">
                            Crie, organize e acompanhe o QA por projeto — templates, métricas e integrações opcionais quando fizer sentido.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                        {/* Botões movidos para o Header */}
                    </div>
                </div>

                {projects.length > 0 && <ConsolidatedMetrics projects={projects} />}

            <Modal isOpen={isCreating} onClose={() => {
                setIsCreating(false);
                setSelectedTemplate(undefined);
                setShowTemplates(false);
                setShowJiraImport(false);
                setSelectedJiraProjectKey('');
                setImportProgress(null);
            }} title="Criar Novo Projeto" size="xl"
                footer={
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false);
                                setSelectedTemplate(undefined);
                                setShowTemplates(false);
                                setShowJiraImport(false);
                                setSelectedJiraProjectKey('');
                                setImportProgress(null);
                            }}
                            className="btn btn-ghost rounded-full w-full sm:w-auto"
                        >
                            Cancelar
                        </button>
                        {!showJiraImport && (
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="btn btn-primary rounded-full w-full sm:w-auto"
                                disabled={!newName.trim()}
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
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    type="button"
                                    className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl" aria-hidden="true">📋</span>
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
                                        if (jiraConfigStatus === 'configured') {
                                            await loadJiraProjects();
                                        } else {
                                            setJiraConfigStatus('missing');
                                        }
                                    }}
                                    type="button"
                                    className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/40 hover:bg-base-200/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl" aria-hidden="true">🔗</span>
                                        <div className="space-y-0.5">
                                            <p className="font-semibold">Importar do Jira</p>
                                            <p className="text-sm text-base-content/70">
                                                Importe um projeto existente do Jira com todas as tarefas e casos de teste.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="grid gap-4">
                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Nome do Projeto</span>
                                    </div>
                                    <input
                                        id="proj-name"
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder="Ex: E-commerce App"
                                    />
                                </label>

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
                            <button
                                type="button"
                                onClick={() => {
                                    setShowJiraImport(false);
                                    setSelectedJiraProjectKey('');
                                }}
                                className="btn btn-ghost btn-sm rounded-full self-start"
                            >
                                ← Voltar
                            </button>

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
                                                setIsCreating(false);
                                                setShowJiraImport(false);
                                                setSelectedJiraProjectKey('');
                                                setImportProgress(null);
                                            }}
                                        >
                                            Configurar Jira
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Seção de seleção de projeto Jira */}
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
                                            <RefreshCw className={`h-3 w-3 ${isLoadingJiraProjects ? 'animate-spin' : ''}`} aria-hidden="true" />
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
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" aria-label="Carregando projetos do Jira"></div>
                                        </div>
                                    ) : jiraProjects.length > 0 ? (
                                        <>
                                            <select
                                                value={selectedJiraProjectKey}
                                                onChange={(e) => setSelectedJiraProjectKey(e.target.value)}
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
                                                {isImportingJira ? (
                                                    <>
                                                        {importProgress ? (
                                                            importProgress.total ? (
                                                                <>Importando... {importProgress.current} de {importProgress.total}</>
                                                            ) : (
                                                                <>Importando... {importProgress.current} tarefas</>
                                                            )
                                                        ) : (
                                                            <>Importando... Isso pode levar alguns minutos para projetos grandes</>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>Importar Projeto</>
                                                )}
                                            </button>
                                            {isImportingJira && importProgress && (
                                                <div className="w-full bg-base-200 rounded-full h-2.5" aria-label="Progresso de importação">
                                                    <div 
                                                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                                        style={{ 
                                                            width: importProgress.total 
                                                                ? `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%` 
                                                                : '50%'
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
                            <button
                                type="button"
                                onClick={() => setShowTemplates(false)}
                                className="btn btn-ghost btn-sm rounded-full self-start"
                            >
                                ← Voltar
                            </button>
                            <ProjectTemplateSelector
                                onSelectTemplate={(templateId) => {
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
            
             <ConfirmDialog
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, project: null })}
                onConfirm={handleDelete}
                title={`Excluir "${deleteModalState.project?.name}"`}
                message="Você tem certeza que deseja excluir este projeto? Todos os dados associados (tarefas, documentos, análises) serão perdidos permanentemente. Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
                variant="danger"
            />

            <div className="mt-8">
                {filteredProjects.length > 0 ? (
                    <div className="space-y-4">
                        {filteredProjects.map((p) => (
                            <ProjectCard
                                key={p.id}
                                project={p}
                                onSelect={() => onSelectProject(p.id)}
                                onDelete={() => setDeleteModalState({ isOpen: true, project: p })}
                                onTaskClick={(taskId) => handleNavigateToTask(p.id, taskId)}
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        {supabaseLoadFailed && (
                            <div className="mb-4 p-3 rounded-lg bg-warning/10 text-warning-content border border-warning/30 text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" role="alert">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span>Sincronização com a nuvem indisponível no momento. Se você já tinha projetos, tente novamente ou verifique a conexão.</span>
                                    {supabaseLoadError && (
                                        <span className="text-xs opacity-90 break-words">{supabaseLoadError}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => loadProjects()}
                                    disabled={isLoading}
                                    className="shrink-0 px-3 py-1.5 rounded-md bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning-content text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Carregando…' : 'Tentar novamente'}
                                </button>
                            </div>
                        )}
                        <EmptyState
                            icon="🚀"
                            title="Nenhum projeto ainda"
                            description="Crie um projeto para organizar tarefas, testes, documentos e métricas em um fluxo único."
                            action={{
                                label: "Criar Primeiro Projeto",
                                onClick: () => setIsCreating(true),
                                variant: 'primary'
                            }}
                            tip="Você pode criar um projeto do zero, usar um template ou importar do Jira se estiver configurado."
                        />
                    </>
                )}
            </div>
            </div>
        </div>
    );
};