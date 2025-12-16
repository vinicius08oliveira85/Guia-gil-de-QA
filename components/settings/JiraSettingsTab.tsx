import React, { useState, useEffect } from 'react';
import { Link } from 'lucide-react';
import { JiraConfig, testJiraConnection, getJiraProjects, importJiraProject, saveJiraConfig, getJiraConfig, deleteJiraConfig, JiraProject } from '../../services/jiraService';
import { Project } from '../../types';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { StatusBadge } from './StatusBadge';
import { Card } from '../common/Card';
import { logger } from '../../utils/logger';
import { cn } from '../../utils/cn';

interface JiraSettingsTabProps {
    onProjectImported?: (project: Project) => void;
}

export const JiraSettingsTab: React.FC<JiraSettingsTabProps> = ({ onProjectImported }) => {
    const [config, setConfig] = useState<JiraConfig>({
        url: '',
        email: '',
        apiToken: '',
    });
    const [isTesting, setIsTesting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [selectedProjectKey, setSelectedProjectKey] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    useEffect(() => {
        // Carregar configuração salva
        const savedConfig = getJiraConfig();
        if (savedConfig) {
            setConfig(savedConfig);
            setIsConnected(true);
            loadJiraProjects(savedConfig);
        }
    }, []);

    const loadJiraProjects = async (jiraConfig: JiraConfig, useCache: boolean = true) => {
        // Verificar cache primeiro (válido por 5 minutos)
        if (useCache) {
            const cacheKey = `jira_projects_${jiraConfig.url}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const { projects, timestamp } = JSON.parse(cached);
                    const cacheAge = Date.now() - timestamp;
                    
                    if (Array.isArray(projects) && projects.length > 0 && cacheAge < 5 * 60 * 1000) {
                        logger.debug(`Usando projetos do cache: ${projects.length}`, 'JiraSettingsTab');
                        setJiraProjects(projects);
                        return;
                    } else if (Array.isArray(projects) && projects.length === 0) {
                        logger.debug('Cache vazio detectado, limpando e fazendo nova requisição', 'JiraSettingsTab');
                        localStorage.removeItem(cacheKey);
                    } else if (cacheAge >= 5 * 60 * 1000) {
                        logger.debug('Cache expirado, fazendo nova requisição', 'JiraSettingsTab');
                        localStorage.removeItem(cacheKey);
                    }
                } catch (e) {
                    logger.warn('Cache inválido, continuando com requisição', 'JiraSettingsTab', e);
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        setIsLoadingProjects(true);
        logger.info('Carregando projetos do Jira', 'JiraSettingsTab', { url: jiraConfig.url, email: jiraConfig.email });
        
        try {
            const projects = await getJiraProjects(jiraConfig);
            logger.info(`Projetos recebidos do Jira: ${projects.length}`, 'JiraSettingsTab', projects);
            
            if (Array.isArray(projects) && projects.length > 0) {
                setJiraProjects(projects);
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.setItem(cacheKey, JSON.stringify({
                    projects,
                    timestamp: Date.now()
                }));
                logger.info(`${projects.length} projetos salvos no cache`, 'JiraSettingsTab');
            } else if (Array.isArray(projects) && projects.length === 0) {
                logger.warn('Nenhum projeto encontrado no Jira', 'JiraSettingsTab');
                setJiraProjects([]);
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.removeItem(cacheKey);
                handleError(new Error('Nenhum projeto encontrado no Jira. Verifique se você tem acesso a projetos.'), 'Carregar Projetos');
            } else {
                logger.error('Resposta inválida do Jira', 'JiraSettingsTab', projects);
                setJiraProjects([]);
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.removeItem(cacheKey);
                handleError(new Error('Resposta inválida do servidor Jira'), 'Carregar Projetos');
            }
        } catch (error) {
            logger.error('Erro ao carregar projetos do Jira', 'JiraSettingsTab', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar projetos do Jira';
            handleError(new Error(errorMessage), 'Carregar Projetos');
            setJiraProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!config.url || !config.email || !config.apiToken) {
            handleError(new Error('Preencha todos os campos'), 'Configuração do Jira');
            return;
        }

        setIsTesting(true);
        try {
            const isValid = await testJiraConnection(config);
            if (isValid) {
                saveJiraConfig(config);
                setIsConnected(true);
                setShowConfigModal(false);
                await loadJiraProjects(config, false);
                handleSuccess('Conexão com Jira configurada com sucesso!');
            } else {
                handleError(new Error('Não foi possível conectar ao Jira. Verifique suas credenciais.'), 'Teste de Conexão');
            }
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao testar conexão'), 'Teste de Conexão');
        } finally {
            setIsTesting(false);
        }
    };

    const handleDisconnect = () => {
        deleteJiraConfig();
        setConfig({ url: '', email: '', apiToken: '' });
        setIsConnected(false);
        setJiraProjects([]);
        setSelectedProjectKey('');
        setIsLoadingProjects(false);
        const cacheKey = `jira_projects_${config.url}`;
        localStorage.removeItem(cacheKey);
        handleSuccess('Conexão com Jira desconectada');
    };

    const handleImport = async () => {
        if (!selectedProjectKey) {
            handleError(new Error('Selecione um projeto'), 'Importar do Jira');
            return;
        }

        const savedConfig = getJiraConfig();
        if (!savedConfig) {
            handleError(new Error('Configure a conexão com Jira primeiro'), 'Importar do Jira');
            return;
        }

        setIsImporting(true);
        setImportProgress({ current: 0 });
        
        try {
            const project = await importJiraProject(
                savedConfig,
                selectedProjectKey,
                (current, total) => setImportProgress({ current, total })
            );
            setImportProgress(null);
            onProjectImported?.(project);
            handleSuccess(`Projeto "${project.name}" importado do Jira com sucesso! ${project.tasks.length} tarefas importadas.`);
            setSelectedProjectKey('');
        } catch (error) {
            setImportProgress(null);
            handleError(error instanceof Error ? error : new Error('Erro ao importar projeto'), 'Importar do Jira');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header da seção */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Link className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-base-content mb-2">Integração com Jira</h3>
                        <p className="text-base-content/70 text-sm leading-relaxed">
                            Importe projetos existentes do Jira para o aplicativo
                        </p>
                    </div>
                </div>
                {isConnected ? (
                    <StatusBadge variant="connected">Conectado</StatusBadge>
                ) : (
                    <StatusBadge variant="disconnected">Desconectado</StatusBadge>
                )}
            </div>

            {!isConnected ? (
                <Card className="p-6">
                    <div className="space-y-4">
                        <p className="text-base-content/70 text-sm leading-relaxed">
                            Configure sua conexão com o Jira para importar projetos. Você precisará de:
                        </p>
                        <ul className="list-disc list-inside text-base-content/70 text-sm space-y-2 ml-4">
                            <li>URL do seu Jira (ex: https://seu-dominio.atlassian.net)</li>
                            <li>Email da sua conta Atlassian</li>
                            <li>API Token (gerado em: Account Settings → Security → API tokens)</li>
                        </ul>
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="btn btn-primary w-full mt-4"
                        >
                            <Link className="h-4 w-4 mr-2" />
                            Configurar Conexão
                        </button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-base-content/70 text-sm">
                                    Conectado como: <strong className="text-base-content">{config.email}</strong>
                                </p>
                                <p className="text-base-content/70 text-xs font-mono break-all">
                                    URL: {config.url}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setShowConfigModal(true)}
                                    className="btn btn-secondary text-sm"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="btn btn-secondary text-sm hover:bg-red-500/20 hover:border-red-500/30"
                                >
                                    Desconectar
                                </button>
                            </div>
                        </div>
                    </Card>

                    {isLoadingProjects ? (
                        <Card className="p-8">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-base-content/70 text-sm font-medium">Carregando projetos do Jira...</p>
                                <p className="text-base-content/70 text-xs">Isso pode levar alguns segundos</p>
                            </div>
                        </Card>
                    ) : jiraProjects.length > 0 ? (
                        <>
                            <Card className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-base-content">
                                            Selecione o projeto para importar:
                                        </label>
                                        <button
                                            onClick={() => loadJiraProjects(config, false)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                            title="Atualizar lista de projetos"
                                        >
                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Atualizar
                                        </button>
                                    </div>
                                    <select
                                        value={selectedProjectKey}
                                        onChange={(e) => setSelectedProjectKey(e.target.value)}
                                        className="select select-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Selecione um projeto...</option>
                                        {Array.isArray(jiraProjects) && jiraProjects.map(project => (
                                            <option key={project.key} value={project.key}>
                                                {project.key} - {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleImport}
                                        disabled={!selectedProjectKey || isImporting}
                                        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isImporting ? (
                                            <>
                                                <Spinner small />
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
                                            <>
                                                Importar Projeto
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Card>
                            {isImporting && (
                                <Card className="mt-4 p-4 border-primary/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-base-content">Importando tarefas do Jira...</span>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    </div>
                                    <div className="w-full bg-base-200 rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: importProgress?.total 
                                                    ? `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%` 
                                                    : '50%'
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1 text-xs text-base-content/70">
                                        <p>
                                            <strong>Aguarde...</strong> Projetos grandes podem levar vários minutos.
                                        </p>
                                        <p>
                                            Verifique o console do navegador (F12) para ver o progresso detalhado.
                                        </p>
                                        <p className="text-primary font-medium">
                                            Não feche esta página durante a importação!
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="p-8">
                            <div className="text-center">
                                <p className="text-base-content/70 text-sm">
                                    Nenhum projeto encontrado. Verifique suas permissões no Jira.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Modal de Configuração */}
            <Modal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                title="Configurar Conexão com Jira"
                size="lg"
                maxHeight="90vh"
            >
                <div className="space-y-5 pb-2">
                    <div>
                        <label className="block text-sm font-medium text-base-content/70 mb-1">
                            URL do Jira *
                        </label>
                        <input
                            type="text"
                            value={config.url}
                            onChange={(e) => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://seu-dominio.atlassian.net"
                            className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-base-content/70 mt-1">
                            URL completa do seu Jira (sem barra no final)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-base-content/70 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={config.email}
                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                            placeholder="seu-email@exemplo.com"
                            className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-base-content/70 mb-1">
                            API Token *
                        </label>
                        <input
                            type="password"
                            value={config.apiToken}
                            onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                            placeholder="Seu API Token do Jira"
                            className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-base-content/70 mt-1">
                            <a
                                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent-light underline"
                            >
                                Como gerar um API Token?
                            </a>
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-base-300 mt-6">
                        <button
                            onClick={() => setShowConfigModal(false)}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            disabled={isTesting}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTesting ? (
                                <>
                                    <Spinner small />
                                    Testando...
                                </>
                            ) : (
                                'Salvar e Testar'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

