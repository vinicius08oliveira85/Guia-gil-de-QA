import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

/**
 * Interface para erros customizados da aplicação
 */
export interface AppError extends Error {
  code?: string;
  context?: string;
}

/**
 * Hook para tratamento centralizado de erros e notificações
 * 
 * @returns Objeto com funções para lidar com erros, sucessos, avisos e informações
 * 
 * @example
 * ```tsx
 * const { handleError, handleSuccess } = useErrorHandler();
 * 
 * try {
 *   await someOperation();
 *   handleSuccess('Operação concluída!');
 * } catch (error) {
 *   handleError(error, 'Nome da operação');
 * }
 * ```
 */
export const useErrorHandler = () => {
  /**
   * Trata erros e exibe notificação
   * 
   * @param error - Erro a ser tratado (Error, string ou unknown)
   * @param context - Contexto onde o erro ocorreu (opcional)
   * @returns Objeto com mensagem e código do erro
   */
  const handleError = useCallback((error: unknown, context?: string) => {
    let errorMessage = 'Ocorreu um erro inesperado';
    let errorCode: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        errorCode = (error as AppError).code;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Log estruturado usando logger centralizado
    logger.error(errorMessage, context, error);

    // Mostrar toast
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-right',
    });

    return { message: errorMessage, code: errorCode };
  }, []);

  /**
   * Exibe notificação de sucesso
   * 
   * @param message - Mensagem de sucesso
   */
  const handleSuccess = useCallback((message: string) => {
    logger.info(message, 'Success');
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  }, []);

  /**
   * Exibe notificação de aviso
   * 
   * @param message - Mensagem de aviso
   */
  const handleWarning = useCallback((message: string) => {
    logger.warn(message, 'Warning');
    toast(message, {
      icon: '⚠️',
      duration: 4000,
      position: 'top-right',
    });
  }, []);

  /**
   * Exibe notificação informativa
   * 
   * @param message - Mensagem informativa
   */
  const handleInfo = useCallback((message: string) => {
    logger.info(message, 'Info');
    toast(message, {
      icon: 'ℹ️',
      duration: 3000,
      position: 'top-right',
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};

