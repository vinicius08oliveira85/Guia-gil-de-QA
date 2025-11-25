/**
 * Serviço de logging centralizado
 * Substitui console.log/error/warn por logging estruturado
 */

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
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    
    this.log('error', message, context, errorData);
    
    // Em produção, enviar para serviço de monitoramento (ex: Sentry)
    if (this.isProduction && error instanceof Error) {
      // TODO: Integrar com Sentry ou similar
      // Sentry.captureException(error, { contexts: { custom: { context } } });
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };

    // Log estruturado
    const logMethod = level === 'error' ? console.error 
      : level === 'warn' ? console.warn 
      : level === 'info' ? console.info 
      : console.debug;

    const prefix = context ? `[${context}]` : '';
    logMethod(`${prefix} ${message}`, data ? { data, timestamp: entry.timestamp } : entry);
  }
}

export const logger = new Logger();

