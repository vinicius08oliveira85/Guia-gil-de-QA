import React, { useState, useEffect } from 'react';
import { Link, Globe, Mail, KeyRound } from 'lucide-react';
import {
  JiraConfig,
  testJiraConnection,
  getJiraProjects,
  importJiraProject,
  saveJiraConfig,
  getJiraConfig,
  getJiraLastUrl,
  setJiraLastUrl,
  deleteJiraConfig,
  JiraProject,
} from '../../services/jiraService';
import { Project } from '../../types';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { StatusBadge } from './StatusBadge';
import {
  leveSettingsCardClass,
  leveSettingsInsetPanelClass,
  leveSettingsLinkClass,
  leveSettingsListClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
  leveSettingsOutlineBtnClass,
  leveSettingsPrimaryBtnFullClass,
  leveSettingsSectionIconWrapClass,
  leveSettingsSectionMainClass,
  leveSettingsSectionRowClass,
  leveSettingsSectionSubtitleClass,
  leveSettingsSectionTitleClass,
  leveSettingsSelectClass,
  leveSettingsStrongTextClass,
} from '../common/projectCardUi';
import { Input } from '../common/Input';
import { logger } from '../../utils/logger';
import { APP_STATE_RESTORED_EVENT } from '../../services/appStateRestoreService';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { AppSelect } from '../common/AppSelect';
import { settingsNeuModalPanelClass } from './settingsNeuUi';
import {
  jiraIntegrationImportBtnClass,
  jiraIntegrationSaveBtnClass,
} from '../jira/jiraIntegrationUi';

interface JiraSettingsTabProps {
  onProjectImported?: (project: Project) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export const JiraSettingsTab: React.FC<JiraSettingsTabProps> = ({
  onProjectImported,
  onDirtyChange,
}) => {
  const [config, setConfig] = useState<JiraConfig>({
    url: '',
    email: '',
    apiToken: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingOnly, setIsSavingOnly] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ url: '', email: '', apiToken: '' });

  const validateUrl = (v: string) =>
    v && !v.startsWith('https://') ? 'URL deve começar com https://' : '';
  const validateEmail = (v: string) =>
    v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'E-mail inválido' : '';
  const validateToken = (v: string) =>
    v && v.length < 10 ? 'Token muito curto (mínimo 10 caracteres)' : '';
  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(
    null
  );
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

