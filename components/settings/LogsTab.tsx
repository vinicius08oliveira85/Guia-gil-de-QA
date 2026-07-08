import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, ScrollText, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  APP_LOGS_UPDATED_EVENT,
  clearAppLogs,
  exportAppLogsJson,
  getAppLogs,
  isAppLogCaptureEnabled,
  isAppLogDebugEnabled,
  setAppLogCaptureEnabled,
  setAppLogDebugEnabled,
  type AppLogEntry,
  type AppLogLevel,
} from '../../utils/appLogStore';
import { cn } from '../../utils/cn';
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
} from '../common/projectCardUi';

type LevelFilter = 'all' | AppLogLevel;

const LEVEL_OPTIONS: { id: LevelFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'error', label: 'Erros' },
  { id: 'warn', label: 'Avisos' },
  { id: 'info', label: 'Info' },
  { id: 'success', label: 'Sucesso' },
  { id: 'debug', label: 'Debug' },
];

const LEVEL_BADGE_CLASS: Record<AppLogLevel, string> = {
  error:
    'bg-[color-mix(in_srgb,#e54b4f_18%,transparent)] text-[#e54b4f] border-[color-mix(in_srgb,#e54b4f_35%,transparent)]',
  warn: 'bg-[color-mix(in_srgb,#f5a623_18%,transparent)] text-[#c47d00] border-[color-mix(in_srgb,#f5a623_35%,transparent)]',
  info: 'bg-primary/12 text-primary border-primary/30',
  success:
    'bg-[color-mix(in_srgb,#22c55e_15%,transparent)] text-[#15803d] border-[color-mix(in_srgb,#22c55e_35%,transparent)]',
  debug:
    'bg-base-content/12 text-base-content/72 border-base-content/25',
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

function formatDataPreview(data: unknown): string {
  try {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
  } catch {
    return String(data);
  }
}

interface LogRowProps {
  entry: AppLogEntry;
}

const LogRow: React.FC<LogRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        leveSettingsInsetPanelClass,
        'border border-base-content/15 p-3'
      )}
    >
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={cn(
            'inline-flex shrink-0 rounded-full border px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide',
            LEVEL_BADGE_CLASS[entry.level]
          )}
        >
          {entry.level}
        </span>
        {entry.context ? (
          <span className="font-mono text-xs text-base-content/72">
            [{entry.context}]
          </span>
        ) : null}
        <span className="ml-auto font-sans text-xs text-base-content/72">
          {formatTimestamp(entry.timestamp)}
        </span>
      </div>
      <p className="mt-2 font-sans text-sm text-base-content">{entry.message}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="font-sans text-[10px] uppercase tracking-wide text-base-content/72">
          origem: {entry.source}
        </span>
        {entry.data !== undefined ? (
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => setExpanded(prev => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Ocultar detalhes do log' : 'Expandir detalhes do log'}
          >
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
        ) : null}
      </div>
      {expanded && entry.data !== undefined ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-base-300/25 p-2 font-mono text-xs text-base-content/72">
          {formatDataPreview(entry.data)}
        </pre>
      ) : null}
    </article>
  );
};

