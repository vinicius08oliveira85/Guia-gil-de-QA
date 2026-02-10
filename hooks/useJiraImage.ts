import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar o carregamento autenticado de imagens do Jira.
 * Resolve problemas de CORS e Autenticação convertendo a resposta em Blob URL.
 */
export const useJiraImage = (url: string, mimeType?: string) => {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Identifica se é imagem pela extensão ou mimeType
    const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

    useEffect(() => {
        if (!url || !isImage) return;

        let active = true;
        const fetchImage = async () => {
            setLoading(true);
            try {
                // Recupera token se existir (ajuste conforme sua estratégia de auth)
                // const token = localStorage.getItem('jira_token');
                // const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                // Nota: Se o backend atuar como proxy, a URL já deve ser a do proxy.
                // Se for direto ao Jira, certifique-se que o CORS permite ou use um proxy.
                const response = await fetch(url, {
                    // headers 
                });
                
                if (!response.ok) throw new Error(`Failed to load image: ${response.statusText}`);
                
                const blob = await response.blob();
                if (active) {
                    const blobUrl = URL.createObjectURL(blob);
                    setObjectUrl(blobUrl);
                }
            } catch (err) {
                if (active) {
                    console.error('Error loading Jira image:', err);
                    setError('Erro ao carregar imagem');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchImage();

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [url, isImage]);

    return { objectUrl, loading, error, isImage };
};