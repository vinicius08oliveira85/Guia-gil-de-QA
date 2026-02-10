import { sanitizeHTML } from './sanitize';
import { jiraMediaService } from '../services/jiraMediaService';

/**
 * Configuração para sanitização de conteúdo
 */
export interface SanitizationConfig {
    allowImages?: boolean;
    allowLinks?: boolean;
    allowFormatting?: boolean;
    processJiraImages?: boolean;
    jiraAttachments?: Array<{ id: string; filename: string; size: number; created?: string; author?: string }>;
    jiraUrl?: string;
}

/**
 * Resultado da sanitização
 */
export interface SanitizedContent {
    html: string;
    hasImages: boolean;
    imageCount: number;
    hasLinks: boolean;
    linkCount: number;
}

/**
 * Serviço para sanitizar e processar conteúdo do Jira de forma segura
 */
export class JiraContentSanitizer {
    /**
     * Sanitiza HTML do Jira, processando imagens e links de forma segura
     */
    static sanitize(
        html: string,
        config: SanitizationConfig = {}
    ): SanitizedContent {
        if (!html) {
            return { html: '', hasImages: false, imageCount: 0, hasLinks: false, linkCount: 0 };
        }

        let processedHtml = html;
        let imageCount = 0;
        let linkCount = 0;

        // Processar imagens do Jira se configurado
        if (config.processJiraImages && config.jiraAttachments && config.jiraUrl) {
            processedHtml = this.processJiraImages(processedHtml, config);
            imageCount = (processedHtml.match(/<img[^>]*>/gi) || []).length;
        } else {
            imageCount = (html.match(/<img[^>]*>/gi) || []).length;
        }

        // Contar links
        linkCount = (processedHtml.match(/<a[^>]*>/gi) || []).length;

        // Sanitizar HTML removendo scripts e conteúdo perigoso
        processedHtml = sanitizeHTML(processedHtml);

        // Remover imagens se não permitidas
        if (!config.allowImages) {
            processedHtml = processedHtml.replace(/<img[^>]*>/gi, '');
            imageCount = 0;
        }

        // Remover links se não permitidos
        if (!config.allowLinks) {
            processedHtml = processedHtml.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
            linkCount = 0;
        }

        return {
            html: processedHtml,
            hasImages: imageCount > 0,
            imageCount,
            hasLinks: linkCount > 0,
            linkCount,
        };
    }

    /**
     * Processa imagens do Jira, convertendo nomes de arquivo para URLs completas
     */
    private static processJiraImages(
        html: string,
        config: SanitizationConfig
    ): string {
        if (!config.jiraAttachments || !config.jiraUrl) {
            return html;
        }

        const baseUrl = config.jiraUrl.replace(/\/$/, '');
        const attachmentMap = new Map<string, typeof config.jiraAttachments[0]>();
        
        config.jiraAttachments.forEach(att => {
            attachmentMap.set(att.filename.toLowerCase(), att);
            const nameWithoutExt = att.filename.toLowerCase().replace(/\.[^.]+$/, '');
            if (nameWithoutExt !== att.filename.toLowerCase()) {
                attachmentMap.set(nameWithoutExt, att);
            }
        });

        // Processar padrão Markdown do Jira: !imagem.png!
        html = html.replace(/!([^!|]+)(?:\|([^!]+))?!/g, (match, filename, params) => {
            const cleanFilename = filename.trim();
            const attachment = attachmentMap.get(cleanFilename.toLowerCase());
            
            if (attachment) {
                const imageUrl = `${baseUrl}/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
                let width = '';
                let height = '';
                
                if (params) {
                    const widthMatch = params.match(/width=(\d+)/i);
                    const heightMatch = params.match(/height=(\d+)/i);
                    if (widthMatch) width = ` width="${widthMatch[1]}"`;
                    if (heightMatch) height = ` height="${heightMatch[1]}"`;
                }
                
                return `<img class="jira-image" src="${this.escapeHTML(imageUrl)}" alt="${this.escapeHTML(cleanFilename)}" loading="lazy" data-jira-url="${this.escapeHTML(imageUrl)}" data-attachment-id="${attachment.id}"${width}${height} />`;
            }
            
            return match;
        });

        // Processar tags <img> existentes
        html = html.replace(/<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
            // Se já é URL completa, adicionar atributos se necessário
            if (src.startsWith('http://') || src.startsWith('https://')) {
                if (src.includes('/secure/attachment/') || src.includes(baseUrl)) {
                    const hasDataAttr = before.includes('data-jira-url=') || after.includes('data-jira-url=');
                    const hasLoading = before.includes('loading=') || after.includes('loading=');
                    const hasClass = before.includes('class=') || after.includes('class=');
                    
                    let newBefore = before;
                    if (!hasClass) newBefore += ` class="jira-image"`;
                    if (!hasDataAttr) newBefore += ` data-jira-url="${this.escapeHTML(src)}"`;
                    if (!hasLoading) newBefore += ` loading="lazy"`;
                    
                    // Extrair attachment ID da URL se possível
                    const idMatch = src.match(/\/secure\/attachment\/(\d+)\//);
                    if (idMatch && !before.includes('data-attachment-id=') && !after.includes('data-attachment-id=')) {
                        newBefore += ` data-attachment-id="${idMatch[1]}"`;
                    }
                    
                    return `<img${newBefore} src="${this.escapeHTML(src)}"${after}>`;
                }
                return match;
            }
            
            if (src.startsWith('data:')) {
                return match;
            }

            // Tentar mapear nome de arquivo para anexo
            const filename = src.split('/').pop() || src;
            const attachment = attachmentMap.get(filename.toLowerCase());

            if (attachment) {
                const imageUrl = `${baseUrl}/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
                const hasClass = before.includes('class=') || after.includes('class=');
                const hasDataAttr = before.includes('data-jira-url=') || after.includes('data-jira-url=');
                const hasLoading = before.includes('loading=') || after.includes('loading=');
                
                let newBefore = before;
                if (!hasClass) newBefore += ` class="jira-image"`;
                if (!hasDataAttr) newBefore += ` data-jira-url="${this.escapeHTML(imageUrl)}"`;
                if (!hasLoading) newBefore += ` loading="lazy"`;
                newBefore += ` data-attachment-id="${attachment.id}"`;
                
                return `<img${newBefore} src="${this.escapeHTML(imageUrl)}"${after}>`;
            }

            return match;
        });

        return html;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    private static escapeHTML(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Extrai todas as URLs de imagens do conteúdo
     */
    static extractImageUrls(html: string): Array<{ url: string; alt?: string; attachmentId?: string }> {
        const images: Array<{ url: string; alt?: string; attachmentId?: string }> = [];
        const imgRegex = /<img[^>]*>/gi;
        let match;

        while ((match = imgRegex.exec(html)) !== null) {
            const imgTag = match[0];
            const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
            const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
            const idMatch = imgTag.match(/data-attachment-id=["']([^"']+)["']/i);

            if (srcMatch) {
                images.push({
                    url: srcMatch[1],
                    alt: altMatch ? altMatch[1] : undefined,
                    attachmentId: idMatch ? idMatch[1] : undefined,
                });
            }
        }

        return images;
    }
}

