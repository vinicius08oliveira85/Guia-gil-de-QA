import React from 'react';
import { Download } from 'lucide-react';
import { FilePreview } from '../common/FilePreview';
import { jiraMediaService } from '../../services/jiraMediaService';

interface JiraAttachmentProps {
    url: string;
    filename: string;
    mimeType?: string;
    size?: number;
    thumbnailUrl?: string;
    id: string; // ID do anexo no Jira (obrigatório)
}

export const JiraAttachment: React.FC<JiraAttachmentProps> = ({ 
    url, 
    filename, 
    mimeType, 
    size, 
    id 
}) => {
    const handleDownload = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (url) {
            window.open(url, '_blank');
        }
    };
    
    // Detectar tipo de mídia
    const mediaType = jiraMediaService.detectMediaType(filename, mimeType);

    // Usar FilePreview para renderização polimórfica
    return (
        <div 
            onClick={handleDownload}
            className="group relative rounded-lg border border-base-300 bg-base-100 p-2 hover:bg-base-200 transition-colors cursor-pointer"
        >
            <FilePreview
                attachmentId={id}
                filename={filename}
                size={size}
                url={url}
                mimeType={mimeType}
                mediaType={mediaType}
                className="w-32 sm:w-40"
                width="100%"
                height="auto"
            />
            {mediaType === 'image' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 rounded-md">
                    <button 
                        onClick={handleDownload}
                        className="btn btn-circle btn-sm btn-ghost text-white"
                        title="Baixar imagem"
                    >
                        <Download size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};