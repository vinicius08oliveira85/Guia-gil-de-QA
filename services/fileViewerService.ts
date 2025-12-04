import { logger } from '../utils/logger';

export type FileViewerType = 'pdf' | 'image' | 'text' | 'excel' | 'word' | 'csv' | 'json' | 'other';

export interface FileViewerOptions {
    openInNewTab?: boolean;
    download?: boolean;
}

/**
 * Detecta o tipo de arquivo baseado no nome e tipo MIME
 */
export const detectFileType = (fileName: string, mimeType?: string): FileViewerType => {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
        return 'pdf';
    }
    
    if (mimeType?.startsWith('image/') || 
        lowerName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
        return 'image';
    }
    
    if (mimeType?.startsWith('text/') || 
        lowerName.endsWith('.txt') || 
        lowerName.endsWith('.md')) {
        return 'text';
    }
    
    if (lowerName.endsWith('.xlsx') || 
        lowerName.endsWith('.xls') || 
        mimeType?.includes('spreadsheet') || 
        mimeType?.includes('excel')) {
        return 'excel';
    }
    
    if (lowerName.endsWith('.docx') || 
        lowerName.endsWith('.doc') || 
        mimeType?.includes('word') || 
        mimeType?.includes('document')) {
        return 'word';
    }
    
    if (lowerName.endsWith('.csv') || mimeType === 'text/csv') {
        return 'csv';
    }
    
    if (lowerName.endsWith('.json') || mimeType === 'application/json') {
        return 'json';
    }
    
    return 'other';
};

/**
 * Verifica se um arquivo pode ser visualizado diretamente no navegador
 */
export const canViewInBrowser = (fileType: FileViewerType): boolean => {
    return ['pdf', 'image', 'text', 'json', 'csv'].includes(fileType);
};

/**
 * Visualiza um arquivo em uma nova aba do navegador
 * Otimizado para melhor performance
 */
export const viewFileInNewTab = (
    content: string | ArrayBuffer | Blob,
    fileName: string,
    mimeType: string,
    options: FileViewerOptions = {}
): void => {
    try {
        // Se for uma data URL, usar diretamente (mais rápido)
        if (typeof content === 'string' && content.startsWith('data:')) {
            // Usar window.open para melhor performance
            const newWindow = window.open(content, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                // Fallback se popup foi bloqueado
                const link = document.createElement('a');
                link.href = content;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                // Remover de forma assíncrona para não bloquear
                requestAnimationFrame(() => {
                    document.body.removeChild(link);
                });
            }
            logger.info(`Arquivo visualizado em nova aba: ${fileName}`, 'FileViewerService');
            return;
        }

        // Para outros tipos, criar blob e URL
        let blob: Blob;
        if (content instanceof Blob) {
            blob = content;
        } else if (content instanceof ArrayBuffer) {
            blob = new Blob([content], { type: mimeType });
        } else if (typeof content === 'string') {
            blob = new Blob([content], { type: mimeType });
        } else {
            throw new Error('Tipo de conteúdo não suportado');
        }

        const url = URL.createObjectURL(blob);
        
        // Usar window.open para melhor performance
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
            // Fallback se popup foi bloqueado
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.download = options.download ? fileName : '';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            // Remover de forma assíncrona
            requestAnimationFrame(() => {
                document.body.removeChild(link);
                // Limpar URL após um tempo para liberar memória
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            });
        } else {
            // Limpar URL após um tempo se window.open funcionou
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        
        logger.info(`Arquivo visualizado em nova aba: ${fileName}`, 'FileViewerService');
    } catch (error) {
        logger.error('Erro ao visualizar arquivo', 'FileViewerService', error);
        throw new Error(`Erro ao visualizar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Baixa um arquivo
 */
export const downloadFile = (
    content: string | ArrayBuffer | Blob,
    fileName: string,
    mimeType: string
): void => {
    try {
        let blob: Blob;
        
        if (content instanceof Blob) {
            blob = content;
        } else if (content instanceof ArrayBuffer) {
            blob = new Blob([content], { type: mimeType });
        } else if (typeof content === 'string') {
            if (content.startsWith('data:')) {
                // Converter data URL para blob
                const response = fetch(content);
                response.then(res => res.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                });
                return;
            }
            blob = new Blob([content], { type: mimeType });
        } else {
            throw new Error('Tipo de conteúdo não suportado');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        logger.info(`Arquivo baixado: ${fileName}`, 'FileViewerService');
    } catch (error) {
        logger.error('Erro ao baixar arquivo', 'FileViewerService', error);
        throw new Error(`Erro ao baixar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Converte base64 data URL para Blob
 */
export const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

/**
 * Obtém a URL de visualização para um arquivo
 */
export const getFileViewerURL = (
    content: string | ArrayBuffer | Blob,
    mimeType: string
): string => {
    try {
        let blob: Blob;
        
        if (content instanceof Blob) {
            blob = content;
        } else if (content instanceof ArrayBuffer) {
            blob = new Blob([content], { type: mimeType });
        } else if (typeof content === 'string') {
            if (content.startsWith('data:')) {
                return content;
            }
            blob = new Blob([content], { type: mimeType });
        } else {
            throw new Error('Tipo de conteúdo não suportado');
        }

        return URL.createObjectURL(blob);
    } catch (error) {
        logger.error('Erro ao criar URL de visualização', 'FileViewerService', error);
        throw new Error(`Erro ao criar URL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

/**
 * Visualiza um arquivo baseado no tipo detectado
 */
export const viewFile = (
    content: string | ArrayBuffer | Blob,
    fileName: string,
    mimeType?: string,
    options: FileViewerOptions = {}
): void => {
    const fileType = detectFileType(fileName, mimeType);
    
    if (options.download) {
        downloadFile(content, fileName, mimeType || 'application/octet-stream');
        return;
    }

    if (canViewInBrowser(fileType) || options.openInNewTab) {
        viewFileInNewTab(content, fileName, mimeType || 'application/octet-stream', options);
    } else {
        // Para arquivos que não podem ser visualizados, fazer download
        downloadFile(content, fileName, mimeType || 'application/octet-stream');
    }
};

