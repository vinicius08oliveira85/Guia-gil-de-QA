import React from 'react';
import { FileText, Image as ImageIcon, File, Download, FileCode, FileSpreadsheet, FileType } from 'lucide-react';
import { useJiraImage } from '../../hooks/useJiraImage';

interface JiraAttachmentProps {
    url: string;
    filename: string;
    mimeType?: string;
    size?: number;
    thumbnailUrl?: string;
    id?: string; // ID do anexo no Jira (opcional)
}

const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (filename: string, mimeType?: string) => {
    const lowerName = filename.toLowerCase();
    
    // PDF
    if (mimeType?.includes('pdf') || lowerName.endsWith('.pdf')) {
        return <FileText className="w-8 h-8 text-red-500" />;
    }
    
    // Excel/Spreadsheet
    if (mimeType?.includes('sheet') || mimeType?.includes('excel') || 
        lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
        return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    }
    
    // Word/Document
    if (mimeType?.includes('word') || mimeType?.includes('document') ||
        lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
        return <FileType className="w-8 h-8 text-blue-500" />;
    }
    
    // Code files
    if (mimeType?.includes('code') || mimeType?.includes('text') ||
        lowerName.endsWith('.ts') || lowerName.endsWith('.js') || 
        lowerName.endsWith('.json') || lowerName.endsWith('.xml') ||
        lowerName.endsWith('.html') || lowerName.endsWith('.css')) {
        return <FileCode className="w-8 h-8 text-yellow-500" />;
    }
    
    // Zip/Archive
    if (mimeType?.includes('zip') || mimeType?.includes('archive') ||
        lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || 
        lowerName.endsWith('.7z') || lowerName.endsWith('.tar') || 
        lowerName.endsWith('.gz')) {
        return <File className="w-8 h-8 text-purple-500" />;
    }
    
    // Default
    return <File className="w-8 h-8 text-base-content/50" />;
};

export const JiraAttachment: React.FC<JiraAttachmentProps> = ({ url, filename, mimeType, size, thumbnailUrl, id }) => {
    // Usa o hook para gerenciar o carregamento da imagem (thumbnail ou full)
    const { objectUrl, loading, error, isImage } = useJiraImage(thumbnailUrl || url, mimeType);

    const handleDownload = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (url) {
            window.open(url, '_blank');
        }
    };

    // Renderização para Imagens
    if (isImage) {
        return (
            <div className="group relative flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-2 hover:bg-base-200 transition-colors w-32 sm:w-40">
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-base-200">
                    {loading ? (
                        <div className="flex h-full w-full items-center justify-center animate-pulse">
                            <ImageIcon className="w-8 h-8 text-base-content/20" />
                        </div>
                    ) : error ? (
                        <div className="flex h-full w-full items-center justify-center bg-base-300 text-xs text-base-content/50 flex-col gap-1">
                            <span>Erro</span>
                            <button
                                onClick={handleDownload}
                                className="btn btn-xs btn-ghost"
                                title="Abrir no Jira"
                            >
                                Abrir
                            </button>
                        </div>
                    ) : (
                        <img 
                            src={objectUrl || ''} 
                            alt={filename} 
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    )}
                    {/* Overlay de Download */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button 
                            onClick={handleDownload}
                            className="btn btn-circle btn-sm btn-ghost text-white"
                            title="Baixar imagem"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                    <span className="truncate text-xs font-medium text-base-content" title={filename}>
                        {filename}
                    </span>
                    <span className="text-[10px] text-base-content/60">
                        {formatSize(size)}
                    </span>
                </div>
            </div>
        );
    }

    // Renderização para Outros Arquivos (PDF, Doc, etc)
    return (
        <div 
            onClick={handleDownload}
            className="group relative flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3 hover:bg-base-200 transition-colors cursor-pointer w-full sm:w-auto sm:min-w-[200px]"
        >
            <div className="flex-shrink-0">
                {getFileIcon(filename, mimeType)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-sm font-medium text-base-content group-hover:text-primary transition-colors" title={filename}>
                    {filename}
                </span>
                <span className="text-xs text-base-content/60">{formatSize(size)}</span>
            </div>
            <Download className="w-4 h-4 text-base-content/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};