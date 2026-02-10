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
        // Obter informações da mídia
        const jiraConfig = getJiraConfig();
        const mediaInfo = jiraMediaService.getMediaInfo(
            { id: attachmentId, filename, size: size || 0 },
            jiraConfig?.url,
            { useProxy: true, includeThumbnail: true, ...config }
        );

        setState(prev => ({ ...prev, mediaInfo }));

        // Carregar thumbnail primeiro se disponível
        if (mediaInfo.thumbnailUrl && mediaInfo.mediaType === 'image') {
            loadThumbnail(mediaInfo.thumbnailUrl);
        }

        // Se não é imagem, não precisa carregar blob
        if (mediaInfo.mediaType !== 'image') {
            return;
        }

        let active = true;

        const loadThumbnail = async (thumbnailUrl: string) => {
            setState(prev => ({ ...prev, loadingThumbnail: true }));

            try {
                // Verificar cache primeiro
                if (config.cacheEnabled !== false) {
                    const cached = await imageCacheService.get(thumbnailUrl);
                    if (cached.fromCache && cached.blob) {
                        if (active) {
                            const blobUrl = URL.createObjectURL(cached.blob);
                            setState(prev => ({ ...prev, thumbnailUrl: blobUrl, loadingThumbnail: false }));
                        }
                        return;
                    }
                }

                const jiraConfig = getJiraConfig();
                if (!jiraConfig) return;

                const isJira = jiraMediaService.isJiraUrl(thumbnailUrl);
                let blob: Blob;

                if (!isJira) {
                    const response = await fetch(thumbnailUrl, { mode: 'cors' });
                    if (!response.ok) return;
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

                    if (!response.ok) return;
                    blob = await response.blob();
                }

                // Salvar no cache
                if (config.cacheEnabled !== false && blob) {
                    await imageCacheService.set(thumbnailUrl, blob, 'image/png');
                }

                if (active) {
                    const blobUrl = URL.createObjectURL(blob);
                    setState(prev => ({ ...prev, thumbnailUrl: blobUrl, loadingThumbnail: false }));
                }
            } catch (err) {
                if (active) {
                    setState(prev => ({ ...prev, loadingThumbnail: false }));
                }
            }
        };

        const loadImage = async () => {
            setState(prev => ({ ...prev, loading: true, error: null }));

            try {
                const jiraConfig = getJiraConfig();
                
                if (!jiraConfig) {
                    throw new Error('Configuração do Jira não encontrada');
                }

                // Verificar cache primeiro se habilitado
                if (config.cacheEnabled !== false) {
                    const cached = await imageCacheService.get(mediaInfo.url);
                    if (cached.fromCache && cached.blob) {
                        if (active) {
                            const blobUrl = URL.createObjectURL(cached.blob);
                            objectUrlRef.current = blobUrl;
                            setState(prev => ({ ...prev, objectUrl: blobUrl, loading: false }));
                        }
                        return;
                    }
                }

                // Verificar se é URL do Jira
                const isJira = jiraMediaService.isJiraUrl(mediaInfo.url);
                
                let blob: Blob;

                if (!isJira) {
                    // URL externa, tentar fetch direto
                    const response = await fetch(mediaInfo.url, { mode: 'cors' });
                    if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);
                    
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

                    blob = await response.blob();
                }

                // Salvar no cache se habilitado
                if (config.cacheEnabled !== false && blob) {
                    await imageCacheService.set(mediaInfo.url, blob, mediaInfo.mimeType);
                }
                
                if (active) {
                    const blobUrl = URL.createObjectURL(blob);
                    objectUrlRef.current = blobUrl;
                    setState(prev => ({ ...prev, objectUrl: blobUrl, loading: false }));
                } else {
                    URL.revokeObjectURL(blobUrl);
                }
            } catch (err) {
                if (active) {
                    const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mídia';
                    logger.error('Erro ao carregar mídia do Jira', 'useJiraMedia', err);
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
    }, [attachmentId, filename, size, config.useProxy]);

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

