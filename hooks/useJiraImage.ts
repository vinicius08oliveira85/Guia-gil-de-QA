import { useState, useEffect, useRef } from 'react';
import { getJiraConfig } from '../services/jiraService';

// Cache de blob URLs para evitar recarregar mesma imagem
const imageCache = new Map<string, string>();

/**
 * Hook para gerenciar o carregamento autenticado de imagens do Jira.
 * Resolve problemas de CORS e Autenticação convertendo a resposta em Blob URL.
 * Usa proxy do Jira quando necessário para autenticação.
 */
export const useJiraImage = (url: string, mimeType?: string) => {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const objectUrlRef = useRef<string | null>(null);

    // Identifica se é imagem pela extensão ou mimeType
    const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);

    // Verifica se a URL é do Jira
    const isJiraUrl = (urlToCheck: string): boolean => {
        try {
            const urlObj = new URL(urlToCheck);
            // Verificar se contém /secure/attachment/ ou é do domínio configurado do Jira
            return urlToCheck.includes('/secure/attachment/') || 
                   urlToCheck.includes('/rest/api/') ||
                   (getJiraConfig()?.url && urlObj.origin === new URL(getJiraConfig()!.url).origin);
        } catch {
            return false;
        }
    };

    useEffect(() => {
        if (!url || !isImage) return;

        // Verificar cache primeiro
        if (imageCache.has(url)) {
            const cachedUrl = imageCache.get(url)!;
            setObjectUrl(cachedUrl);
            objectUrlRef.current = cachedUrl;
            return;
        }

        let active = true;
        const fetchImage = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const jiraConfig = getJiraConfig();
                const shouldUseProxy = isJiraUrl(url) && jiraConfig;

                let response: Response;

                if (shouldUseProxy) {
                    // Extrair endpoint da URL do Jira
                    let endpoint = url;
                    try {
                        const urlObj = new URL(url);
                        endpoint = urlObj.pathname + urlObj.search;
                        // Remover barra inicial se existir
                        if (endpoint.startsWith('/')) {
                            endpoint = endpoint.slice(1);
                        }
                    } catch {
                        // Se falhar ao parsear URL, usar URL completa como endpoint
                        endpoint = url.replace(jiraConfig.url.replace(/\/$/, ''), '').replace(/^\//, '');
                    }

                    // Usar proxy do Jira para autenticação
                    response = await fetch('/api/jira-proxy', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            url: jiraConfig.url,
                            email: jiraConfig.email,
                            apiToken: jiraConfig.apiToken,
                            endpoint,
                            method: 'GET',
                            isBinary: true,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                        throw new Error(errorData.error || `Failed to load image: ${response.statusText}`);
                    }
                } else {
                    // URL externa ou não-Jira, tentar fetch direto
                    response = await fetch(url, {
                        mode: 'cors',
                    });
                }
                
                if (!response.ok) {
                    throw new Error(`Failed to load image: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                
                if (active) {
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Armazenar no cache
                    imageCache.set(url, blobUrl);
                    
                    setObjectUrl(blobUrl);
                    objectUrlRef.current = blobUrl;
                } else {
                    // Se não está mais ativo, revogar URL imediatamente
                    URL.revokeObjectURL(blobUrl);
                }
            } catch (err) {
                if (active) {
                    const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar imagem';
                    console.error('Error loading Jira image:', err);
                    setError(errorMessage);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchImage();

        return () => {
            active = false;
            // Não revogar URL aqui se estiver no cache - será revogado quando cache for limpo
            // Apenas revogar se não estiver no cache
            if (objectUrlRef.current && !imageCache.has(url)) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, [url, isImage]);

    return { objectUrl, loading, error, isImage };
};