import React from 'react';

const isChunkLoadError = (error: any) => {
    if (!error) return false;
    const message = typeof error === 'string' ? error : error.message || '';
    return (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('does not provide an export named')
    );
};

export function lazyWithRetry<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
    options: { maxRetries?: number; onFail?: () => void } = {}
) {
    const { maxRetries = 2, onFail } = options;
    let attempt = 0;

    const loadComponent = (): Promise<{ default: T }> =>
        factory().catch((error) => {
            if (isChunkLoadError(error) && attempt < maxRetries) {
                attempt += 1;
                const delay = attempt * 500;
                console.warn(
                    `[lazyWithRetry] Erro ao carregar chunk (tentativa ${attempt}/${maxRetries}). Re-tentando em ${delay}ms...`,
                    error
                );
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        loadComponent().then(resolve).catch(reject);
                    }, delay);
                });
            }

            if (isChunkLoadError(error)) {
                console.error('[lazyWithRetry] Falha definitiva ao carregar chunk. Recarregando página...', error);
                onFail?.();
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            }

            throw error;
        });

    return React.lazy(loadComponent);
}

