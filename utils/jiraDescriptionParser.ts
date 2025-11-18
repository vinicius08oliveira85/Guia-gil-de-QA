/**
 * Utilitário para converter descrições do Jira (ADF - Atlassian Document Format) para texto/HTML
 */

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

