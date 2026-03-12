import React, { useState, useEffect } from 'react';
import { JiraConfig, testJiraConnection, getJiraProjects, importJiraProject, saveJiraConfig, getJiraConfig, getJiraLastUrl, setJiraLastUrl, deleteJiraConfig, JiraProject } from '../../services/jiraService';
import { Project } from '../../types';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Badge } from '../common/Badge';
import { logger } from '../../utils/logger';

interface JiraIntegrationProps {
    onProjectImported: (project: Project) => void;
}

export const JiraIntegration: React.FC<JiraIntegrationProps> = ({ onProjectImported }) => {
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
        // Carregar configuração salva; se não houver config, pré-preencher URL com último endereço usado
        const savedConfig = getJiraConfig();
        if (savedConfig) {
            setConfig(savedConfig);
            setIsConnected(true);
            loadJiraProjects(savedConfig);
        } else {
            const lastUrl = getJiraLastUrl();
            if (lastUrl) {
                setConfig(prev => ({ ...prev, url: lastUrl }));
            }
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
                    
                    // Não usar cache se estiver vazio ou muito antigo
                    if (Array.isArray(projects) && projects.length > 0 && cacheAge < 5 * 60 * 1000) {
                        logger.debug(`Usando projetos do cache: ${projects.length}`, 'JiraIntegration');
                        setJiraProjects(projects);
                        return;
                    } else if (Array.isArray(projects) && projects.length === 0) {
                        // Cache vazio - limpar e fazer nova requisição
                        logger.debug('Cache vazio detectado, limpando e fazendo nova requisição', 'JiraIntegration');
                        localStorage.removeItem(cacheKey);
                    } else if (cacheAge >= 5 * 60 * 1000) {
                        logger.debug('Cache expirado, fazendo nova requisição', 'JiraIntegration');
                        localStorage.removeItem(cacheKey);
                    }
                } catch (e) {
                    logger.warn('Cache inválido, continuando com requisição', 'JiraIntegration', e);
                    // Cache inválido, limpar e continuar com requisição
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        setIsLoadingProjects(true);
        logger.info('Carregando projetos do Jira', 'JiraIntegration', { url: jiraConfig.url, email: jiraConfig.email });
        
        try {
            const projects = await getJiraProjects(jiraConfig);
            logger.info(`Projetos recebidos do Jira: ${projects.length}`, 'JiraIntegration', projects);
            
            if (Array.isArray(projects) && projects.length > 0) {
                setJiraProjects(projects);
                // Salvar no cache apenas se houver projetos
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.setItem(cacheKey, JSON.stringify({
                    projects,
                    timestamp: Date.now()
                }));
                logger.info(`${projects.length} projetos salvos no cache`, 'JiraIntegration');
            } else if (Array.isArray(projects) && projects.length === 0) {
                logger.warn('Nenhum projeto encontrado no Jira', 'JiraIntegration');
                setJiraProjects([]);
                // Não salvar cache vazio - isso impede novas tentativas
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.removeItem(cacheKey);
                handleError(new Error('Nenhum projeto encontrado no Jira. Verifique se você tem acesso a projetos.'), 'Carregar Projetos');
            } else {
                logger.error('Resposta inválida do Jira', 'JiraIntegration', projects);
                setJiraProjects([]);
                // Limpar cache em caso de erro
                const cacheKey = `jira_projects_${jiraConfig.url}`;
                localStorage.removeItem(cacheKey);
                handleError(new Error('Resposta inválida do servidor Jira'), 'Carregar Projetos');
            }
        } catch (error) {
            logger.error('Erro ao carregar projetos do Jira', 'JiraIntegration', error);
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
                await loadJiraProjects(config, false); // Não usar cache ao conectar
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
        // Limpar cache
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
            onProjectImported(project);
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
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Integração com Jira</h3>
                    <p className="text-text-secondary text-sm">
                        Importe projetos existentes do Jira para o aplicativo
                    </p>
                </div>
                {isConnected ? (
                    <Badge variant="success">Conectado</Badge>
                ) : (
                    <Badge variant="default">Desconectado</Badge>
                )}
            </div>

            {!isConnected ? (
                <div className="space-y-4">
                    <p className="text-text-secondary text-sm">
                        Configure sua conexão com o Jira para importar projetos. Você precisará de:
                    </p>
                    <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 ml-4">
                        <li>URL do seu Jira (ex: https://seu-dominio.atlassian.net)</li>
                        <li>Email da sua conta Atlassian</li>
                        <li>API Token (gerado em: Account Settings → Security → API tokens)</li>
                    </ul>
                    <button
                        onClick={() => setShowConfigModal(true)}
                        className="btn btn-primary w-full"
                    >
                        🔗 Configurar Conexão
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm">
                                Conectado como: <strong className="text-text-primary">{config.email}</strong>
                            </p>
                            <p className="text-text-secondary text-xs">
                                URL: {config.url}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowConfigModal(true)}
                                className="btn btn-secondary text-sm"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="btn btn-secondary text-sm hover:bg-red-500/20 hover:border-red-500/30"
                            >
                                Desconectar
                            </button>
                        </div>
                    </div>

                    {isLoadingProjects ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                                <p className="text-text-secondary text-sm">Carregando projetos do Jira...</p>
                                <p className="text-text-secondary text-xs">Isso pode levar alguns segundos</p>
                            </div>
                        </div>
                    ) : jiraProjects.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-text-secondary">
                                    Selecione o projeto para importar:
                                </label>
                                <button
                                    onClick={() => loadJiraProjects(config, false)}
                                    className="text-xs text-accent hover:underline"
                                    title="Atualizar lista de projetos"
                                >
                                    🔄 Atualizar
                                </button>
                            </div>
                            <select
                                value={selectedProjectKey}
                                onChange={(e) => setSelectedProjectKey(e.target.value)}
                                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
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
                                        📥 Importar Projeto
                                    </>
                                )}
                            </button>
                            {isImporting && (
                                <div className="mt-2 p-4 bg-surface border border-surface-border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-text-primary">Importando tarefas do Jira...</span>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                                    </div>
                                    <div className="w-full bg-surface-hover rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-accent h-2.5 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: importProgress?.total 
                                                    ? `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%` 
                                                    : '50%'
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1 text-xs text-text-secondary">
                                        <p>
                                            ⏳ <strong>Aguarde...</strong> Projetos grandes podem levar vários minutos.
                                        </p>
                                        <p>
                                            📊 Verifique o console do navegador (F12) para ver o progresso detalhado.
                                        </p>
                                        <p className="text-accent">
                                            💡 Não feche esta página durante a importação!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-text-secondary text-sm">
                                Carregando projetos do Jira...
                            </p>
                        </div>
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
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            URL do Jira *
                        </label>
                        <input
                            type="text"
                            value={config.url}
                            onChange={(e) => setConfig({ ...config, url: e.target.value })}
                            onBlur={(e) => {
                                const url = e.target.value?.trim() ?? '';
                                if (url) setJiraLastUrl(url);
                            }}
                            placeholder="https://seu-dominio.atlassian.net"
                            className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            URL completa do seu Jira (sem barra no final)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={config.email}
                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                            placeholder="seu-email@exemplo.com"
                            className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            API Token *
                        </label>
                        <input
                            type="password"
                            value={config.apiToken}
                            onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                            placeholder="Seu API Token do Jira"
                            className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-text-secondary mt-1">
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

                    <div className="flex justify-end gap-2 pt-4 border-t border-surface-border mt-6">
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
        </Card>
    );
};

