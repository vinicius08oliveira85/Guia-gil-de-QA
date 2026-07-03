/** Persistência centralizada de logs da aplicação para a aba Configurações → Logs. */

export type AppLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export type AppLogSource = 'logger' | 'audit' | 'toast' | 'system';

export interface AppLogEntry {
  id: string;
  level: AppLogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
  source: AppLogSource;
}

export const APP_LOGS_STORAGE_KEY = 'qa_app_logs';
export const APP_LOG_CAPTURE_ENABLED_KEY = 'qa_app_log_capture_enabled';
export const APP_LOG_DEBUG_ENABLED_KEY = 'qa_app_log_debug_enabled';
export const APP_LOGS_UPDATED_EVENT = 'qa-app-logs-updated';

export const MAX_APP_LOGS = 3000;

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|apikey|api_key|api-token|authorization|credential|gemini)/i;

function readBooleanPref(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === 'true';
  } catch {
    return defaultValue;
  }
}

function writeBooleanPref(key: string, value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // ignore quota errors
  }
}

function dispatchLogsUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APP_LOGS_UPDATED_EVENT));
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[Profundidade máxima]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.length > 4000) return `${value.slice(0, 4000)}… [truncado]`;
    return value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map(item => sanitizeValue(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeValue(nested, depth + 1);
    }
  }
  return result;
}

export function isAppLogCaptureEnabled(): boolean {
  return readBooleanPref(APP_LOG_CAPTURE_ENABLED_KEY, true);
}

export function setAppLogCaptureEnabled(enabled: boolean): void {
  writeBooleanPref(APP_LOG_CAPTURE_ENABLED_KEY, enabled);
  dispatchLogsUpdated();
}

export function isAppLogDebugEnabled(): boolean {
  return readBooleanPref(APP_LOG_DEBUG_ENABLED_KEY, false);
}

export function setAppLogDebugEnabled(enabled: boolean): void {
  writeBooleanPref(APP_LOG_DEBUG_ENABLED_KEY, enabled);
  dispatchLogsUpdated();
}

export function getAppLogs(): AppLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(APP_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistLogs(logs: AppLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APP_LOGS_STORAGE_KEY, JSON.stringify(logs));
    dispatchLogsUpdated();
  } catch {
    // Quota exceeded — descarta metade mais antiga e tenta de novo
    try {
      const trimmed = logs.slice(0, Math.floor(logs.length / 2));
      localStorage.setItem(APP_LOGS_STORAGE_KEY, JSON.stringify(trimmed));
      dispatchLogsUpdated();
    } catch {
      // ignore
    }
  }
}

export interface AppendAppLogInput {
  level: AppLogLevel;
  message: string;
  context?: string;
  data?: unknown;
  source?: AppLogSource;
}

/**
 * Adiciona entrada ao histórico persistido (respeita flag de captura).
 */
export function appendAppLog(input: AppendAppLogInput): AppLogEntry | null {
  if (!isAppLogCaptureEnabled()) return null;
  if (input.level === 'debug' && !isAppLogDebugEnabled()) return null;

  const entry: AppLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    level: input.level,
    message: input.message,
    context: input.context,
    data: input.data !== undefined ? sanitizeValue(input.data) : undefined,
    timestamp: new Date().toISOString(),
    source: input.source ?? 'logger',
  };

  const logs = getAppLogs();
  logs.unshift(entry);
  if (logs.length > MAX_APP_LOGS) {
    logs.length = MAX_APP_LOGS;
  }
  persistLogs(logs);
  return entry;
}

export function clearAppLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(APP_LOGS_STORAGE_KEY);
    dispatchLogsUpdated();
  } catch {
    // ignore
  }
}

export function exportAppLogsJson(): string {
  return JSON.stringify(getAppLogs(), null, 2);
}

let globalHandlersRegistered = false;

/**
 * Registra captura de erros globais do navegador (uma vez por sessão).
 */
export function registerAppLogGlobalHandlers(): void {
  if (globalHandlersRegistered || typeof window === 'undefined') return;
  globalHandlersRegistered = true;

  window.addEventListener('error', event => {
    appendAppLog({
      level: 'error',
      message: event.message || 'Erro global não tratado',
      context: 'GlobalError',
      source: 'system',
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      },
    });
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    appendAppLog({
      level: 'error',
      message:
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Promise rejeitada sem tratamento',
      context: 'UnhandledRejection',
      source: 'system',
      data:
        reason instanceof Error
          ? { name: reason.name, stack: reason.stack }
          : sanitizeValue(reason),
    });
  });
}

/** Apenas para testes — reseta flag de handlers globais. */
export function resetAppLogGlobalHandlersForTests(): void {
  globalHandlersRegistered = false;
}
