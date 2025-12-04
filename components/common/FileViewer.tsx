import React, { useState, useCallback, useRef, useEffect } from 'react';
import { viewFile, downloadFile, detectFileType, canViewInBrowser, getFileViewerURL, dataURLToBlob } from '../../services/fileViewerService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

/**
 * Componente para visualização de imagens com zoom e navegação
 */
const ImageViewer: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.25, 5));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleResetZoom = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [scale, position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, dragStart, scale]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mouseup', handleGlobalMouseUp);
            return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
        }
    }, [isDragging]);

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Controles de zoom */}
            <div className="flex gap-2 justify-end mb-2 p-2 bg-surface/50 rounded">
                <button
                    onClick={handleZoomOut}
                    className="btn btn-sm btn-secondary"
                    disabled={scale <= 0.5}
                    title="Diminuir zoom"
                >
                    ➖
                </button>
                <span className="px-3 py-1 text-sm text-text-secondary">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    onClick={handleZoomIn}
                    className="btn btn-sm btn-secondary"
                    disabled={scale >= 5}
                    title="Aumentar zoom"
                >
                    ➕
                </button>
                <button
                    onClick={handleResetZoom}
                    className="btn btn-sm btn-secondary"
                    title="Resetar zoom"
                >
                    🔄
                </button>
            </div>

            {/* Área de visualização da imagem */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative bg-surface-hover rounded cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        className="max-w-none max-h-none object-contain select-none"
                        draggable={false}
                    />
                </div>
            </div>

            {/* Dica de uso */}
            <div className="text-xs text-text-tertiary mt-2 text-center">
                {scale > 1 ? 'Arraste para mover • ' : ''}
                Ctrl + Scroll para zoom • Clique nos botões para ajustar
            </div>
        </div>
    );
};

export interface FileViewerProps {
    content: string | ArrayBuffer | Blob;
    fileName: string;
    mimeType?: string;
    onClose?: () => void;
    showDownload?: boolean;
    showViewInNewTab?: boolean;
}

/**
 * Componente para visualizar arquivos
 * Suporta visualização inline e em nova aba
 */
export const FileViewer: React.FC<FileViewerProps> = React.memo(({
    content,
    fileName,
    mimeType,
    onClose,
    showDownload = true,
    showViewInNewTab = true
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [viewerURL, setViewerURL] = useState<string | null>(null);
    const { handleError, handleSuccess } = useErrorHandler();
    
    const fileType = detectFileType(fileName, mimeType);
    const canView = canViewInBrowser(fileType);

    React.useEffect(() => {
        if (canView && content) {
            try {
                const url = getFileViewerURL(content, mimeType || 'application/octet-stream');
                setViewerURL(url);
                return () => {
                    if (url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                    }
                };
            } catch (error) {
                handleError(error, 'Carregar visualizador');
            }
        }
    }, [content, mimeType, canView, handleError]);

    const handleViewInNewTab = useCallback(() => {
        // Executar de forma assíncrona para não bloquear UI
        requestAnimationFrame(() => {
            try {
                setIsLoading(true);
                viewFile(content, fileName, mimeType, { openInNewTab: true });
                // Usar setTimeout para não bloquear
                setTimeout(() => {
                    handleSuccess('Arquivo aberto em nova aba');
                    setIsLoading(false);
                }, 0);
            } catch (error) {
                handleError(error, 'Abrir arquivo');
                setIsLoading(false);
            }
        });
    }, [content, fileName, mimeType, handleError, handleSuccess]);

    const handleDownload = useCallback(() => {
        // Executar de forma assíncrona para não bloquear UI
        requestAnimationFrame(() => {
            try {
                setIsLoading(true);
                downloadFile(content, fileName, mimeType || 'application/octet-stream');
                // Usar setTimeout para não bloquear
                setTimeout(() => {
                    handleSuccess('Arquivo baixado com sucesso');
                    setIsLoading(false);
                }, 0);
            } catch (error) {
                handleError(error, 'Baixar arquivo');
                setIsLoading(false);
            }
        });
    }, [content, fileName, mimeType, handleError, handleSuccess]);

    // Se não pode visualizar inline, mostrar apenas opções de download/view
    if (!canView) {
        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title={`Visualizar: ${fileName}`}
            >
                <div className="p-4">
                    <p className="text-text-secondary mb-4">
                        Este tipo de arquivo não pode ser visualizado diretamente no navegador.
                    </p>
                    <div className="flex gap-2">
                        {showViewInNewTab && (
                            <button
                                onClick={handleViewInNewTab}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? <Spinner size="sm" /> : 'Abrir em Nova Aba'}
                            </button>
                        )}
                        {showDownload && (
                            <button
                                onClick={handleDownload}
                                disabled={isLoading}
                                className="btn btn-secondary"
                            >
                                {isLoading ? <Spinner size="sm" /> : 'Baixar'}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }

    // Visualização inline para PDF, imagens, texto, etc.
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={fileName}
            size="large"
        >
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
                        <Spinner />
                    </div>
                )}
                
                <div className="flex flex-col gap-4">
                    {/* Barra de ações */}
                    <div className="flex gap-2 justify-end border-b border-surface-border pb-2">
                        {showViewInNewTab && (
                            <button
                                onClick={handleViewInNewTab}
                                disabled={isLoading}
                                className="btn btn-sm btn-secondary"
                            >
                                Abrir em Nova Aba
                            </button>
                        )}
                        {showDownload && (
                            <button
                                onClick={handleDownload}
                                disabled={isLoading}
                                className="btn btn-sm btn-secondary"
                            >
                                Baixar
                            </button>
                        )}
                    </div>

                    {/* Visualizador */}
                    <div className="flex-1 overflow-auto max-h-[70vh]">
                        {fileType === 'pdf' && viewerURL && (
                            <iframe
                                src={viewerURL}
                                className="w-full h-full min-h-[500px] border-0"
                                title={fileName}
                            />
                        )}
                        
                        {fileType === 'image' && viewerURL && (
                            <ImageViewer
                                src={viewerURL}
                                alt={fileName}
                            />
                        )}
                        
                        {(fileType === 'text' || fileType === 'json' || fileType === 'csv') && viewerURL && (
                            <pre className="p-4 bg-surface-hover rounded overflow-auto text-sm">
                                {typeof content === 'string' 
                                    ? (content.startsWith('data:') 
                                        ? content.split(',')[1] 
                                        : content)
                                    : 'Conteúdo não disponível'}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
});

FileViewer.displayName = 'FileViewer';

