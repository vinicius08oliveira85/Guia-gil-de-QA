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
 * Suporta string simples, objeto ADF, ou array de objetos ADF
 */
export function parseJiraDescription(description: any): string {
    if (!description) {
        return '';
    }
    
    // Se já é uma string, retorna como está
    if (typeof description === 'string') {
        // Remove tags HTML se houver
        return description.replace(/<[^>]*>/g, '').trim();
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
    }
    
    // Fallback: converte para string
    try {
        return JSON.stringify(description);
    } catch {
        return '';
    }
}

