import React, { useState, useEffect } from 'react';

/**
 * Banner exibido quando o usuário está offline (navigator.onLine === false).
 * Ajuda na experiência PWA e evita confusão quando ações de rede falham.
 */
export const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div
            className="sticky top-0 z-20 w-full py-2 px-4 text-center text-sm font-medium bg-warning/90 text-warning-content border-b border-warning/50"
            role="status"
            aria-live="polite"
        >
            Você está offline. As alterações serão sincronizadas quando a conexão voltar.
        </div>
    );
};
