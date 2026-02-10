/**
 * Utilitário para converter descrições do Jira (ADF - Atlassian Document Format) para texto/HTML
 */

import { sanitizeHTML } from './sanitize';
import { JiraContentSanitizer } from './jiraContentSanitizer';

interface ADFNode {
    type: string;
    content?: ADFNode[];
    text?: string;
    attrs?: Record<string, any>;
    marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

/**
 * Converte um nó ADF para texto
 */
function adfNodeToText(node: ADFNode): string {
    if (node.text) {
        return node.text;
    }

    // Tratamento de tipos específicos
    switch (node.type) {
        case 'paragraph':
            return (node.content ?? []).map(adfNodeToText).join('') + '\n';
        case 'heading':
            const level = node.attrs?.level || 1;
            const prefix = '#'.repeat(level) + ' ';
            return prefix + (node.content ?? []).map(adfNodeToText).join('') + '\n';
        case 'bulletList':
        case 'orderedList':
            return (node.content ?? []).map(adfNodeToText).join('') + '\n';
        case 'listItem':
            return '• ' + (node.content ?? []).map(adfNodeToText).join('') + '\n';
        case 'codeBlock':
            return '```\n' + (node.content ?? []).map(adfNodeToText).join('') + '\n```\n';
        case 'hardBreak':
            return '\n';
        case 'blockquote':
            return '> ' + (node.content ?? []).map(adfNodeToText).join('') + '\n';
        default:
            return (node.content ?? []).map(adfNodeToText).join('');
    }
}

/**
 * Converte descrição do Jira para texto legível
 * Suporta string simples, HTML renderizado, objeto ADF, ou array de objetos ADF
 */
export function parseJiraDescription(description: any): string {
    if (!description) {
        return '';
    }
    
    // Se já é uma string
    if (typeof description === 'string') {
        // Se contém HTML, remove tags mas preserva quebras de linha
        if (description.includes('<')) {
            // Converter quebras de linha HTML para quebras reais
            let text = description
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<\/div>/gi, '\n')
                .replace(/<li>/gi, '• ')
                .replace(/<\/li>/gi, '\n')
                .replace(/<[^>]*>/g, '') // Remove todas as outras tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
            
            // Limpar múltiplas quebras de linha consecutivas
            text = text.replace(/\n{3,}/g, '\n\n');
            
            return text;
        }
        
        // String simples, retorna como está
        return description.trim();
    }
    
    // Se é um objeto ADF
    if (typeof description === 'object') {
        // Pode ser um documento ADF completo
        if (description.type === 'doc' && Array.isArray(description.content)) {
            return description.content.map(adfNodeToText).join('').trim();
        }
        
        // Pode ser um array de nós ADF
        if (Array.isArray(description)) {
            return description.map(adfNodeToText).join('').trim();
        }
        
        // Pode ser um único nó ADF
        if (description.type) {
            return adfNodeToText(description).trim();
        }
        
        // Se tem propriedade 'content', tenta processar
        if (description.content) {
            return parseJiraDescription(description.content);
        }
        
        // Se tem propriedade 'html' ou 'text', usar ela
        if (description.html) {
            return parseJiraDescription(description.html);
        }
        if (description.text) {
            return description.text;
        }
    }
    
    // Fallback: converte para string (mas não mostra JSON completo)
    try {
        const str = JSON.stringify(description);
        // Se o JSON é muito grande ou parece ser um objeto complexo, retornar vazio
        if (str.length > 1000 || (str.startsWith('{') && !str.includes('"text"'))) {
            return '';
        }
        return str;
    } catch {
        return '';
    }
}

/**
 * Converte um nó ADF para HTML
 * @param node Nó ADF a converter
 * @param jiraUrl URL base do Jira (opcional, para construir URLs de imagens)
 * @param jiraAttachments Array de anexos do Jira (opcional, para mapear imagens)
 */
