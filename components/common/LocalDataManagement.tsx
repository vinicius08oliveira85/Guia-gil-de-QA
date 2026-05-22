import React, { useRef, useState } from 'react';
import { Download, HardDrive, Upload } from 'lucide-react';
import { exportProjectsToBackup, importProjectsFromBackup } from '../../services/dbService';
import {
  exportLocalBackupViaFileSystemAccess,
  isFileSystemAccessBackupSupported,
  pickBackupJsonFileViaFileSystemAccess,
} from '../../services/fileSystemBackupService';
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

/**
 * Backup/import manual do IndexedDB — saída de emergência se a nuvem falhar.
 */
export const LocalDataManagement: React.FC<LocalDataManagementProps> = ({ onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [syncAfterImport, setSyncAfterImport] = useState(false);
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  const runImportFromFile = async (file: File) => {
    const result = await importProjectsFromBackup(file, {
      syncToSupabase: syncAfterImport,
    });
    if (result.imported === 0) {
      handleWarning('Nenhum projeto válido foi importado. Verifique o formato do arquivo.');
    } else {
      let msg = `${result.imported} projeto(s) importado(s) para o armazenamento local.`;
      if (syncAfterImport) {
        if (result.supabaseSynced > 0) {
          msg += ` ${result.supabaseSynced} enviado(s) ao Supabase.`;
        }
        if (result.supabaseSyncFailed > 0) {
          handleWarning(
            `${result.supabaseSyncFailed} projeto(s) não foram enviados ao Supabase (dados locais foram salvos).`
          );
        }
      }
      handleSuccess(msg);
      await onImportComplete?.();
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

  return (
    <div className="space-y-6">
      <div className={leveSettingsSectionRowClass}>
        <div className={leveSettingsSectionMainClass}>
          <div className={leveSettingsSectionIconWrapClass}>
            <HardDrive className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={leveSettingsSectionTitleClass}>Dados locais (IndexedDB)</h3>
            <p className={leveSettingsSectionSubtitleClass}>
              Exporte ou restaure todos os projetos deste dispositivo
            </p>
          </div>
        </div>
      </div>

      <div className={leveSettingsInsetPanelClass}>
        <p className={leveSettingsMutedTextClass}>
          Em navegadores compatíveis (Chrome, Edge), você escolhe onde salvar ou de qual arquivo
          carregar o JSON; nos demais, o navegador usa download e seletor de arquivo padrão. Útil
          quando o Supabase está indisponível ou para migrar de máquina. A importação substitui
          projetos com o mesmo ID.
        </p>

        <label className={cn(leveSettingsCheckboxPanelClass, 'mt-4 flex cursor-pointer items-start gap-3')}>
          <input
            type="checkbox"
            className="checkbox checkbox-sm mt-0.5 shrink-0 border-[color-mix(in_srgb,var(--leve-header-text)_20%,transparent)] [--chkbg:var(--leve-header-accent)]"
            checked={syncAfterImport}
            onChange={e => setSyncAfterImport(e.target.checked)}
            aria-describedby="sync-after-import-hint"
          />
          <span className="text-sm leading-snug text-[var(--leve-header-text)]">
            <span className={leveSettingsStrongTextClass}>Enviar ao Supabase após importar</span>
            <span
              id="sync-after-import-hint"
              className="mt-0.5 block text-[var(--leve-header-text-muted)]"
            >
              Opcional: só aplica se o Supabase estiver configurado. Útil para alinhar a nuvem com o
              backup restaurado; desmarque se quiser manter apenas cópia local.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(leveViewPrimaryBtnClass, 'gap-2')}
            onClick={handleExport}
            disabled={busy !== null}
          >
            <Download className="h-4 w-4" aria-hidden />
            {busy === 'export' ? 'Exportando…' : 'Exportar backup local'}
          </button>
          <button
            type="button"
            className={cn(leveViewOutlineBtnClass, 'gap-2')}
            onClick={handleImportClick}
            disabled={busy !== null}
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
