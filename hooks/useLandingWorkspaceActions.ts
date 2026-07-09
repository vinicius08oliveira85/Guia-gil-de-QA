import { useCallback, useState } from 'react';
import { getJiraConfig } from '../services/jiraService';
import {
  isJiraAutoSyncRunning,
  runJiraAutoSync,
  syncAllJiraProjects,
} from '../services/jira/jiraAutoSync';
import { runFilasSelectionSync } from '../services/jira/filasSyncRunner';
import { saveAllWorkspaceData } from '../services/localSaveService';
import { useProjectsStore } from '../store/projectsStore';
import { useErrorHandler } from './useErrorHandler';

export interface UseLandingWorkspaceActionsState {
  syncAllFromJira: () => Promise<void>;
  saveAllToDatabase: () => Promise<void>;
  isSyncingJira: boolean;
  isSaving: boolean;
}

/**
 * Ações globais da home: atualizar tudo do Jira e salvar o workspace no banco local.
 */
export function useLandingWorkspaceActions(): UseLandingWorkspaceActionsState {
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();
  const [isSyncingJira, setIsSyncingJira] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const syncAllFromJira = useCallback(async () => {
    if (!getJiraConfig()) {
      handleWarning('Configure o Jira em Configurações antes de atualizar.');
      return;
    }
    if (isJiraAutoSyncRunning()) {
      handleWarning('Aguarde a sincronização em andamento.');
      return;
    }

    setIsSyncingJira(true);
    try {
      const autoSummary = await runJiraAutoSync();
      if (autoSummary) {
        const parts: string[] = [];
        if (autoSummary.projectsSynced > 0) {
          parts.push(`${autoSummary.projectsSynced} projeto(s) QA/Dev`);
        }
        if (autoSummary.filasSynced && autoSummary.filasTaskCount > 0) {
          parts.push(`${autoSummary.filasTaskCount} tarefa(s) de acompanhamento`);
        }
        if (parts.length > 0) {
          handleSuccess(`Jira atualizado: ${parts.join(' e ')}.`);
          return;
        }
        handleSuccess('Atualização concluída. Nenhuma alteração encontrada no Jira.');
        return;
      }

      const projectsSynced = await syncAllJiraProjects({ silent: true });
      const filasOutcome = await runFilasSelectionSync();
      const parts: string[] = [];

      if (projectsSynced > 0) {
        parts.push(`${projectsSynced} projeto(s) QA/Dev`);
      }
      if (filasOutcome.status === 'success') {
        parts.push(`${filasOutcome.result.tasks.length} tarefa(s) de acompanhamento`);
      } else if (filasOutcome.status === 'skipped') {
        if (filasOutcome.reason === 'no-selection') {
          handleSuccess(
            projectsSynced > 0
              ? `${projectsSynced} projeto(s) atualizado(s). Nenhuma fila selecionada em Acompanhamento.`
              : 'Nenhuma fila selecionada em Acompanhamento para atualizar.'
          );
          return;
        }
        if (filasOutcome.reason === 'no-config') {
          handleWarning('Configure o Jira em Configurações antes de atualizar.');
          return;
        }
      } else if (filasOutcome.status === 'error') {
        handleError(filasOutcome.error, 'Atualizar acompanhamento do Jira');
        return;
      }

      if (parts.length > 0) {
        handleSuccess(`Jira atualizado: ${parts.join(' e ')}.`);
      } else {
        handleSuccess('Atualização concluída. Nenhuma alteração encontrada no Jira.');
      }
    } catch (error) {
      handleError(error, 'Atualizar do Jira');
    } finally {
      setIsSyncingJira(false);
    }
  }, [handleError, handleSuccess, handleWarning]);

  const saveAllToDatabase = useCallback(async () => {
    setIsSaving(true);
    try {
      const projects = useProjectsStore.getState().projects;
      const { projectsSaved, folderResult } = await saveAllWorkspaceData(projects);

      const parts: string[] = [
        `${projectsSaved} projeto(s) QA/Dev salvos no banco local`,
        'acompanhamento, filtros e preferências incluídos no backup',
      ];

      if (folderResult === 'saved') {
        parts.push('espelho gravado na pasta de backup');
      } else if (folderResult === 'no_folder') {
        parts.push('configure uma pasta em Configurações → Dados locais para espelhar no disco');
      } else if (folderResult === 'permission_denied') {
        handleWarning(
          'Dados salvos localmente, mas a permissão da pasta de backup expirou. Reautorize em Configurações → Dados locais.'
        );
        return;
      }

      handleSuccess(`${parts.join('; ')}.`);
    } catch (error) {
      handleError(error, 'Salvar workspace');
    } finally {
      setIsSaving(false);
    }
  }, [handleError, handleSuccess, handleWarning]);

  return {
    syncAllFromJira,
    saveAllToDatabase,
    isSyncingJira,
    isSaving,
  };
}
