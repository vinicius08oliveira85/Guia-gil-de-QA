const DEFAULT_TIMEOUT_MESSAGE = 'Operação excedeu o tempo limite.';

/**
 * Executa uma Promise com timeout. Rejeita com Error(message) se o tempo for excedido.
 * @param promise Promise a ser executada
 * @param ms Timeout em milissegundos
 * @param message Mensagem de erro em caso de timeout (opcional)
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message ?? DEFAULT_TIMEOUT_MESSAGE)), ms)
    ),
  ]);
}