  useEffect(() => {
    const onAppStateRestored = () => {
      const savedConfig = getJiraConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setIsConnected(true);
        loadJiraProjects(savedConfig);
      }
    };
    window.addEventListener(APP_STATE_RESTORED_EVENT, onAppStateRestored);
    return () => window.removeEventListener(APP_STATE_RESTORED_EVENT, onAppStateRestored);
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
            logger.debug(
              'Cache vazio detectado, limpando e fazendo nova requisição',
              'JiraSettingsTab'
            );
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
    logger.info('Carregando projetos do Jira', 'JiraSettingsTab', {
      url: jiraConfig.url,
      email: jiraConfig.email,
    });

    try {
      const projects = await getJiraProjects(jiraConfig);
      logger.info(`Projetos recebidos do Jira: ${projects.length}`, 'JiraSettingsTab', projects);

      if (Array.isArray(projects) && projects.length > 0) {
        setJiraProjects(projects);
        const cacheKey = `jira_projects_${jiraConfig.url}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            projects,
            timestamp: Date.now(),
          })
        );
        logger.info(`${projects.length} projetos salvos no cache`, 'JiraSettingsTab');
      } else if (Array.isArray(projects) && projects.length === 0) {
        logger.warn('Nenhum projeto encontrado no Jira', 'JiraSettingsTab');
        setJiraProjects([]);
        const cacheKey = `jira_projects_${jiraConfig.url}`;
        localStorage.removeItem(cacheKey);
        handleError(
          new Error('Nenhum projeto encontrado no Jira. Verifique se você tem acesso a projetos.'),
          'Carregar Projetos'
        );
      } else {
        logger.error('Resposta inválida do Jira', 'JiraSettingsTab', projects);
        setJiraProjects([]);
        const cacheKey = `jira_projects_${jiraConfig.url}`;
        localStorage.removeItem(cacheKey);
        handleError(new Error('Resposta inválida do servidor Jira'), 'Carregar Projetos');
      }
    } catch (error) {
      logger.error('Erro ao carregar projetos do Jira', 'JiraSettingsTab', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido ao carregar projetos do Jira';
      handleError(new Error(errorMessage), 'Carregar Projetos');
      setJiraProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const validateAllFields = () => {
    const errors = {
      url: validateUrl(config.url),
      email: validateEmail(config.email),
      apiToken: validateToken(config.apiToken),
    };
    setFieldErrors(errors);
    return !errors.url && !errors.email && !errors.apiToken;
  };

  const handleTestOnly = async () => {
    if (!config.url || !config.email || !config.apiToken) {
      handleError(new Error('Preencha todos os campos antes de testar'), 'Testar Conexão');
      return;
    }
    setIsTesting(true);
    try {
      const ok = await testJiraConnection(config);
      if (ok) {
        toast.success('Conexão com Jira bem-sucedida!');
      } else {
        toast.error('Falha na conexão. Verifique suas credenciais.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao testar conexão com Jira.';
      toast.error(msg);
      logger.error('Teste de conexão falhou', 'JiraSettingsTab', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.url || !config.email || !config.apiToken) {
      handleError(new Error('Preencha todos os campos'), 'Configuração do Jira');
      return;
    }
    if (!validateAllFields()) return;

    setIsSavingOnly(true);
    try {
      const isValid = await testJiraConnection(config);
      if (isValid) {
        await saveJiraConfig(config);
        setIsConnected(true);
        setShowConfigModal(false);
        onDirtyChange?.(false);
        await loadJiraProjects(config, false);
        handleSuccess('Conexão com Jira configurada com sucesso!');
      } else {
        handleError(
          new Error('Não foi possível conectar ao Jira. Verifique suas credenciais.'),
          'Teste de Conexão'
        );
      }
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Erro ao salvar configuração'),
        'Salvar Configuração'
      );
    } finally {
      setIsSavingOnly(false);
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
      const project = await importJiraProject(savedConfig, selectedProjectKey, (current, total) =>
        setImportProgress({ current, total })
      );
      setImportProgress(null);

      // Invalidar cache de projetos para refletir mudanças
      const cacheKey = `jira_projects_${savedConfig.url}`;
      localStorage.removeItem(cacheKey);

      onProjectImported?.(project);
      handleSuccess(
        `Projeto "${project.name}" importado do Jira com sucesso! ${project.tasks.length} tarefas importadas.`
      );
      setSelectedProjectKey('');
    } catch (error) {
      setImportProgress(null);
      handleError(
        error instanceof Error ? error : new Error('Erro ao importar projeto'),
        'Importar do Jira'
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className={leveSettingsSectionRowClass}>
        <div className={leveSettingsSectionMainClass}>
          <div className={leveSettingsSectionIconWrapClass}>
            <Link className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={leveSettingsSectionTitleClass}>Integração com Jira</h3>
            <p className={leveSettingsSectionSubtitleClass}>
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
        <div className={leveSettingsInsetPanelClass}>
          <div className="space-y-4">
            <p className={leveSettingsMutedTextClass}>
              Configure sua conexão com o Jira para importar projetos. Você precisará de:
            </p>
            <ul className={leveSettingsListClass}>
              <li>URL do seu Jira (ex: https://seu-dominio.atlassian.net)</li>
              <li>Email da sua conta Atlassian</li>
              <li>API Token (gerado em: Account Settings → Security → API tokens)</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className={leveSettingsPrimaryBtnFullClass}
            >
              <Link className="h-4 w-4" aria-hidden />
              Configurar Conexão
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={cn(leveSettingsCardClass, 'lg:col-span-2')}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base-content/72 text-sm">
                  Conectado como: <strong className="text-base-content">{config.email}</strong>
                </p>
                <p className="text-base-content/72 text-xs font-mono break-all">
                  URL: {config.url}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowConfigModal(true)}
                  className={cn(leveSettingsOutlineBtnClass, 'text-sm')}
                >
                  Editar
                </button>
                <button
                  onClick={handleDisconnect}
                  className={cn(leveSettingsOutlineBtnClass, 'text-sm text-[#e54b4f] hover:border-[color-mix(in_srgb,#e54b4f_35%,transparent)]')}
                >
                  Desconectar
                </button>
              </div>
            </div>
          </div>

          {isLoadingProjects ? (
            <div className={cn(leveSettingsCardClass, 'py-8')}>
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-base-content/72 text-sm font-medium">
                  Carregando projetos do Jira...
                </p>
                <p className="text-base-content/72 text-xs">Isso pode levar alguns segundos</p>
              </div>
            </div>
          ) : jiraProjects.length > 0 ? (
            <>
              <div className={leveSettingsCardClass}>
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
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Atualizar
                    </button>
                  </div>
                  <AppSelect
                    value={selectedProjectKey}
                    onChange={v => setSelectedProjectKey(v)}
                    className={leveSettingsSelectClass}
                  >
                    <option value="">Selecione um projeto...</option>
                    {Array.isArray(jiraProjects) &&
                      jiraProjects.map(project => (
                        <option key={project.key} value={project.key}>
                          {project.key} - {project.name}
                        </option>
                      ))}
                  </AppSelect>
                  <button
                    onClick={handleImport}
                    disabled={!selectedProjectKey || isImporting}
                    className={jiraIntegrationImportBtnClass}
                  >
                    {isImporting ? (
                      <>
                        <Spinner small />
                        {importProgress ? (
                          importProgress.total ? (
                            <>
                              Importando... {importProgress.current} de {importProgress.total}
                            </>
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
                </div>
              </div>

              {isImporting && (
                <div
                  className={cn(
                    leveSettingsCardClass,
                    'mt-4 border-primary/25'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-base-content">
                      Importando tarefas do Jira...
                    </span>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                  <div className="workspace-stat-neu-track mb-2 h-2.5 w-full">
                    <div
                      className="workspace-stat-neu-fill h-2.5 rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: importProgress?.total
                          ? `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%`
                          : '50%',
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-xs text-base-content/72">
                    <p>
                      <strong>Aguarde...</strong> Projetos grandes podem levar vários minutos.
                    </p>
                    <p>Verifique o console do navegador (F12) para ver o progresso detalhado.</p>
                    <p className="text-primary font-medium">
                      Não feche esta página durante a importação!
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={cn(leveSettingsCardClass, 'py-8')}>
              <div className="text-center">
                <p className="text-base-content/72 text-sm">
                  Nenhum projeto encontrado. Verifique suas permissões no Jira.
                </p>
              </div>
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
        panelClassName={settingsNeuModalPanelClass}
      >
        <div className="space-y-5 pb-2">
          <Input
            label="URL do Jira *"
            type="text"
            value={config.url}
            onChange={e => {
              setConfig({ ...config, url: e.target.value });
              onDirtyChange?.(true);
            }}
            onBlur={e => {
              const url = e.target.value?.trim() ?? '';
              if (url) setJiraLastUrl(url);
              setFieldErrors(prev => ({ ...prev, url: validateUrl(url) }));
            }}
            placeholder="https://seu-dominio.atlassian.net"
            helperText="URL completa do seu Jira (sem barra no final)"
            error={fieldErrors.url}
            leftIcon={<Globe className="w-4 h-4" />}
          />

          <Input
            label="Email *"
            type="email"
            value={config.email}
            onChange={e => {
              setConfig({ ...config, email: e.target.value });
              onDirtyChange?.(true);
            }}
            onBlur={() => setFieldErrors(prev => ({ ...prev, email: validateEmail(config.email) }))}
            placeholder="seu-email@exemplo.com"
            error={fieldErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="API Token *"
            type="password"
            value={config.apiToken}
            onChange={e => {
              setConfig({ ...config, apiToken: e.target.value });
              onDirtyChange?.(true);
            }}
            onBlur={() =>
              setFieldErrors(prev => ({ ...prev, apiToken: validateToken(config.apiToken) }))
            }
            placeholder="Seu API Token do Jira"
            error={fieldErrors.apiToken}
            leftIcon={<KeyRound className="w-4 h-4" />}
            helperText=""
          />
          <p className="text-xs text-base-content/72 -mt-3">
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className={leveSettingsLinkClass}
            >
              Como gerar um API Token?
            </a>
          </p>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-base-content/12 pt-4">
            <button type="button" onClick={() => setShowConfigModal(false)} className={leveSettingsOutlineBtnClass}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleTestOnly}
              disabled={isTesting || isSavingOnly}
              className={cn(leveSettingsOutlineBtnClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {isTesting ? (
                <>
                  <Spinner small />
                  Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isTesting || isSavingOnly}
              className={jiraIntegrationSaveBtnClass}
            >
              {isSavingOnly ? (
                <>
                  <Spinner small />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
