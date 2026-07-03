import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, HardDrive, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import { exportProjectsToBackup, importProjectsFromBackup } from '../../services/dbService';
import { formatAppStateRestoreMessage } from '../../services/appStateRestoreService';
import {
  exportLocalBackupViaFileSystemAccess,
  isFileSystemAccessBackupSupported,
  pickBackupJsonFileViaFileSystemAccess,
} from '../../services/fileSystemBackupService';
import {
  clearConfiguredFolder,
  getLocalFolderBackupPrefs,
  isLocalFolderAutoSyncEnabled,
  isLocalFolderBackupSupported,
  LOCAL_FOLDER_BACKUP_FILENAME,
  LOCAL_FOLDER_CONFIG_UPDATED_EVENT,
  pickBackupFolder,
  readBackupFromFolder,
  setLocalFolderAutoSyncEnabled,
  writeBackupToFolder,
  type LocalFolderBackupPrefs,
} from '../../services/localFolderBackupService';
import {
  FOLDER_BACKUP_AVAILABLE_EVENT,
  formatBackupSummaryForPrompt,
  formatRestoreResultMessage,
  isLocalDataEffectivelyEmpty,
  parseBackupFile,
  restoreFromConfiguredFolder,
  type BackupFileSummary,
  type FolderBackupAvailableDetail,
} from '../../services/localFolderRestoreService';
import { ConfirmDialog } from './ConfirmDialog';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  leveSettingsCheckboxPanelClass,
  leveSettingsInsetPanelClass,
  leveSettingsMutedTextClass,
  leveSettingsSectionIconWrapClass,
  leveSettingsSectionMainClass,
  leveSettingsSectionRowClass,
  leveSettingsSectionSubtitleClass,
  leveSettingsSectionTitleClass,
  leveSettingsStrongTextClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
} from './projectCardUi';
import { cn } from '../../utils/cn';

export interface LocalDataManagementProps {
  /** Chamado após importação bem-sucedida (ex.: recarregar lista no store). */
  onImportComplete?: () => void | Promise<void>;
}

