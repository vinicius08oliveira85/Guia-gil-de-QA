import React, { useRef, useState } from 'react';
import { Download, HardDrive, Upload } from 'lucide-react';
import { exportProjectsToBackup, importProjectsFromBackup } from '../../services/dbService';
import { useErrorHandler } from '../../hooks/useErrorHandler';

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
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  const handleExport = async () => {
    setBusy('export');
    try {
      await exportProjectsToBackup();
      handleSuccess('Backup local exportado. Guarde o arquivo JSON em local seguro.');
    } catch (error) {
      handleError(error, 'Exportar backup local');
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
      const count = await importProjectsFromBackup(file);
      if (count === 0) {
        handleWarning('Nenhum projeto válido foi importado. Verifique o formato do arquivo.');
      } else {
        handleSuccess(`${count} projeto(s) importado(s) para o armazenamento local.`);
        await onImportComplete?.();
      }
    } catch (error) {
      handleError(error, 'Importar backup local');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-base-300 bg-base-200/40 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <HardDrive className="h-8 w-8 shrink-0 text-primary mt-0.5" aria-hidden />
        <div>
          <h3 className="text-lg font-semibold text-base-content">Dados locais (IndexedDB)</h3>
          <p className="text-sm text-base-content/70 mt-1 leading-relaxed">
            Exporte ou restaure todos os projetos deste dispositivo. Útil quando o Supabase está
            indisponível ou para migrar de máquina. A importação substitui projetos com o mesmo ID.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline btn-primary gap-2"
          onClick={handleExport}
          disabled={busy !== null}
        >
          <Download className="h-4 w-4" aria-hidden />
          {busy === 'export' ? 'Exportando…' : 'Exportar backup local'}
        </button>
        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={() => fileInputRef.current?.click()}
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
  );
};

LocalDataManagement.displayName = 'LocalDataManagement';