function adfNodeToHTML(node: ADFNode, jiraUrl?: string, jiraAttachments?: JiraAttachment[]): string {
    if (node.text) {
        let text = escapeHTML(node.text);
        
        // Aplicar marks (formatação)
        if (node.marks && Array.isArray(node.marks)) {
            for (const mark of node.marks) {
                switch (mark.type) {
                    case 'strong':
                        text = `<strong>${text}</strong>`;
                        break;
                    case 'em':
                        text = `<em>${text}</em>`;
                        break;
                    case 'code':
                        text = `<code>${text}</code>`;
                        break;
                    case 'link':
                        const href = mark.attrs?.href || '#';
                        text = `<a href="${escapeHTML(href)}">${text}</a>`;
                        break;
                }
            }
        }
        
        return text;
    }
    
    if (node.content && Array.isArray(node.content)) {
        const content = node.content.map(child => adfNodeToHTML(child, jiraUrl, jiraAttachments)).join('');
        
        // Tratamento de tipos específicos
        switch (node.type) {
            case 'paragraph':
                return `<p>${content}</p>`;
            case 'heading':
                const level = node.attrs?.level || 1;
                return `<h${level}>${content}</h${level}>`;
            case 'bulletList':
                return `<ul>${content}</ul>`;
            case 'orderedList':
                return `<ol>${content}</ol>`;
            case 'listItem':
                return `<li>${content}</li>`;
            case 'codeBlock':
                const language = node.attrs?.language || '';
                return `<pre><code${language ? ` class="language-${language}"` : ''}>${escapeHTML(content)}</code></pre>`;
            case 'hardBreak':
                return '<br />';
            case 'blockquote':
                return `<blockquote>${content}</blockquote>`;
            case 'mediaSingle':
                // Container para mídia única (imagem com layout)
                return `<div class="jira-media-single">${content}</div>`;
            case 'media':
                // Imagens e outros media do Jira
                const mediaId = node.attrs?.id;
                const mediaType = node.attrs?.type || 'file';
                const mediaCollection = node.attrs?.collection;
                const url = node.attrs?.url || node.attrs?.src || '';
                const alt = node.attrs?.alt || node.attrs?.title || '';
                
                // Tentar encontrar anexo pelo ID, collection ou filename
                let attachment: JiraAttachment | undefined;
                if (jiraAttachments && jiraUrl) {
                    if (mediaId) {
                        // Buscar por ID do anexo
                        attachment = jiraAttachments.find(att => att.id === String(mediaId));
                    }
                    
                    // Se não encontrou por ID, tentar por filename na URL
                    if (!attachment && url) {
                        const filename = url.split('/').pop() || url;
                        attachment = jiraAttachments.find(att => 
                            att.filename.toLowerCase() === filename.toLowerCase()
                        );
                    }
                }
                
                // Construir URL da imagem
                let imageUrl = url;
                if (attachment && jiraUrl) {
                    const baseUrl = jiraUrl.replace(/\/$/, '');
                    imageUrl = `${baseUrl}/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
                }
                
                if (imageUrl && (mediaType === 'file' || mediaType === 'image' || !mediaType)) {
                    // Adicionar classe especial e atributos para interceptação no frontend
                    return `<img class="jira-image" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(alt)}" loading="lazy" data-jira-url="${escapeHTML(imageUrl)}" />`;
                }
                
                return content;
            case 'table':
                return `<table>${content}</table>`;
            case 'tableRow':
                return `<tr>${content}</tr>`;
            case 'tableCell':
                return `<td>${content}</td>`;
            case 'tableHeader':
                return `<th>${content}</th>`;
            default:
                return content;
        }
    }
    
    return '';
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHTML(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Interface para anexos do Jira
 */
interface JiraAttachment {
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
}

/**
 * Processa imagens no HTML do Jira, convertendo nomes de arquivo para URLs completas
 * @param html HTML sanitizado do Jira
 * @param jiraUrl URL base do Jira (ex: https://jira.example.com)
 * @param jiraAttachments Array de anexos do Jira para mapear nomes de arquivo
 * @returns HTML com URLs de imagens corrigidas
 */
function processJiraImages(
    html: string,
    jiraUrl?: string,
    jiraAttachments?: JiraAttachment[]
): string {
    if (!html || !jiraUrl || !jiraAttachments || jiraAttachments.length === 0) {
        return html;
    }

    // Remover barra final da URL do Jira se existir
    const baseUrl = jiraUrl.replace(/\/$/, '');

    // Criar mapa de filename -> attachment para busca rápida
    const attachmentMap = new Map<string, JiraAttachment>();
    jiraAttachments.forEach(att => {
        attachmentMap.set(att.filename.toLowerCase(), att);
        // Também mapear sem extensão para casos onde o nome pode variar
        const nameWithoutExt = att.filename.toLowerCase().replace(/\.[^.]+$/, '');
        if (nameWithoutExt !== att.filename.toLowerCase()) {
            attachmentMap.set(nameWithoutExt, att);
        }
    });

    // Processar padrão Markdown do Jira: !imagem.png! ou !imagem.png|width=200!
    html = html.replace(/!([^!|]+)(?:\|([^!]+))?!/g, (match, filename, params) => {
        // Remover parâmetros como |width=200
        const cleanFilename = filename.trim();
        const attachment = attachmentMap.get(cleanFilename.toLowerCase());
        
        if (attachment) {
            const imageUrl = `${baseUrl}/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
            // Extrair width/height dos parâmetros se existirem
            let width = '';
            let height = '';
            if (params) {
                const widthMatch = params.match(/width=(\d+)/i);
                const heightMatch = params.match(/height=(\d+)/i);
                if (widthMatch) width = ` width="${widthMatch[1]}"`;
                if (heightMatch) height = ` height="${heightMatch[1]}"`;
            }
            return `<img class="jira-image" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(cleanFilename)}" loading="lazy" data-jira-url="${escapeHTML(imageUrl)}"${width}${height} />`;
        }
        
        // Se não encontrou, retornar como texto simples
        return match;
    });

    // Processar tags <img> que têm src com apenas nome de arquivo (não URL completa)
    html = html.replace(/<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
        // Se src já é uma URL completa (http/https/data), adicionar classe e atributos se for do Jira
        if (src.startsWith('http://') || src.startsWith('https://')) {
            // Verificar se é URL do Jira
            if (src.includes('/secure/attachment/') || src.includes(baseUrl)) {
                // Adicionar classe e atributos se não tiver
                if (!before.includes('class=') && !after.includes('class=')) {
                    const hasDataAttr = before.includes('data-jira-url=') || after.includes('data-jira-url=');
                    const hasLoading = before.includes('loading=') || after.includes('loading=');
                    let newBefore = before;
                    let newAfter = after;
                    
                    if (!hasDataAttr) {
                        newBefore += ` data-jira-url="${escapeHTML(src)}"`;
                    }
                    if (!hasLoading) {
                        newBefore += ` loading="lazy"`;
                    }
                    if (!before.includes('class=') && !after.includes('class=')) {
                        newBefore += ` class="jira-image"`;
                    }
                    return `<img${newBefore} src="${escapeHTML(src)}"${newAfter}>`;
                }
            }
            return match;
        }
        
        if (src.startsWith('data:')) {
            return match;
        }

        // Se src é apenas um nome de arquivo, tentar mapear para anexo
        const filename = src.split('/').pop() || src; // Pegar apenas o nome do arquivo
        const attachment = attachmentMap.get(filename.toLowerCase());

        if (attachment) {
            // Construir URL completa do Jira
            const imageUrl = `${baseUrl}/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
            // Adicionar classe e atributos se não tiver
            const hasClass = before.includes('class=') || after.includes('class=');
            const hasDataAttr = before.includes('data-jira-url=') || after.includes('data-jira-url=');
            const hasLoading = before.includes('loading=') || after.includes('loading=');
            
            let newBefore = before;
            let newAfter = after;
            
            if (!hasClass) {
                newBefore += ` class="jira-image"`;
            }
            if (!hasDataAttr) {
                newBefore += ` data-jira-url="${escapeHTML(imageUrl)}"`;
            }
            if (!hasLoading) {
                newBefore += ` loading="lazy"`;
            }
            
            return `<img${newBefore} src="${escapeHTML(imageUrl)}"${newAfter}>`;
        }

        // Se não encontrou anexo, retornar original (pode ser uma imagem externa ou não encontrada)
        return match;
    });
    
    return html;
}

/**
 * Converte descrição do Jira para HTML preservando formatação rica
 * Suporta string HTML renderizada, objeto ADF, ou array de objetos ADF
 * Retorna HTML sanitizado pronto para renderização
 * 
 * @param description Descrição do Jira (HTML, ADF ou string)
 * @param jiraUrl URL base do Jira para construir URLs de imagens (opcional)
 * @param jiraAttachments Array de anexos do Jira para mapear imagens (opcional)
 */
export function parseJiraDescriptionHTML(
    description: any,
    jiraUrl?: string,
    jiraAttachments?: JiraAttachment[]
): string {
    if (!description) {
        return '';
    }
    
    let html = '';
    
    // Se já é uma string HTML renderizada
    if (typeof description === 'string') {
        // Se contém HTML, preservar e sanitizar
        if (description.includes('<')) {
            html = sanitizeHTML(description);
        } else {
            // String simples sem HTML, retornar como parágrafo
            html = sanitizeHTML(`<p>${description.trim()}</p>`);
        }
    } else if (typeof description === 'object') {
        // Se é um objeto ADF, converter para HTML
        if (description.type === 'doc' && Array.isArray(description.content)) {
            html = sanitizeHTML(adfNodeToHTML(description, jiraUrl, jiraAttachments));
        } else if (Array.isArray(description)) {
            html = sanitizeHTML(description.map(node => adfNodeToHTML(node, jiraUrl, jiraAttachments)).join(''));
        } else if (description.type) {
            html = sanitizeHTML(adfNodeToHTML(description, jiraUrl, jiraAttachments));
        } else if (description.content) {
            return parseJiraDescriptionHTML(description.content, jiraUrl, jiraAttachments);
        } else if (description.html) {
            return parseJiraDescriptionHTML(description.html, jiraUrl, jiraAttachments);
        } else if (description.text) {
            html = sanitizeHTML(`<p>${description.text}</p>`);
        }
    }
    
    // Processar imagens se temos URL do Jira e anexos
    if (html && jiraUrl && jiraAttachments && jiraAttachments.length > 0) {
        html = processJiraImages(html, jiraUrl, jiraAttachments);
    }
    
    // Usar sanitizador para garantir segurança adicional
    // Nota: O sanitizador já foi aplicado anteriormente, mas podemos usar novamente
    // para garantir que todas as imagens tenham os atributos corretos
    const sanitized = JiraContentSanitizer.sanitize(html, {
        allowImages: true,
        allowLinks: true,
        allowFormatting: true,
        processJiraImages: false, // Já processado acima
        jiraAttachments,
        jiraUrl,
    });
    return sanitized.html;
}

