import React, { useMemo, useState } from 'react';
import { Project, JiraTask } from '../types';
import { Modal } from './common/Modal';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { ProjectTemplateSelector } from './common/ProjectTemplateSelector';
import { TrashIcon } from './common/Icons';
import { useIsMobile } from '../hooks/useIsMobile';
import { Badge } from './common/Badge';
import { ProgressIndicator } from './common/ProgressIndicator';
import { ArrowRight, Plus, Cloud, RefreshCw } from 'lucide-react';
import { getTaskStatusCategory } from '../utils/jiraStatusCategorizer';
import { motion } from 'framer-motion';
import { ProjectActivityCard } from './common/ProjectActivityCard';
import { getJiraConfig, getJiraProjects, importJiraProject, JiraProject } from '../services/jiraService';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { logger } from '../utils/logger';
import { useProjectsStore } from '../store/projectsStore';

export const ProjectsDashboard: React.FC<{
    projects: Project[];
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string, description: string, templateId?: string) => Promise<void>;
    onDeleteProject: (id: string) => Promise<void>;
    onComparisonClick?: () => void;
    onSyncSupabase?: () => Promise<void>;
}> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, onComparisonClick, onSyncSupabase }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showJiraImport, setShowJiraImport] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
    const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
    const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState('');
    const [isLoadingJiraProjects, setIsLoadingJiraProjects] = useState(false);
    const [isImportingJira, setIsImportingJira] = useState(false);
    const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(null);
    const [isJiraConfigured, setIsJiraConfigured] = useState(false);
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
    const { importProject } = useProjectsStore();

    // Verificar se Jira está configurado ao montar o componente
    React.useEffect(() => {
        const checkJiraConfig = async () => {
            try {
                const config = await getJiraConfig();
                setIsJiraConfigured(!!config);
            } catch {
                setIsJiraConfigured(false);
            }
        };
        checkJiraConfig();
    }, []);

    // Filtros por tags removidos

    const loadJiraProjects = async (useCache: boolean = true) => {
        try {
            const jiraConfig = await getJiraConfig();
            if (!jiraConfig) {
                handleError(new Error('Jira não está configurado. Configure a conexão com Jira nas Configurações primeiro.'), 'Importar do Jira');
                return;
            }

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
                handleError(new Error('Jira não está configurado. Configure a conexão com Jira nas Configurações primeiro.'), 'Importar do Jira');
                return;
            }

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

    const handleSyncSupabase = async () => {
        if (!onSyncSupabase) return;
        setIsSyncingSupabase(true);
        try {
            await onSyncSupabase();
        } finally {
            setIsSyncingSupabase(false);
        }
    };

    const calculateProgress = (tasks: JiraTask[]) => {
        if (!tasks || tasks.length === 0) return 0;
        // Usar categoria do Jira para determinar se está concluído
        const completed = tasks.filter(t => {
            const category = getTaskStatusCategory(t);
            return category === 'Concluído';
        }).length;
        return completed;
    };

    // Projetos ordenados por nome (fixo)
    const filteredProjects = useMemo(() => {
        return [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }, [projects]);

    // Quick actions simplificadas - apenas Comparar e Sync Supabase
    const quickActions = useMemo(() => {
        const actions: Array<{ id: string; label: string; icon: string; onClick: () => void | Promise<void> }> = [];

        if (onComparisonClick && projects.length > 1) {
            actions.push({
                id: 'compare',
                label: 'Comparar Projetos',
                icon: '📊',
                onClick: onComparisonClick
            });
        }

        if (onSyncSupabase) {
            actions.push({
                id: 'supabase',
                label: 'Carregar do Supabase',
                icon: '☁️',
                onClick: handleSyncSupabase
            });
        }

        return actions;
    }, [handleSyncSupabase, onComparisonClick, onSyncSupabase, projects.length]);

    const handleMobileAction = (action: () => void | Promise<void>) => {
        setShowMobileActions(false);
        setTimeout(() => action(), 150);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-base-100 to-base-200/60">
            <div className="container mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2">
                            <span className="badge badge-outline badge-sm sm:badge-md border-primary/30 text-primary bg-primary/10">
                                Workspace
                            </span>
                            <span className="text-sm text-base-content/60 hidden sm:inline">
                                {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Meus Projetos
                        </h1>
                        <p className="text-base-content/70 max-w-2xl">
                            Crie, organize e acompanhe o QA por projeto — templates, métricas e integrações opcionais quando fizer sentido.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                        {isMobile ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="btn btn-primary btn-sm rounded-full"
                                    data-onboarding="create-project"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Novo</span>
                                </button>

                                {quickActions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileActions(true)}
                                        className="btn btn-outline btn-sm rounded-full"
                                        aria-label="Abrir ações rápidas"
                                        aria-expanded={showMobileActions}
                                    >
                                        Ações
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="btn btn-primary btn-sm rounded-full"
                                    data-onboarding="create-project"
                                    data-tour="create-project"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Novo Projeto</span>
                                </button>

                                {onComparisonClick && projects.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={onComparisonClick}
                                        className="btn btn-outline btn-sm rounded-full"
                                    >
                                        Comparar
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSyncSupabase}
                                    className={`btn btn-outline btn-sm rounded-full ${isSyncingSupabase ? 'loading' : ''}`}
                                    disabled={isSyncingSupabase || !onSyncSupabase}
                                    title={!onSyncSupabase ? 'Supabase não está configurado. Configure VITE_SUPABASE_PROXY_URL.' : 'Sincronizar projetos do Supabase'}
                                >
                                    <Cloud className="w-4 h-4" />
                                    <span>{isSyncingSupabase ? 'Sincronizando…' : 'Sync Supabase'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

            <Modal
                isOpen={showMobileActions}
                onClose={() => setShowMobileActions(false)}
                title="Ações rápidas"
                size="sm"
                footer={
                    <button
                        onClick={() => handleMobileAction(() => setIsCreating(true))}
                        type="button"
                        className="btn btn-primary w-full"
                    >
                        Criar Projeto
                    </button>
                }
            >
                <div className="space-y-2">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleMobileAction(action.onClick)}
                            type="button"
                            className="btn btn-outline w-full justify-start gap-3 text-left"
                        >
                            <span className="text-lg flex-shrink-0" aria-hidden="true">{action.icon}</span>
                            <span className="flex-1 text-base-content">{action.label}</span>
                        </button>
                    ))}
                </div>
            </Modal>


            <Modal isOpen={isCreating} onClose={() => {
                setIsCreating(false);
                setSelectedTemplate(undefined);
                setShowTemplates(false);
                setShowJiraImport(false);
                setSelectedJiraProjectKey('');
                setImportProgress(null);
            }} title="Criar Novo Projeto" size="xl"
                footer={
                    <div className="flex justify-end gap-2">
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
                            className="btn btn-ghost rounded-full"
                        >
                            Cancelar
                        </button>
                        {!showJiraImport && (
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="btn btn-primary rounded-full"
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

                                {isJiraConfigured && (
                                    <button
                                        onClick={async () => {
                                            setShowJiraImport(true);
                                            await loadJiraProjects();
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
                                )}
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
                            
                            {/* Seção de seleção de projeto Jira */}
                            <section className="w-full max-w-full bg-base-100 text-base-content rounded-2xl border border-base-200 bg-base-100 shadow-sm p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-base-content">
                                            Selecione o projeto para importar:
                                        </label>
                                        <button
                                            onClick={() => loadJiraProjects(false)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                            title="Atualizar lista de projetos"
                                            disabled={isLoadingJiraProjects}
                                        >
                                            <RefreshCw className={`h-3 w-3 ${isLoadingJiraProjects ? 'animate-spin' : ''}`} />
                                            Atualizar
                                        </button>
                                    </div>
                                    
                                    {isLoadingJiraProjects ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                                                <div className="w-full bg-base-200 rounded-full h-2.5">
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
                            </section>
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
                    <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4" 
                        data-tour="project-list"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.08,
                                },
                            },
                        }}
                    >
                        {filteredProjects.map((p, index) => {
                            const completedTasks = calculateProgress(p.tasks || []);
                            const totalTasks = p.tasks?.length || 0;
                            const tags = p.tags || [];
                            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                            const jiraKey = p.settings?.jiraProjectKey;
                            const desc = (p.description || '').trim();

                            return (
                                <motion.div
                                    key={p.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                                        visible: { 
                                            opacity: 1, 
                                            y: 0, 
                                            scale: 1,
                                            transition: {
                                                duration: 0.3,
                                                ease: 'easeOut',
                                            },
                                        },
                                    }}
                                >
                                    <ProjectActivityCard
                                        project={p}
                                        onSelect={() => onSelectProject(p.id)}
                                        onDelete={() => {
                                            setDeleteModalState({ isOpen: true, project: p });
                                        }}
                                        className="group"
                                    />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="mt-8 rounded-2xl border border-base-300 bg-base-100 p-10 sm:p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-base-200 flex items-center justify-center text-2xl" aria-hidden="true">
                            🚀
                        </div>
                        <h3 className="text-xl font-semibold">Nenhum projeto ainda</h3>
                        <p className="mt-2 text-base-content/70 max-w-md mx-auto">
                            Crie um projeto para organizar tarefas, testes, documentos e métricas em um fluxo único.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="btn btn-primary rounded-full"
                            >
                                Criar Projeto
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};