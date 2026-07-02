import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, HardDrive, RefreshCw, Upload } from 'lucide-react';
import { exportProjectsToBackup, importProjectsFromBackup } from '../../services/dbService';
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
  setLocalFolderAutoSyncEnabled,
  writeBackupToFolder,
  type LocalFolderBackupPrefs,
} from '../../services/localFolderBackupService';
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

/**
 * Backup/import manual do IndexedDB.
 */
export const LocalDataManagement: React.FC<LocalDataManagementProps> = ({ onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | 'folder-pick' | 'folder-save' | null>(
    null
  );
  const [folderPrefs, setFolderPrefs] = useState<LocalFolderBackupPrefs>({
    autoSyncEnabled: isLocalFolderAutoSyncEnabled(),
    folderLabel: null,
    lastSyncAt: null,
    lastSyncError: null,
    hasConfiguredFolder: false,
  });
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

  const runImportFromFile = async (file: File) => {
    const result = await importProjectsFromBackup(file);
    const hasProjects = result.imported > 0;
    const hasTaskTracking = result.taskTrackingTasksRestored > 0;

    if (!hasProjects && !hasTaskTracking) {
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
    let msg = `${parts.join('; ')}.`;
    handleSuccess(msg);
    await onImportComplete?.();
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

  const lastSyncLabel = formatSyncTimestamp(folderPrefs.lastSyncAt);
  const isBusy = busy !== null;

  return (
    <div className="space-y-6">
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
              disco.
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
              Após mudanças nos projetos ou no Acompanhamento de Tarefas, o backup é regravado na
              pasta em até cerca de 1 minuto.
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
            <button
              type="button"
              className={cn(leveViewOutlineBtnClass, 'gap-2')}
              onClick={handleClearFolder}
              disabled={isBusy}
              aria-label="Desvincular pasta de backup"
            >
              Desvincular pasta
            </button>
          ) : null}
        </div>
      </div>

      <div className={leveSettingsInsetPanelClass}>
        <h4 className={leveSettingsStrongTextClass}>Exportar / importar manual</h4>
        <p className={cn(leveSettingsMutedTextClass, 'mt-1')}>
          Em navegadores compatíveis (Chrome, Edge), você escolhe onde salvar ou de qual arquivo
          carregar o JSON; nos demais, o navegador usa download e seletor de arquivo padrão. O backup
          inclui todos os projetos (IndexedDB) e o Acompanhamento de Tarefas — tarefas importadas das
          filas Jira, projeto/fila selecionados e janela de SLA. A importação substitui projetos com
          o mesmo ID e restaura o acompanhamento salvo no arquivo.
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
