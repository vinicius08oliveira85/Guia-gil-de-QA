import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { JiraBrandIcon } from '../common/JiraBrandIcon';
import { useLandingWorkspaceActions } from '../../hooks/useLandingWorkspaceActions';
import { cn } from '../../utils/cn';
import { landingNeuActionBtnClass } from './landingNeuUi';

/**
 * Botões globais da home: atualizar tudo do Jira e salvar o workspace no banco de dados.
 */
export const LandingWorkspaceActions = React.memo(() => {
  const { syncAllFromJira, saveAllToDatabase, isSyncingJira, isSaving } =
    useLandingWorkspaceActions();

  const busy = isSyncingJira || isSaving;

  return (
    <div
      className="flex shrink-0 items-center gap-2"
      role="toolbar"
      aria-label="Ações globais do workspace"
    >
      <button
        type="button"
        onClick={() => void syncAllFromJira()}
        disabled={busy}
        className={cn(landingNeuActionBtnClass, 'group shrink-0')}
        aria-label="Atualizar projetos QA, Dev e acompanhamentos do Jira"
        title="Atualizar tudo do Jira (Projetos QA, Dev e Acompanhamentos) e salvar no banco"
      >
        {isSyncingJira ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <JiraBrandIcon className="h-4 w-4 shrink-0" />
        )}
        <span className="hidden sm:inline">Jira</span>
      </button>

      <button
        type="button"
        onClick={() => void saveAllToDatabase()}
        disabled={busy}
        className={cn(landingNeuActionBtnClass, 'group shrink-0')}
        aria-label="Salvar todos os dados no banco de dados"
        title="Salvar tudo no banco de dados (projetos, acompanhamentos, filtros, bloco de notas e preferências)"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="hidden sm:inline">Salvar</span>
      </button>
    </div>
  );
});

LandingWorkspaceActions.displayName = 'LandingWorkspaceActions';
