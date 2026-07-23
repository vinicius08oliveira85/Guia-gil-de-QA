import React from 'react';
import { Save } from 'lucide-react';
import { JiraBrandIcon } from '../common/JiraBrandIcon';
import { useLandingWorkspaceActions } from '../../hooks/useLandingWorkspaceActions';
import { cn } from '../../utils/cn';
import { landingNeuActionBtnClass } from './landingNeuUi';
import { WorkspaceActionButton } from '../common/WorkspaceActionButton';

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
      <WorkspaceActionButton
        icon={<JiraBrandIcon className="h-4 w-4 shrink-0" />}
        label="Jira"
        onClick={() => void syncAllFromJira()}
        disabled={busy}
        className={cn(landingNeuActionBtnClass, 'group shrink-0')}
        isLoading={isSyncingJira}
        aria-label="Atualizar projetos QA, Dev e acompanhamentos do Jira"
        title="Atualizar tudo do Jira (Projetos QA, Dev e Acompanhamentos) e salvar no banco"
      />

      <WorkspaceActionButton
        icon={<Save className="h-4 w-4 shrink-0" aria-hidden />}
        label="Salvar"
        onClick={() => void saveAllToDatabase()}
        disabled={busy}
        className={cn(landingNeuActionBtnClass, 'group shrink-0')}
        isLoading={isSaving}
        aria-label="Salvar todos os dados no banco de dados"
        title="Salvar tudo no banco de dados (projetos, acompanhamentos, filtros, bloco de notas e preferências)"
      />
    </div>
  );
});

LandingWorkspaceActions.displayName = 'LandingWorkspaceActions';
