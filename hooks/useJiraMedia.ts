import { useState, useEffect, useRef } from 'react';
import { jiraMediaService, JiraMediaInfo, MediaResolutionConfig } from '../services/jiraMediaService';
import { getJiraConfig } from '../services/jiraService';
import { logger } from '../utils/logger';
import { imageCacheService } from '../services/imageCacheService';

/**
 * Estado do carregamento de mídia
 */
export interface JiraMediaState {
    objectUrl: string | null;
    thumbnailUrl: string | null;
    loading: boolean;
    error: string | null;
    mediaInfo: JiraMediaInfo | null;
    loadingThumbnail: boolean;
}

/**
 * Hook para gerenciar mídia do Jira de forma segura
 * Abstrai a lógica de resolução de URLs, autenticação e cache
 */
export const useJiraMedia = (
    attachmentId: string,
    filename: string,
    size?: number,
    config: MediaResolutionConfig = {}
): JiraMediaState => {
    const [state, setState] = useState<JiraMediaState>({
        objectUrl: null,
        thumbnailUrl: null,
        loading: false,
        loadingThumbnail: false,
        error: null,
        mediaInfo: null,
    });

    const objectUrlRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Declarar active no início para estar disponível em todas as funções
        let active = true;

        // Obter informações da mídia
        const jiraConfig = getJiraConfig();
        const mediaInfo = jiraMediaService.getMediaInfo(
            { id: attachmentId, filename, size: size || 0 },
            jiraConfig?.url,
            { useProxy: true, includeThumbnail: true, ...config }
        );

        setState(prev => ({ ...prev, mediaInfo }));

        // Se não é imagem, não precisa carregar blob
        if (mediaInfo.mediaType !== 'image') {
            return () => {
                active = false;
            };
        }

        // Validar se há URL antes de tentar carregar
        if (!mediaInfo.url || mediaInfo.url.trim() === '') {
            setState(prev => ({ 
                ...prev, 
                error: 'URL de mídia não disponível',
                loading: false 
            }));
            return () => {
                active = false;
            };
        }

        // Definir loadThumbnail antes de ser chamada
        const loadThumbnail = async (thumbnailUrl: string) => {
            if (!active) return;
            
            setState(prev => ({ ...prev, loadingThumbnail: true }));

            try {
                // Verificar se há configuração do Jira antes de tentar carregar
                const jiraConfig = getJiraConfig();
                if (!jiraConfig) {
                    setState(prev => ({ ...prev, loadingThumbnail: false }));
                    return;
                }

                // Verificar cache primeiro
                if (config.cacheEnabled !== false) {
                    const cached = await imageCacheService.get(thumbnailUrl);
                    if (cached.fromCache && cached.blob && active) {
                        const blobUrl = URL.createObjectURL(cached.blob);
                        setState(prev => ({ ...prev, thumbnailUrl: blobUrl, loadingThumbnail: false }));
                        return;
                    }
                }

                const isJira = jiraMediaService.isJiraUrl(thumbnailUrl);
                let blob: Blob;

                if (!isJira) {
                    const response = await fetch(thumbnailUrl, { mode: 'cors' });
                    if (!response.ok || !active) {
                        setState(prev => ({ ...prev, loadingThumbnail: false }));
                        return;
                    }
                    blob = await response.blob();
                } else {
                    const endpoint = thumbnailUrl.replace(jiraConfig.url.replace(/\/$/, ''), '').replace(/^\//, '');
                    const response = await fetch('/api/jira-proxy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: jiraConfig.url,
                            email: jiraConfig.email,
                            apiToken: jiraConfig.apiToken,
                            endpoint,
                            method: 'GET',
                            isBinary: true,
                        }),
                    });

                    if (!response.ok || !active) {
                        setState(prev => ({ ...prev, loadingThumbnail: false }));
                        return;
                    }
                    blob = await response.blob();
                }

                // Salvar no cache
                if (config.cacheEnabled !== false && blob && active) {
                    await imageCacheService.set(thumbnailUrl, blob, 'image/png');
                }

                if (active) {
                    const blobUrl = URL.createObjectURL(blob);
                    setState(prev => ({ ...prev, thumbnailUrl: blobUrl, loadingThumbnail: false }));
                }
            } catch (err) {
                if (active) {
                    // Logar erro mas não quebrar o componente
                    logger.warn('Erro ao carregar thumbnail', 'useJiraMedia', err);
                    setState(prev => ({ ...prev, loadingThumbnail: false }));
                }
            }
        };

        // Carregar thumbnail primeiro se disponível
        if (mediaInfo.thumbnailUrl && mediaInfo.mediaType === 'image') {
            loadThumbnail(mediaInfo.thumbnailUrl);
        }

        // Definir loadImage
        const loadImage = async () => {
            if (!active) return;

            setState(prev => ({ ...prev, loading: true, error: null }));

            try {
                const jiraConfig = getJiraConfig();
                
                // Se não há configuração do Jira, não tentar carregar
                if (!jiraConfig) {
                    setState(prev => ({ 
                        ...prev, 
                        error: null, // Não mostrar erro se não há config
                        loading: false 
                    }));
                    return;
                }

                // Validar URL novamente antes de tentar carregar
                if (!mediaInfo.url || mediaInfo.url.trim() === '') {
                    setState(prev => ({ 
                        ...prev, 
                        error: null,
                        loading: false 
                    }));
                    return;
                }

                // Verificar cache primeiro se habilitado
                if (config.cacheEnabled !== false) {
                    const cached = await imageCacheService.get(mediaInfo.url);
                    if (cached.fromCache && cached.blob && active) {
                        const blobUrl = URL.createObjectURL(cached.blob);
                        objectUrlRef.current = blobUrl;
                        setState(prev => ({ ...prev, objectUrl: blobUrl, loading: false }));
                        return;
                    }
                }

                // Verificar se é URL do Jira
                const isJira = jiraMediaService.isJiraUrl(mediaInfo.url);
                
                let blob: Blob;

                if (!isJira) {
                    // URL externa, tentar fetch direto
                    const response = await fetch(mediaInfo.url, { mode: 'cors' });
                    if (!response.ok) {
                        throw new Error(`Failed to load: ${response.statusText}`);
                    }
                    if (!active) return;
                    
                    blob = await response.blob();
                } else {
                    // URL do Jira - usar proxy
                    const endpoint = mediaInfo.url.replace(jiraConfig.url.replace(/\/$/, ''), '').replace(/^\//, '');
                    
                    abortControllerRef.current = new AbortController();
                    
                    const response = await fetch('/api/jira-proxy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: jiraConfig.url,
                            email: jiraConfig.email,
                            apiToken: jiraConfig.apiToken,
                            endpoint,
                            method: 'GET',
                            isBinary: true,
                        }),
                        signal: abortControllerRef.current.signal,
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                        throw new Error(errorData.error || `Failed to load: ${response.statusText}`);
                    }
                    if (!active) return;

                    blob = await response.blob();
                }

                // Salvar no cache se habilitado
                if (config.cacheEnabled !== false && blob && active) {
                    await imageCacheService.set(mediaInfo.url, blob, mediaInfo.mimeType);
                }
                
                if (active && blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    objectUrlRef.current = blobUrl;
                    setState(prev => ({ ...prev, objectUrl: blobUrl, loading: false }));
                }
                // Se não está ativo, não criar blob URL (será limpo no cleanup)
            } catch (err) {
                if (active) {
                    // Logar erro mas não quebrar o componente
                    const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mídia';
                    logger.warn('Erro ao carregar mídia do Jira', 'useJiraMedia', err);
                    setState(prev => ({ ...prev, error: errorMessage, loading: false }));
                }
            }
        };

        loadImage();

        return () => {
            active = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [attachmentId, filename, size, config.useProxy, config.cacheEnabled]);

    return state;
};

/**
 * Hook simplificado para obter apenas informações da mídia (sem carregar)
 */
export const useJiraMediaInfo = (
    attachmentId: string,
    filename: string,
    size?: number
): JiraMediaInfo | null => {
    const [mediaInfo, setMediaInfo] = useState<JiraMediaInfo | null>(null);

    useEffect(() => {
        const jiraConfig = getJiraConfig();
        const info = jiraMediaService.getMediaInfo(
            { id: attachmentId, filename, size: size || 0 },
            jiraConfig?.url
        );
        setMediaInfo(info);
    }, [attachmentId, filename, size]);

    return mediaInfo;
};

