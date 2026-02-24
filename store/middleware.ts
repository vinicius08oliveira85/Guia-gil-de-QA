import { StateCreator } from 'zustand';
import { logger } from '../utils/logger';
import { autoBackupBeforeOperation } from '../services/backupService';
import { validateProjectIntegrity, validateAndFixProject } from '../utils/dataIntegrityService';
import { Project } from '../types';

/**
 * Middleware para logging de ações do store
 * Registra todas as mudanças de estado para debugging
 */
export const loggerMiddleware = <T extends object>(
  config: StateCreator<T>,
  name?: string
): StateCreator<T> => {
  return (set, get, api) => {
    const storeName = name || 'Store';

    return config(
      (...args) => {
        const result = set(...args);
        const newState = get();

        logger.debug(`[${storeName}] State updated`, 'Store', { state: newState });

        return result;
      },
      get,
      api
    );
  };
};

/**
 * Middleware para persistência no localStorage
 * Salva estado automaticamente quando há mudanças
 */
export const persistMiddleware = <T extends object>(
  config: StateCreator<T>,
  options: {
    name: string;
    include?: (keyof T)[];
    exclude?: (keyof T)[];
  }
): StateCreator<T> => {
  const storageKey = `store_${options.name}`;

  return (set, get, api) => {
    // Carregar estado inicial do localStorage
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Aplicar estado salvo antes de configurar o store
        Object.assign(get() as object, parsed);
      }
    } catch (error) {
      logger.warn(`Failed to load persisted state for ${options.name}`, 'Store', error);
    }

    return config(
      (...args) => {
        const result = set(...args);
        const newState = get();

        // Filtrar o que deve ser persistido
        let stateToPersist: Partial<T> = newState;

        if (options.include) {
          stateToPersist = {} as Partial<T>;
          options.include.forEach(key => {
            stateToPersist[key] = newState[key];
          });
        } else if (options.exclude) {
          stateToPersist = { ...newState };
          options.exclude.forEach(key => {
            delete stateToPersist[key];
          });
        }

        // Salvar no localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
        } catch (error) {
          logger.warn(`Failed to persist state for ${options.name}`, 'Store', error);
        }

        return result;
      },
      get,
      api
    );
  };
};

/**
 * Middleware de proteção que intercepta operações destrutivas
 * Cria backup automático e valida integridade antes de operações críticas
 */
export const protectionMiddleware = <T extends object>(
  config: StateCreator<T>,
  options: {
    isDestructiveOperation?: (state: T, newState: T) => boolean;
    getProjectFromState?: (state: T) => Project | undefined;
    getProjectId?: (state: T) => string | undefined;
  } = {}
): StateCreator<T> => {
  return (set, get, api) => {
    return config(
      (...args) => {
        const oldState = get();
        const result = set(...args);
        const newState = get();

        // Verificar se é operação destrutiva
        const isDestructive = options.isDestructiveOperation
          ? options.isDestructiveOperation(oldState, newState)
          : false;

        if (isDestructive && options.getProjectFromState && options.getProjectId) {
          const project = options.getProjectFromState(oldState);
          const projectId = options.getProjectId(oldState);

          if (project && projectId) {
            // Criar backup antes de operação destrutiva
            autoBackupBeforeOperation(projectId, 'DESTRUCTIVE_OPERATION', () =>
              options.getProjectFromState?.(get())
            ).catch((error: unknown) => {
              logger.warn(
                'Erro ao criar backup automático no middleware',
                'protectionMiddleware',
                error
              );
            });

            // Validar integridade do projeto após operação
            const newProject = options.getProjectFromState(newState);
            if (newProject) {
              try {
                const checkResult = validateProjectIntegrity(newProject);
                if (
                  !checkResult.isValid &&
                  checkResult.issues.some(issue => issue.severity === 'critical')
                ) {
                  logger.error(
                    `Problemas críticos de integridade detectados após operação destrutiva no projeto ${projectId}`,
                    'protectionMiddleware',
                    { issues: checkResult.issues }
                  );

                  // Tentar corrigir automaticamente
                  validateAndFixProject(newProject, projectId)
                    .then(fixResult => {
                      if (fixResult.restoredFromBackup) {
                        logger.info(
                          `Projeto ${projectId} restaurado do backup após problemas de integridade`,
                          'protectionMiddleware'
                        );
                      } else if (fixResult.wasFixed) {
                        logger.info(
                          `Problemas de integridade corrigidos automaticamente no projeto ${projectId}`,
                          'protectionMiddleware'
                        );
                      }
                    })
                    .catch((error: unknown) => {
                      logger.error(
                        'Erro ao tentar corrigir integridade',
                        'protectionMiddleware',
                        error
                      );
                    });
                }
              } catch (error: unknown) {
                logger.warn(
                  'Erro ao validar integridade no middleware',
                  'protectionMiddleware',
                  error
                );
              }
            }
          }
        }

        return result;
      },
      get,
      api
    );
  };
};