export const LogsTab: React.FC = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [logs, setLogs] = useState<AppLogEntry[]>(() => getAppLogs());
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [contextFilter, setContextFilter] = useState('');
  const [search, setSearch] = useState('');
  const [captureEnabled, setCaptureEnabled] = useState(() => isAppLogCaptureEnabled());
  const [debugEnabled, setDebugEnabled] = useState(() => isAppLogDebugEnabled());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [busy, setBusy] = useState<'export' | null>(null);

  const refreshLogs = useCallback(() => {
    setLogs(getAppLogs());
  }, []);

  useEffect(() => {
    const onUpdated = () => refreshLogs();
    window.addEventListener(APP_LOGS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(APP_LOGS_UPDATED_EVENT, onUpdated);
  }, [refreshLogs]);

  const contexts = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(log => {
      if (log.context) set.add(log.context);
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (contextFilter && log.context !== contextFilter) return false;
      if (!query) return true;
      const haystack = [log.message, log.context ?? '', log.source, JSON.stringify(log.data ?? '')]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [logs, levelFilter, contextFilter, search]);

  const handleToggleCapture = (enabled: boolean) => {
    setAppLogCaptureEnabled(enabled);
    setCaptureEnabled(enabled);
  };

  const handleToggleDebug = (enabled: boolean) => {
    setAppLogDebugEnabled(enabled);
    setDebugEnabled(enabled);
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const json = exportAppLogsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qa-agile-guide-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      handleSuccess(`${logs.length} log(s) exportado(s).`);
    } catch (error) {
      handleError(error, 'Exportar logs');
    } finally {
      setBusy(null);
    }
  };

  const handleClear = () => {
    clearAppLogs();
    refreshLogs();
    setShowClearConfirm(false);
    handleSuccess('Histórico de logs limpo.');
  };

  return (
    <div className="space-y-6">
      <div className={leveSettingsSectionRowClass}>
        <div className={leveSettingsSectionMainClass}>
          <div className={leveSettingsSectionIconWrapClass} aria-hidden>
            <ScrollText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className={leveSettingsSectionTitleClass}>Logs do aplicativo</h3>
            <p className={cn(leveSettingsSectionSubtitleClass, 'mt-2')}>
              Histórico local de operações, avisos e erros. Dados sensíveis são mascarados
              automaticamente.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className={leveViewOutlineBtnClass}
            onClick={refreshLogs}
            aria-label="Atualizar lista de logs"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Atualizar
          </button>
          <button
            type="button"
            className={leveViewOutlineBtnClass}
            onClick={() => void handleExport()}
            disabled={busy === 'export' || logs.length === 0}
            aria-label="Exportar logs como JSON"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar
          </button>
          <button
            type="button"
            className={cn(leveViewOutlineBtnClass, 'text-[#e54b4f]')}
            onClick={() => setShowClearConfirm(true)}
            disabled={logs.length === 0}
            aria-label="Limpar histórico de logs"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Limpar
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={leveSettingsCheckboxPanelClass}>
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary"
            checked={captureEnabled}
            onChange={e => handleToggleCapture(e.target.checked)}
          />
          <span>
            <span className={leveSettingsStrongTextClass}>Registrar logs</span>
            <span className={cn(leveSettingsMutedTextClass, 'mt-1 block')}>
              Quando desligado, novos eventos não são salvos.
            </span>
          </span>
        </label>
        <label className={leveSettingsCheckboxPanelClass}>
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary"
            checked={debugEnabled}
            onChange={e => handleToggleDebug(e.target.checked)}
            disabled={!captureEnabled}
          />
          <span>
            <span className={leveSettingsStrongTextClass}>Incluir logs de debug</span>
            <span className={cn(leveSettingsMutedTextClass, 'mt-1 block')}>
              Pode gerar muito volume; útil para diagnóstico.
            </span>
          </span>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label htmlFor="logs-level-filter" className={leveSettingsStrongTextClass}>
            Nível
          </label>
          <select
            id="logs-level-filter"
            className="select select-bordered select-sm mt-1 w-full"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value as LevelFilter)}
          >
            {LEVEL_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="logs-context-filter" className={leveSettingsStrongTextClass}>
            Contexto
          </label>
          <select
            id="logs-context-filter"
            className="select select-bordered select-sm mt-1 w-full"
            value={contextFilter}
            onChange={e => setContextFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {contexts.map(ctx => (
              <option key={ctx} value={ctx}>
                {ctx}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="logs-search" className={leveSettingsStrongTextClass}>
            Buscar
          </label>
          <input
            id="logs-search"
            type="search"
            className="input input-bordered input-sm mt-1 w-full"
            placeholder="Mensagem, contexto ou detalhe…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <p className={leveSettingsMutedTextClass}>
        {filteredLogs.length} de {logs.length} registro(s)
        {filteredLogs.length !== logs.length ? ' (filtrados)' : ''}
      </p>

      <div className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className={cn(leveSettingsInsetPanelClass, 'p-6 text-center')}>
            <p className={leveSettingsMutedTextClass}>
              {logs.length === 0
                ? 'Nenhum log registrado ainda. As ações do app aparecerão aqui.'
                : 'Nenhum log corresponde aos filtros atuais.'}
            </p>
          </div>
        ) : (
          filteredLogs.map(entry => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Limpar logs"
        message={`Deseja apagar permanentemente ${logs.length} registro(s) de log? Esta ação não pode ser desfeita.`}
        confirmText="Limpar tudo"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

LogsTab.displayName = 'LogsTab';
