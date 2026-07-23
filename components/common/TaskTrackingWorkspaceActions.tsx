import React, { useCallback, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import {
  appNeuActionBtnClass,
  appNeuActionTrackWrapClass,
} from './workspaceChromeActionUi';
import { projectChromeSyncBtnClass, projectChromeToolbarDividerClass } from '../tasks/tasksPanelNeuStyles';
import { JiraBrandIcon } from './JiraBrandIcon';
import { WorkspaceActionButton } from './WorkspaceActionButton';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  readTaskTrackingSnapshot,
  normalizeTaskTrackingBackup,
  restoreTaskTrackingFromBackup,
} from '../../services/taskTrackingStorage';
import { Download, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export interface TaskTrackingWorkspaceActionsProps {
  variant: 'toolbar' | 'inline';
  onSave: () => void | Promise<void>;
  onJiraSync: () => void;
  isSaving?: boolean;
  isJiraSyncing?: boolean;
  jiraDisabled?: boolean;
  jiraTitle?: string;
  className?: string;
}

function downloadTaskTrackingJson(): void {
  const snapshot = readTaskTrackingSnapshot();
  const payload = {
    version: 2,
    taskTracking: snapshot,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `acompanhamento-jira_${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const TaskTrackingWorkspaceActions: React.FC<TaskTrackingWorkspaceActionsProps> = ({
  variant,
  onSave,
  onJiraSync,
  isSaving = false,
  isJiraSyncing = false,
  jiraDisabled = false,
  jiraTitle = 'Atualizar tudo do Jira (Projetos QA, Dev e Acompanhamentos) e salvar no banco',
  className,
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const busy = isSaving || isJiraSyncing || isImporting;
  const btnCls = variant === 'toolbar' ? projectChromeSyncBtnClass : appNeuActionBtnClass;

  const handleExport = useCallback(() => {
    try {
      downloadTaskTrackingJson();
      toast.success('Acompanhamento exportado.');
    } catch (error) {
      handleError(error, 'Exportar acompanhamento');
    }
  }, [handleError]);

  const handleImportFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const raw =
          parsed && typeof parsed === 'object' && 'taskTracking' in parsed
            ? (parsed as { taskTracking: unknown }).taskTracking
            : parsed;
        const normalized = normalizeTaskTrackingBackup(raw);
        if (!normalized) {
          throw new Error('Arquivo inválido ou sem dados de acompanhamento.');
        }
        const ok = restoreTaskTrackingFromBackup(normalized);
        if (!ok) {
          throw new Error('Não foi possível restaurar o acompanhamento.');
        }
        handleSuccess('Acompanhamento importado. Recarregue a página se os dados não atualizarem.');
      } catch (error) {
        handleError(error, 'Importar acompanhamento');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [handleError, handleSuccess]
  );

  return (
    <div
      className={cn(
        variant === 'toolbar'
          ? 'flex flex-wrap items-center gap-0'
          : cn(appNeuActionTrackWrapClass, 'shrink-0'),
        className
      )}
      role="toolbar"
      aria-label="Ações do acompanhamento"
      onClick={e => e.stopPropagation()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
        }}
      />

      <WorkspaceActionButton
        icon={<Save className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        label="Salvar"
        onClick={() => void onSave()}
        disabled={busy}
        className={btnCls}
        isLoading={isSaving}
        labelVisibility={variant === 'inline' ? 'inline' : 'toolbar'}
        aria-label="Salvar todos os dados no banco de dados"
        title="Salvar tudo no banco de dados (projetos, acompanhamentos, filtros, bloco de notas e preferências)"
      />

      <WorkspaceActionButton
        icon={<Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        label="Importar"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        className={btnCls}
        isLoading={isImporting}
        labelVisibility={variant === 'inline' ? 'inline' : 'toolbar'}
        aria-label="Importar acompanhamento"
        title="Importar backup deste acompanhamento"
      />

      <WorkspaceActionButton
        icon={<Download className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        label="Exportar"
        onClick={handleExport}
        disabled={busy}
        className={btnCls}
        labelVisibility={variant === 'inline' ? 'inline' : 'toolbar'}
        aria-label="Exportar acompanhamento"
        title="Exportar dados deste acompanhamento"
      />

      {variant === 'toolbar' ? <span className={projectChromeToolbarDividerClass} aria-hidden /> : null}

      <WorkspaceActionButton
        icon={<JiraBrandIcon className="h-3.5 w-3.5 shrink-0" />}
        label="Jira"
        onClick={onJiraSync}
        disabled={busy || jiraDisabled}
        className={btnCls}
        isLoading={isJiraSyncing}
        labelVisibility={variant === 'inline' ? 'inline' : 'toolbar'}
        aria-label="Atualizar tarefas do Jira"
        title={jiraTitle}
      />
    </div>
  );
};

TaskTrackingWorkspaceActions.displayName = 'TaskTrackingWorkspaceActions';
