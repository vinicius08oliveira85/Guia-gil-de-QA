import React, { useState, useEffect } from 'react';

import { Globe, Link, Mail, KeyRound } from 'lucide-react';

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

import { logger } from '../../utils/logger';

import { AppSelect } from '../common/AppSelect';

import { Input } from '../common/Input';

import { StatusBadge } from '../settings/StatusBadge';

import { cn } from '../../utils/cn';

import {
  jiraIntegrationDisconnectBtnClass,
  jiraIntegrationImportBtnClass,

  jiraIntegrationImportProgressPanelClass,

  jiraIntegrationInsetPanelClass,

  jiraIntegrationInputClass,

  jiraIntegrationLabelClass,

  jiraIntegrationLinkPillClass,

  jiraIntegrationListClass,

  jiraIntegrationModalFooterClass,

  jiraIntegrationModalPanelClass,

  jiraIntegrationMutedXsClass,

  jiraIntegrationOutlineBtnClass,

  jiraIntegrationPrimaryBtnClass,

  jiraIntegrationProgressFillClass,

  jiraIntegrationProgressTrackClass,

  jiraIntegrationScopeClass,

  jiraIntegrationSaveBtnClass,

  jiraIntegrationSelectClass,

  jiraIntegrationShellClass,

  jiraIntegrationSpinnerShellMdClass,

  jiraIntegrationSpinnerShellSmClass,

  jiraIntegrationStatusBadgeClass,

  jiraIntegrationStrongClass,

  jiraIntegrationSubtitleClass,

  jiraIntegrationTitleClass,

} from './jiraIntegrationUi';

import { leveViewOutlineBtnClass } from '../common/projectCardUi';



interface JiraIntegrationProps {

  onProjectImported: (project: Project) => void;

}

function JiraNeuSpinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const shellClass =
    size === 'sm' ? jiraIntegrationSpinnerShellSmClass : jiraIntegrationSpinnerShellMdClass;
  return (
    <div className={shellClass} aria-hidden>
      <Spinner small={size === 'sm'} className="text-primary" />
    </div>
  );
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

  const [importProgress, setImportProgress] = useState<{ current: number; total?: number } | null>(

    null

  );

  const [showConfigModal, setShowConfigModal] = useState(false);

  const { handleError, handleSuccess } = useErrorHandler();



  useEffect(() => {

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

    if (useCache) {

      const cacheKey = `jira_projects_${jiraConfig.url}`;

      const cached = localStorage.getItem(cacheKey);

      if (cached) {

        try {

          const { projects, timestamp } = JSON.parse(cached);

          const cacheAge = Date.now() - timestamp;



          if (Array.isArray(projects) && projects.length > 0 && cacheAge < 5 * 60 * 1000) {

            logger.debug(`Usando projetos do cache: ${projects.length}`, 'JiraIntegration');

            setJiraProjects(projects);

            return;

          } else if (Array.isArray(projects) && projects.length === 0) {

            logger.debug(

              'Cache vazio detectado, limpando e fazendo nova requisição',

              'JiraIntegration'

            );

            localStorage.removeItem(cacheKey);

          } else if (cacheAge >= 5 * 60 * 1000) {

            logger.debug('Cache expirado, fazendo nova requisição', 'JiraIntegration');

            localStorage.removeItem(cacheKey);

          }

        } catch (e) {

          logger.warn('Cache inválido, continuando com requisição', 'JiraIntegration', e);

          localStorage.removeItem(cacheKey);

        }

      }

    }



    setIsLoadingProjects(true);

    logger.info('Carregando projetos do Jira', 'JiraIntegration', {

      url: jiraConfig.url,

      email: jiraConfig.email,

    });



    try {

      const projects = await getJiraProjects(jiraConfig);

      logger.info(`Projetos recebidos do Jira: ${projects.length}`, 'JiraIntegration', projects);



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

        logger.info(`${projects.length} projetos salvos no cache`, 'JiraIntegration');

      } else if (Array.isArray(projects) && projects.length === 0) {

        logger.warn('Nenhum projeto encontrado no Jira', 'JiraIntegration');

        setJiraProjects([]);

        const cacheKey = `jira_projects_${jiraConfig.url}`;

        localStorage.removeItem(cacheKey);

        handleError(

          new Error('Nenhum projeto encontrado no Jira. Verifique se você tem acesso a projetos.'),

          'Carregar Projetos'

        );

      } else {

        logger.error('Resposta inválida do Jira', 'JiraIntegration', projects);

        setJiraProjects([]);

        const cacheKey = `jira_projects_${jiraConfig.url}`;

        localStorage.removeItem(cacheKey);

        handleError(new Error('Resposta inválida do servidor Jira'), 'Carregar Projetos');

      }

    } catch (error) {

      logger.error('Erro ao carregar projetos do Jira', 'JiraIntegration', error);

      const errorMessage =

        error instanceof Error ? error.message : 'Erro desconhecido ao carregar projetos do Jira';

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

        handleError(

          new Error('Não foi possível conectar ao Jira. Verifique suas credenciais.'),

          'Teste de Conexão'

        );

      }

    } catch (error) {

      handleError(

        error instanceof Error ? error : new Error('Erro ao testar conexão'),

        'Teste de Conexão'

      );

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

      const project = await importJiraProject(savedConfig, selectedProjectKey, (current, total) =>

        setImportProgress({ current, total })

      );

      setImportProgress(null);

      onProjectImported(project);

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

    <div className={jiraIntegrationScopeClass}>

    <section className={jiraIntegrationShellClass} aria-label="Integração com Jira">

      <div className="mb-4 flex items-center justify-between">

        <div>

          <h3 className={jiraIntegrationTitleClass}>Integração com Jira</h3>

          <p className={jiraIntegrationSubtitleClass}>

            Importe projetos existentes do Jira para o aplicativo

          </p>

        </div>

        {isConnected ? (

          <StatusBadge variant="connected" className={jiraIntegrationStatusBadgeClass('connected')}>

            Conectado

          </StatusBadge>

        ) : (

          <StatusBadge variant="disconnected" className={jiraIntegrationStatusBadgeClass('disconnected')}>

            Desconectado

          </StatusBadge>

        )}

      </div>



      {!isConnected ? (

        <div className={jiraIntegrationInsetPanelClass}>

          <div className="space-y-4">

            <p className={jiraIntegrationSubtitleClass}>

              Configure sua conexão com o Jira para importar projetos. Você precisará de:

            </p>

            <ul className={jiraIntegrationListClass}>

              <li>URL do seu Jira (ex: https://seu-dominio.atlassian.net)</li>

              <li>Email da sua conta Atlassian</li>

              <li>API Token (gerado em: Account Settings → Security → API tokens)</li>

            </ul>

            <button

              type="button"

              onClick={() => setShowConfigModal(true)}

              className={jiraIntegrationPrimaryBtnClass}

            >

              <Link className="h-4 w-4" aria-hidden />

              Configurar Conexão

            </button>

          </div>

        </div>

      ) : (

        <div className="space-y-4">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className={jiraIntegrationSubtitleClass}>

                Conectado como:{' '}

                <strong className={jiraIntegrationStrongClass}>{config.email}</strong>

              </p>

              <p className={cn(jiraIntegrationMutedXsClass, 'break-all font-mono')}>

                URL: {config.url}

              </p>

            </div>

            <div className="flex shrink-0 gap-2">

              <button

                type="button"

                onClick={() => setShowConfigModal(true)}

                className={jiraIntegrationOutlineBtnClass}

              >

                Editar

              </button>

              <button

                type="button"

                onClick={handleDisconnect}

                className={jiraIntegrationDisconnectBtnClass}

              >

                Desconectar

              </button>

            </div>

          </div>



          {isLoadingProjects ? (

            <div className={cn(jiraIntegrationInsetPanelClass, 'py-8')}>

              <div className="flex flex-col items-center gap-3">

                <JiraNeuSpinner size="md" />

                <p className="text-sm font-medium text-base-content/72">

                  Carregando projetos do Jira...

                </p>

                <p className={jiraIntegrationMutedXsClass}>Isso pode levar alguns segundos</p>

              </div>

            </div>

          ) : jiraProjects.length > 0 ? (

            <div className="space-y-3">

              <div className="flex items-center justify-between">

                <label className={jiraIntegrationLabelClass}>

                  Selecione o projeto para importar:

                </label>

                <button

                  type="button"

                  onClick={() => loadJiraProjects(config, false)}

                  className={jiraIntegrationLinkPillClass}

                  title="Atualizar lista de projetos"

                >

                  Atualizar lista

                </button>

              </div>

              <AppSelect

                value={selectedProjectKey}

                onChange={v => setSelectedProjectKey(v)}

                className={jiraIntegrationSelectClass}

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

                type="button"

                onClick={handleImport}

                disabled={!selectedProjectKey || isImporting}

                className={jiraIntegrationImportBtnClass}

              >

                {isImporting ? (

                  <>

                    <JiraNeuSpinner size="sm" />

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

              {isImporting && (

                <div className={jiraIntegrationImportProgressPanelClass}>

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm font-medium text-base-content">

                      Importando tarefas do Jira...

                    </span>

                    <JiraNeuSpinner size="sm" />

                  </div>

                  <div className={jiraIntegrationProgressTrackClass}>

                    <div

                      className={jiraIntegrationProgressFillClass}

                      style={{

                        width: importProgress?.total

                          ? `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%`

                          : '50%',

                      }}

                    />

                  </div>

                  <div className={cn('space-y-1', jiraIntegrationMutedXsClass)}>

                    <p>

                      <strong>Aguarde...</strong> Projetos grandes podem levar vários minutos.

                    </p>

                    <p>Verifique o console do navegador (F12) para ver o progresso detalhado.</p>

                    <p className="font-medium text-primary">

                      Não feche esta página durante a importação!

                    </p>

                  </div>

                </div>

              )}

            </div>

          ) : (

            <div className={cn(jiraIntegrationInsetPanelClass, 'py-4 text-center')}>

              <p className={jiraIntegrationSubtitleClass}>Carregando projetos do Jira...</p>

            </div>

          )}

        </div>

      )}



      <Modal

        isOpen={showConfigModal}

        onClose={() => setShowConfigModal(false)}

        title="Configurar Conexão com Jira"

        size="lg"

        maxHeight="90vh"

        panelClassName={jiraIntegrationModalPanelClass}

      >

        <div className="space-y-5 pb-2">

          <Input

            label="URL do Jira *"

            type="text"

            variant="neu"

            value={config.url}

            className={jiraIntegrationInputClass}

            onChange={e => setConfig({ ...config, url: e.target.value })}

            onBlur={e => {

              const url = e.target.value?.trim() ?? '';

              if (url) setJiraLastUrl(url);

            }}

            placeholder="https://seu-dominio.atlassian.net"

            helperText="URL completa do seu Jira (sem barra no final)"

            leftIcon={<Globe className="h-4 w-4" aria-hidden />}

          />



          <Input

            label="Email *"

            type="email"

            variant="neu"

            value={config.email}

            className={jiraIntegrationInputClass}

            onChange={e => setConfig({ ...config, email: e.target.value })}

            placeholder="seu-email@exemplo.com"

            leftIcon={<Mail className="h-4 w-4" aria-hidden />}

          />



          <Input

            label="API Token *"

            type="password"

            variant="neu"

            value={config.apiToken}

            className={jiraIntegrationInputClass}

            onChange={e => setConfig({ ...config, apiToken: e.target.value })}

            placeholder="Seu API Token do Jira"
            leftIcon={<KeyRound className="h-4 w-4" aria-hidden />}
          />
          <p className={jiraIntegrationMutedXsClass}>
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className={jiraIntegrationLinkPillClass}
            >
              Como gerar um API Token?
            </a>
          </p>

          <div className={jiraIntegrationModalFooterClass}>

            <button type="button" onClick={() => setShowConfigModal(false)} className={leveViewOutlineBtnClass}>

              Cancelar

            </button>

            <button

              type="button"

              onClick={handleSaveConfig}

              disabled={isTesting}

              className={jiraIntegrationSaveBtnClass}

            >

              {isTesting ? (

                <>

                  <JiraNeuSpinner size="sm" />

                  Testando...

                </>

              ) : (

                'Salvar e Testar'

              )}

            </button>

          </div>

        </div>

      </Modal>

    </section>

    </div>

  );

};


