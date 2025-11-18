import { useCallback } from 'react';
import toast from 'react-hot-toast';

export interface AppError extends Error {
  code?: string;
  context?: string;
}

export const useErrorHandler = () => {
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

    // Log estruturado
    console.error(`[${context || 'App'}]`, {
      message: errorMessage,
      code: errorCode,
      error,
      timestamp: new Date().toISOString(),
    });

    // Mostrar toast
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-right',
    });

    return { message: errorMessage, code: errorCode };
  }, []);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  }, []);

  const handleWarning = useCallback((message: string) => {
    toast(message, {
      icon: '⚠️',
      duration: 4000,
      position: 'top-right',
    });
  }, []);

  const handleInfo = useCallback((message: string) => {
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

