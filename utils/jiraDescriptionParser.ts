/**
 * Utilitário para converter descrições do Jira (ADF - Atlassian Document Format) para texto/HTML
 */

import { sanitizeHTML } from './sanitize';

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
    
    if (node.content && Array.isArray(node.content)) {
        return node.content.map(adfNodeToText).join('');
    }
    
    // Tratamento de tipos específicos
    switch (node.type) {
        case 'paragraph':
            return (node.content?.map(adfNodeToText).join('') || '') + '\n';
        case 'heading':
            const level = node.attrs?.level || 1;
            const prefix = '#'.repeat(level) + ' ';
            return prefix + (node.content?.map(adfNodeToText).join('') || '') + '\n';
        case 'bulletList':
        case 'orderedList':
            return (node.content?.map(adfNodeToText).join('') || '') + '\n';
        case 'listItem':
            return '• ' + (node.content?.map(adfNodeToText).join('') || '') + '\n';
        case 'codeBlock':
            return '```\n' + (node.content?.map(adfNodeToText).join('') || '') + '\n```\n';
        case 'hardBreak':
            return '\n';
        case 'blockquote':
            return '> ' + (node.content?.map(adfNodeToText).join('') || '') + '\n';
        default:
            return node.content?.map(adfNodeToText).join('') || '';
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
 * Converte descrição do Jira para HTML preservando formatação rica
 * Suporta string HTML renderizada, objeto ADF, ou array de objetos ADF
 * Retorna HTML sanitizado pronto para renderização
 */
export function parseJiraDescriptionHTML(description: any): string {
    if (!description) {
        return '';
    }
    
    // Se já é uma string HTML renderizada
    if (typeof description === 'string') {
        // Se contém HTML, preservar e sanitizar
        if (description.includes('<')) {
            // Sanitizar HTML mantendo formatação rica
            return sanitizeHTML(description);
        }
        
        // String simples sem HTML, retornar como parágrafo
        return sanitizeHTML(`<p>${description.trim()}</p>`);
    }
    
    // Se é um objeto ADF, converter para HTML
    if (typeof description === 'object') {
        // Pode ser um documento ADF completo
        if (description.type === 'doc' && Array.isArray(description.content)) {
            const html = adfNodeToHTML(description);
            return sanitizeHTML(html);
        }
        
        // Pode ser um array de nós ADF
        if (Array.isArray(description)) {
            const html = description.map(node => adfNodeToHTML(node)).join('');
            return sanitizeHTML(html);
        }
        
        // Pode ser um único nó ADF
        if (description.type) {
            const html = adfNodeToHTML(description);
            return sanitizeHTML(html);
        }
        
        // Se tem propriedade 'content', tenta processar
        if (description.content) {
            return parseJiraDescriptionHTML(description.content);
        }
        
        // Se tem propriedade 'html', usar ela
        if (description.html) {
            return parseJiraDescriptionHTML(description.html);
        }
        
        // Se tem propriedade 'text', converter para parágrafo
        if (description.text) {
            return sanitizeHTML(`<p>${description.text}</p>`);
        }
    }
    
    // Fallback: retornar vazio
    return '';
}

/**
 * Converte um nó ADF para HTML
 */
function adfNodeToHTML(node: ADFNode): string {
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
        const content = node.content.map(adfNodeToHTML).join('');
        
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
            case 'media':
                // Imagens e outros media
                const mediaType = node.attrs?.type || 'file';
                const url = node.attrs?.url || node.attrs?.src || '';
                const alt = node.attrs?.alt || '';
                if (mediaType === 'file' && url) {
                    return `<img src="${escapeHTML(url)}" alt="${escapeHTML(alt)}" />`;
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

