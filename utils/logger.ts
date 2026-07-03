/**
 * Serviço de logging centralizado
 * Substitui console.log/error/warn por logging estruturado
 */

import { appendAppLog, type AppLogLevel } from './appLogStore';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;
  private readonly noisyProdContexts = ['gemini', 'callgeminiwithretry', 'geminiapikeymanager'];

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: string, data?: unknown): void {
    if (this.isDevelopment) {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Log de informação
   */
  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  /**
   * Log de erro
   */
  error(message: string, context?: string, error?: unknown): void {
    const errorData =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;

    this.log('error', message, context, errorData);

    // Em produção, enviar para serviço de monitoramento (ex: Sentry)
    if (this.isProduction && error instanceof Error) {
      // TODO: Integrar com Sentry ou similar
      // Sentry.captureException(error, { contexts: { custom: { context } } });
    }
  }

  /**
   * Log de sucesso (toast / operação concluída)
   */
  success(message: string, context?: string, data?: unknown): void {
    this.persist('success', message, context, data);
    const prefix = context ? `[${context}]` : '';
    console.info(`${prefix} ${message}`, data ?? '');
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const normalizedContext = context?.toLowerCase() || '';
    if (
      this.isProduction &&
      (level === 'info' || level === 'debug') &&
      this.noisyProdContexts.some(ctx => normalizedContext.includes(ctx))
    ) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };

    // Log estruturado
    const logMethod =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'info'
            ? console.info
            : console.debug;

    const prefix = context ? `[${context}]` : '';
    logMethod(`${prefix} ${message}`, data ? { data, timestamp: entry.timestamp } : entry);

    this.persist(level, message, context, data);
  }

  private persist(level: AppLogLevel, message: string, context?: string, data?: unknown): void {
    try {
      appendAppLog({ level, message, context, data, source: 'logger' });
    } catch {
      // Nunca falhar a operação principal por erro de log
    }
  }
}

export const logger = new Logger();
