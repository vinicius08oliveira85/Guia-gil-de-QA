import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APP_LOGS_STORAGE_KEY,
  APP_LOG_CAPTURE_ENABLED_KEY,
  APP_LOG_DEBUG_ENABLED_KEY,
  appendAppLog,
  clearAppLogs,
  exportAppLogsJson,
  getAppLogs,
  isAppLogCaptureEnabled,
  isAppLogDebugEnabled,
  setAppLogCaptureEnabled,
  setAppLogDebugEnabled,
} from '../../utils/appLogStore';

describe('appLogStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setAppLogCaptureEnabled(true);
    setAppLogDebugEnabled(false);
  });

  it('persiste entrada e recupera em ordem (mais recente primeiro)', () => {
    appendAppLog({ level: 'info', message: 'Primeiro', context: 'Test' });
    appendAppLog({ level: 'error', message: 'Segundo', context: 'Test' });

    const logs = getAppLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toBe('Segundo');
    expect(logs[1].message).toBe('Primeiro');
  });

  it('não persiste debug quando debug está desligado', () => {
    appendAppLog({ level: 'debug', message: 'Oculto' });
    expect(getAppLogs()).toHaveLength(0);

    setAppLogDebugEnabled(true);
    appendAppLog({ level: 'debug', message: 'Visível' });
    expect(getAppLogs()).toHaveLength(1);
  });

  it('não persiste quando captura está desligada', () => {
    setAppLogCaptureEnabled(false);
    appendAppLog({ level: 'info', message: 'Ignorado' });
    expect(getAppLogs()).toHaveLength(0);
    expect(isAppLogCaptureEnabled()).toBe(false);
  });

  it('mascara campos sensíveis em data', () => {
    appendAppLog({
      level: 'info',
      message: 'Config salva',
      data: { apiToken: 'secret-123', name: 'Projeto A' },
    });

    const data = getAppLogs()[0].data as Record<string, unknown>;
    expect(data.apiToken).toBe('[REDACTED]');
    expect(data.name).toBe('Projeto A');
  });

  it('clearAppLogs remove histórico', () => {
    appendAppLog({ level: 'warn', message: 'Aviso' });
    clearAppLogs();
    expect(getAppLogs()).toHaveLength(0);
    expect(localStorage.getItem(APP_LOGS_STORAGE_KEY)).toBeNull();
  });

  it('exportAppLogsJson retorna JSON válido', () => {
    appendAppLog({ level: 'success', message: 'OK', source: 'toast' });
    const json = exportAppLogsJson();
    const parsed = JSON.parse(json) as unknown[];
    expect(parsed).toHaveLength(1);
  });

  it('respeita preferências no localStorage', () => {
    localStorage.setItem(APP_LOG_CAPTURE_ENABLED_KEY, 'false');
    localStorage.setItem(APP_LOG_DEBUG_ENABLED_KEY, 'true');
    expect(isAppLogCaptureEnabled()).toBe(false);
    expect(isAppLogDebugEnabled()).toBe(true);
  });

  it('dispara evento ao adicionar log', () => {
    const handler = vi.fn();
    window.addEventListener('qa-app-logs-updated', handler);
    appendAppLog({ level: 'info', message: 'Evento' });
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener('qa-app-logs-updated', handler);
  });
});
