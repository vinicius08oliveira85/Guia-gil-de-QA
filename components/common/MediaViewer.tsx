import React, { useState } from 'react';
import { FilePreview, PDFPreview } from './FilePreview';
import { PDFViewer } from './PDFViewer';
import { VideoViewer } from './VideoViewer';
import { AudioViewer } from './AudioViewer';
import { MediaType } from '../../services/jiraMediaService';
import { X, Download, ExternalLink } from 'lucide-react';

interface MediaViewerProps {
    /** ID do anexo no Jira */
    attachmentId: string;
    /** Nome do arquivo */
    filename: string;
    /** Tamanho do arquivo */
    size?: number;
    /** URL do arquivo */
    url: string;
    /** Tipo de mídia */
    mediaType: MediaType;
    /** MIME type */
    mimeType?: string;
    /** Se está aberto */
    isOpen: boolean;
    /** Callback para fechar */
    onClose: () => void;
}

/**
 * Componente de visualizador de mídia escalável
 * Preparado para suportar diferentes tipos de visualizadores no futuro
 */
export const MediaViewer: React.FC<MediaViewerProps> = ({
    attachmentId,
    filename,
    size,
    url,
    mediaType,
    mimeType,
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        window.open(url, '_blank');
    };

    const handleOpenExternal = () => {
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-50"
                aria-label="Fechar"
            >
                <X size={32} />
            </button>

            <div className="relative max-w-[90vw] max-h-[85vh] bg-base-100 rounded-lg p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-base-content truncate flex-1 mr-4" title={filename}>
                        {filename}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="btn btn-sm btn-ghost"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={handleOpenExternal}
                            className="btn btn-sm btn-ghost"
                            title="Abrir em nova aba"
                        >
                            <ExternalLink size={16} />
                        </button>
                    </div>
                </div>

                <div className="media-viewer-content">
                    {mediaType === 'image' && (
                        <FilePreview
                            attachmentId={attachmentId}
                            filename={filename}
                            size={size}
                            url={url}
                            mimeType={mimeType}
                            mediaType={mediaType}
                            className="max-w-full max-h-[70vh]"
                        />
                    )}

                    {mediaType === 'pdf' && (
                        <div className="pdf-viewer-container h-[80vh]">
                            <PDFViewer
                                url={url}
                                filename={filename}
                                onDownload={handleDownload}
                                onOpenExternal={handleOpenExternal}
                            />
                        </div>
                    )}

                    {(mimeType?.startsWith('video/')) && (
                        <div className="video-viewer-container">
                            <VideoViewer
                                url={url}
                                filename={filename}
                                mimeType={mimeType}
                                onDownload={handleDownload}
                                onOpenExternal={handleOpenExternal}
                            />
                        </div>
                    )}

                    {(mimeType?.startsWith('audio/')) && (
                        <div className="audio-viewer-container">
                            <AudioViewer
                                url={url}
                                filename={filename}
                                mimeType={mimeType}
                                onDownload={handleDownload}
                                onOpenExternal={handleOpenExternal}
                            />
                        </div>
                    )}

                    {(mediaType === 'document' || mediaType === 'spreadsheet' || mediaType === 'other') && (
                        <div className="document-viewer-container p-8 text-center">
                            <FilePreview
                                attachmentId={attachmentId}
                                filename={filename}
                                size={size}
                                url={url}
                                mimeType={mimeType}
                                mediaType={mediaType}
                                iconSize={64}
                            />
                            <p className="text-sm text-base-content/70 mt-4 mb-4">
                                Visualização de {mediaType} será implementada em breve
                            </p>
                            <button
                                onClick={handleOpenExternal}
                                className="btn btn-primary"
                            >
                                Abrir arquivo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