function formatSyncTimestamp(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

type FolderRestoreConfirmState =
  | { mode: 'pick'; folderLabel: string; summary: BackupFileSummary }
  | { mode: 'manual'; summary: BackupFileSummary | null; localNotEmpty: boolean };

/**
 * Backup/import manual do IndexedDB.
 */
export const LocalDataManagement: React.FC<LocalDataManagementProps> = ({ onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<
    'export' | 'import' | 'folder-pick' | 'folder-save' | 'folder-restore' | null
  >(null);
  const [folderPrefs, setFolderPrefs] = useState<LocalFolderBackupPrefs>({
    autoSyncEnabled: isLocalFolderAutoSyncEnabled(),
    folderLabel: null,
    lastSyncAt: null,
    lastRestoreAt: null,
    lastSyncError: null,
    hasConfiguredFolder: false,
  });
  const [restoreConfirm, setRestoreConfirm] = useState<FolderRestoreConfirmState | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  const folderSupported = isLocalFolderBackupSupported();

  const refreshFolderPrefs = useCallback(async () => {
    const prefs = await getLocalFolderBackupPrefs();
    setFolderPrefs(prefs);
  }, []);

  useEffect(() => {
    void refreshFolderPrefs();
    const onConfigUpdated = () => {
      void refreshFolderPrefs();
    };
    window.addEventListener(LOCAL_FOLDER_CONFIG_UPDATED_EVENT, onConfigUpdated);
    return () => window.removeEventListener(LOCAL_FOLDER_CONFIG_UPDATED_EVENT, onConfigUpdated);
  }, [refreshFolderPrefs]);

  useEffect(() => {
    const onBackupAvailable = (event: Event) => {
      const detail = (event as CustomEvent<FolderBackupAvailableDetail>).detail;
      if (!detail) return;
      setRestoreConfirm({
        mode: 'pick',
        folderLabel: detail.folderLabel,
        summary: detail.summary,
      });
    };
    window.addEventListener(FOLDER_BACKUP_AVAILABLE_EVENT, onBackupAvailable);
    return () => window.removeEventListener(FOLDER_BACKUP_AVAILABLE_EVENT, onBackupAvailable);
  }, []);

  const runImportFromFile = async (file: File) => {
    const result = await importProjectsFromBackup(file);
    const hasProjects = result.imported > 0;
    const hasTaskTracking = result.taskTrackingTasksRestored > 0;
    const hasAppState = result.appStateRestored;

    if (!hasProjects && !hasTaskTracking && !hasAppState) {
      handleWarning('Nenhum dado válido foi importado. Verifique o formato do arquivo.');
      return;
    }

    const parts: string[] = [];
    if (hasProjects) {
      parts.push(`${result.imported} projeto(s) importado(s) para o armazenamento local`);
    }
    if (hasTaskTracking) {
      parts.push(
        `acompanhamento de tarefas restaurado (${result.taskTrackingTasksRestored} tarefa(s))`
      );
    }
    if (hasAppState && result.appStateSummary) {
      const configMsg = formatAppStateRestoreMessage(result.appStateSummary);
      if (configMsg) parts.push(configMsg.replace(/\.$/, ''));
    }
    handleSuccess(`${parts.join('; ')}.`);
    await onImportComplete?.();
  };

  const executeFolderRestore = async () => {
    setRestoreLoading(true);
    try {
      const outcome = await restoreFromConfiguredFolder();
      if (outcome.status === 'success') {
        handleSuccess(formatRestoreResultMessage(outcome.result));
        await onImportComplete?.();
        await refreshFolderPrefs();
        setRestoreConfirm(null);
        return;
      }
      if (outcome.status === 'no_permission') {
        handleWarning(
          'Permissão da pasta expirou. Clique em "Salvar agora" para reautorizar o acesso.'
        );
        return;
      }
      if (outcome.status === 'empty_backup') {
        handleWarning('O arquivo de backup na pasta não contém dados válidos.');
        return;
      }
      if (outcome.status === 'no_folder') {
        handleWarning('Nenhuma pasta configurada. Escolha uma pasta primeiro.');
        return;
      }
      handleError(new Error('Não foi possível restaurar o backup da pasta.'), 'Restaurar da pasta');
    } catch (error) {
      handleError(error, 'Restaurar da pasta');
    } finally {
      setRestoreLoading(false);
      setBusy(null);
    }
  };

  const handleRestoreFromFolderClick = async () => {
    setBusy('folder-restore');
    try {
      const localEmpty = await isLocalDataEffectivelyEmpty();
      if (localEmpty) {
        await executeFolderRestore();
        return;
      }
      setRestoreConfirm({ mode: 'manual', summary: null, localNotEmpty: true });
    } catch (error) {
      handleError(error, 'Restaurar da pasta');
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      if (isFileSystemAccessBackupSupported()) {
        const outcome = await exportLocalBackupViaFileSystemAccess();
        if (outcome === 'saved') {
          handleSuccess('Backup salvo no local que você escolheu (JSON).');
          return;
        }
        if (outcome === 'cancelled') {
          return;
        }
      }
      await exportProjectsToBackup();
      handleSuccess(
        isFileSystemAccessBackupSupported()
          ? 'Backup exportado via download do navegador.'
          : 'Backup local exportado. Guarde o arquivo JSON em local seguro.'
      );
    } catch (error) {
      handleError(error, 'Exportar backup local');
    } finally {
      setBusy(null);
    }
  };

  const handleImportClick = async () => {
    if (!isFileSystemAccessBackupSupported()) {
      fileInputRef.current?.click();
      return;
    }

    setBusy('import');
    try {
      const result = await pickBackupJsonFileViaFileSystemAccess();
      if (result.status === 'unsupported' || result.status === 'cancelled') {
        if (result.status === 'unsupported') {
          fileInputRef.current?.click();
        }
        return;
      }
      await runImportFromFile(result.file);
    } catch (error) {
      handleError(error, 'Importar backup local');
    } finally {
      setBusy(null);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy('import');
    try {
      await runImportFromFile(file);
    } catch (error) {
      handleError(error, 'Importar backup local');
    } finally {
      setBusy(null);
    }
  };

  const handlePickFolder = async () => {
    setBusy('folder-pick');
    try {
      const result = await pickBackupFolder();
      if (result.status === 'unsupported') {
        handleWarning(
          'Seu navegador não suporta pasta fixa. Use Chrome ou Edge, ou exporte manualmente.'
        );
        return;
      }
      if (result.status === 'cancelled') {
        return;
      }

      handleSuccess(`Pasta configurada: ${result.folderLabel}`);

      if (result.existingBackup && (await isLocalDataEffectivelyEmpty())) {
        const file = await readBackupFromFolder();
        if (file) {
          const summary = await parseBackupFile(file);
          if (summary) {
            setRestoreConfirm({
              mode: 'pick',
              folderLabel: result.folderLabel,
              summary,
            });
            await refreshFolderPrefs();
            return;
          }
        }
      }

      const saveResult = await writeBackupToFolder();
      if (saveResult === 'saved') {
        handleSuccess(`Backup inicial gravado em ${LOCAL_FOLDER_BACKUP_FILENAME}.`);
      }
      await refreshFolderPrefs();
    } catch (error) {
      handleError(error, 'Escolher pasta de backup');
    } finally {
      setBusy(null);
    }
  };

  const handleSaveToFolderNow = async () => {
    setBusy('folder-save');
    try {
      const result = await writeBackupToFolder();
      if (result === 'saved') {
        handleSuccess(`Backup salvo na pasta (${LOCAL_FOLDER_BACKUP_FILENAME}).`);
      } else if (result === 'no_folder') {
        handleWarning('Nenhuma pasta configurada. Escolha uma pasta primeiro.');
      } else if (result === 'permission_denied') {
        handleWarning(
          'Permissão negada para gravar na pasta. Tente novamente e autorize o acesso.'
        );
      } else if (result === 'unsupported') {
        handleWarning('Pasta fixa não suportada neste navegador.');
      }
      await refreshFolderPrefs();
    } catch (error) {
      handleError(error, 'Salvar backup na pasta');
    } finally {
      setBusy(null);
    }
  };

  const handleClearFolder = async () => {
    try {
      await clearConfiguredFolder();
      handleSuccess('Pasta de backup desvinculada.');
      await refreshFolderPrefs();
    } catch (error) {
      handleError(error, 'Desvincular pasta');
    }
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    setLocalFolderAutoSyncEnabled(enabled);
    setFolderPrefs(prev => ({ ...prev, autoSyncEnabled: enabled }));
  };

  const handleConfirmRestore = () => {
    setBusy('folder-restore');
    void executeFolderRestore();
  };

  const lastSyncLabel = formatSyncTimestamp(folderPrefs.lastSyncAt);
  const lastRestoreLabel = formatSyncTimestamp(folderPrefs.lastRestoreAt);
  const isBusy = busy !== null;

  const restoreDialogMessage =
    restoreConfirm?.mode === 'pick'
      ? `A pasta "${restoreConfirm.folderLabel}" contém um backup com ${formatBackupSummaryForPrompt(restoreConfirm.summary)}. Deseja restaurar esses dados agora?`
      : restoreConfirm?.mode === 'manual'
        ? 'Restaurar da pasta substituirá projetos com o mesmo ID e sobrescreverá configurações salvas no arquivo de backup. Deseja continuar?'
        : '';

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={restoreConfirm !== null}
        onClose={() => {
          setRestoreConfirm(null);
          setBusy(null);
        }}
        onConfirm={handleConfirmRestore}
        title={
          restoreConfirm?.mode === 'pick'
            ? 'Restaurar backup da pasta?'
            : 'Substituir dados locais?'
        }
        message={restoreDialogMessage}
        confirmText="Restaurar"
        cancelText="Cancelar"
        variant={restoreConfirm?.mode === 'manual' ? 'warning' : 'info'}
        isLoading={restoreLoading}
      />

      <div className={leveSettingsSectionRowClass}>
        <div className={leveSettingsSectionMainClass}>
          <div className={leveSettingsSectionIconWrapClass}>
            <HardDrive className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={leveSettingsSectionTitleClass}>Dados locais</h3>
            <p className={leveSettingsSectionSubtitleClass}>
              Exporte ou restaure o backup completo deste dispositivo (projetos, filas Jira,
              preferências e credenciais)
            </p>
          </div>
        </div>
      </div>

      <div className={leveSettingsInsetPanelClass}>
        <div className="flex items-start gap-3">
          <div className={cn(leveSettingsSectionIconWrapClass, 'h-10 w-10 shrink-0')}>
            <FolderOpen className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={leveSettingsStrongTextClass}>Pasta de backup automático</h4>
            <p className={cn(leveSettingsMutedTextClass, 'mt-1')}>
              Escolha uma pasta fixa no computador. O app grava automaticamente{' '}
              <code className="font-mono text-xs">{LOCAL_FOLDER_BACKUP_FILENAME}</code> com todos os
              projetos, acompanhamento de Filas Jira, preferências, workspace, credenciais e cache
              de IA. O IndexedDB continua sendo a fonte principal; a pasta é um espelho legível no
              disco. Ao reabrir o app, confirme o diálogo de restauração ou use{' '}
              <strong className={leveSettingsStrongTextClass}>Restaurar da pasta</strong>.
            </p>
            {!folderSupported && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300" role="status">
                Pasta fixa requer Chrome ou Edge. Nos demais navegadores, use o export manual abaixo.
              </p>
            )}
            {folderPrefs.hasConfiguredFolder ? (
              <p className="mt-2 text-sm text-[var(--leve-header-text)]" role="status">
                Pasta atual:{' '}
                <span className={leveSettingsStrongTextClass}>
                  {folderPrefs.folderLabel ?? '(sem nome)'}
                </span>
                {lastSyncLabel ? (
                  <span className="mt-0.5 block text-[var(--leve-header-text-muted)]">
                    Última gravação: {lastSyncLabel}
                  </span>
                ) : null}
                {lastRestoreLabel ? (
                  <span className="mt-0.5 block text-[var(--leve-header-text-muted)]">
                    Última restauração: {lastRestoreLabel}
                  </span>
                ) : null}
                {folderPrefs.lastSyncError ? (
                  <span className="mt-0.5 block text-amber-700 dark:text-amber-300">
                    {folderPrefs.lastSyncError}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--leve-header-text-muted)]" role="status">
                Nenhuma pasta configurada.
              </p>
            )}
          </div>
        </div>

        <label
          className={cn(leveSettingsCheckboxPanelClass, 'mt-4 flex cursor-pointer items-start gap-3')}
        >
          <input
            type="checkbox"
            className="checkbox checkbox-sm mt-0.5 shrink-0 border-[color-mix(in_srgb,var(--leve-header-text)_20%,transparent)] [--chkbg:var(--leve-header-accent)]"
            checked={folderPrefs.autoSyncEnabled}
            onChange={e => handleAutoSyncToggle(e.target.checked)}
            disabled={!folderSupported || !folderPrefs.hasConfiguredFolder}
            aria-describedby="auto-sync-folder-hint"
          />
          <span className="text-sm leading-snug text-[var(--leve-header-text)]">
            <span className={leveSettingsStrongTextClass}>
              Sincronizar automaticamente com a pasta
            </span>
            <span
              id="auto-sync-folder-hint"
              className="mt-0.5 block text-[var(--leve-header-text-muted)]"
            >
              Após mudanças nos projetos ou nas configurações (Jira, chaves Gemini, preferências), o
              backup é regravado na pasta em até cerca de 1 minuto. Configurações também são
              gravadas imediatamente quando possível.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(leveViewPrimaryBtnClass, 'gap-2')}
            onClick={handlePickFolder}
            disabled={isBusy || !folderSupported}
            aria-label={
              folderPrefs.hasConfiguredFolder ? 'Alterar pasta de backup' : 'Escolher pasta de backup'
            }
          >
            <FolderOpen className="h-4 w-4" aria-hidden />
            {busy === 'folder-pick'
              ? 'Abrindo…'
              : folderPrefs.hasConfiguredFolder
                ? 'Alterar pasta'
                : 'Escolher pasta'}
          </button>
          <button
            type="button"
            className={cn(leveViewOutlineBtnClass, 'gap-2')}
            onClick={handleSaveToFolderNow}
            disabled={isBusy || !folderPrefs.hasConfiguredFolder}
            aria-label="Salvar backup agora na pasta configurada"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {busy === 'folder-save' ? 'Salvando…' : 'Salvar agora'}
          </button>
          {folderPrefs.hasConfiguredFolder ? (
            <>
              <button
                type="button"
                className={cn(leveViewOutlineBtnClass, 'gap-2')}
                onClick={handleRestoreFromFolderClick}
                disabled={isBusy}
                aria-label="Restaurar backup da pasta configurada"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {busy === 'folder-restore' ? 'Restaurando…' : 'Restaurar da pasta'}
              </button>
              <button
                type="button"
                className={cn(leveViewOutlineBtnClass, 'gap-2')}
                onClick={handleClearFolder}
                disabled={isBusy}
                aria-label="Desvincular pasta de backup"
              >
                Desvincular pasta
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className={leveSettingsInsetPanelClass}>
        <h4 className={leveSettingsStrongTextClass}>Exportar / importar manual</h4>
        <p className={cn(leveSettingsMutedTextClass, 'mt-1')}>
          Em navegadores compatíveis (Chrome, Edge), você escolhe onde salvar ou de qual arquivo
          carregar o JSON; nos demais, o navegador usa download e seletor de arquivo padrão. O backup
          inclui projetos (IndexedDB), Acompanhamento de Tarefas, credenciais Jira, chaves Gemini,
          preferências, filtros, workspace e cache de IA. A importação substitui projetos com o mesmo
          ID e restaura configurações salvas no arquivo (formato v3). Backups antigos sem{' '}
          <code className="font-mono text-xs">appState</code> não trazem credenciais — exporte
          novamente para incluí-las.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(leveViewPrimaryBtnClass, 'gap-2')}
            onClick={handleExport}
            disabled={isBusy}
          >
            <Download className="h-4 w-4" aria-hidden />
            {busy === 'export' ? 'Exportando…' : 'Exportar backup local'}
          </button>
          <button
            type="button"
            className={cn(leveViewOutlineBtnClass, 'gap-2')}
            onClick={handleImportClick}
            disabled={isBusy}
          >
            <Upload className="h-4 w-4" aria-hidden />
            {busy === 'import' ? 'Importando…' : 'Importar backup local'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Selecionar arquivo JSON de backup"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

LocalDataManagement.displayName = 'LocalDataManagement';
