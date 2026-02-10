import React, { useMemo, useState } from 'react';
import { FileIcon } from './FileIcon';
import { JiraGallery, GalleryImage } from './JiraGallery';
import { useJiraImage } from '../../hooks/useJiraImage';

// Tipos simplificados para ADF e Anexos
interface ADFNode {
    type: string;
    content?: ADFNode[];
    text?: string;
    attrs?: any;
    marks?: any[];
}

interface Attachment {
    filename: string;
    url: string;
    mimeType: string;
}

interface JiraContentProps {
    content: string | ADFNode; // Suporta Markdown (string) ou ADF (Objeto)
    attachments?: Attachment[];
    className?: string;
}

// Componente auxiliar para renderizar imagem inline que abre a galeria
const InlineImageTrigger = ({ src, alt, mimeType, onClick }: { src: string, alt: string, mimeType?: string, onClick: () => void }) => {
    const { objectUrl, loading, isImage } = useJiraImage(src, mimeType);
    
    if (!isImage) return <FileIcon fileName={alt} showLabel />;
    
    return (
        <div 
            className="relative group inline-block m-1 cursor-zoom-in overflow-hidden rounded-lg border border-base-300 bg-base-200 align-middle"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            title="Clique para ampliar"
        >
            {loading ? (
                <div className="w-24 h-24 flex items-center justify-center bg-base-200 animate-pulse">
                    <span className="loading loading-spinner loading-xs"></span>
                </div>
            ) : (
                <img 
                    src={objectUrl || ''} 
                    alt={alt} 
                    className="max-w-[200px] max-h-[150px] object-cover transition-transform duration-300 group-hover:scale-105" 
                />
            )}
        </div>
    );
};

export const JiraContent: React.FC<JiraContentProps> = ({ content, attachments = [], className = '' }) => {
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    // MEMOIZAÇÃO DE PARSING: Evita reprocessamento pesado em re-renders
    const { parsedElements, extractedImages } = useMemo(() => {
        const images: GalleryImage[] = [];
        let elements: React.ReactNode[] = [];

        const findAttachment = (filename: string) => attachments.find(a => a.filename === filename);

        // Parser de Markdown (Jira Style)
        const parseMarkdown = (text: string) => {
            // Divide por tags de imagem !imagem.png!
            const parts = text.split(/(![^!]+!)/g);
            
            return parts.map((part, i) => {
                const imgMatch = part.match(/^!([^!]+)!$/);
                if (imgMatch) {
                    const filenameRaw = imgMatch[1].split('|')[0]; // Remove params como |width=200
                    const attachment = findAttachment(filenameRaw);
                    
                    if (attachment && (attachment.mimeType.startsWith('image/') || /\.(jpg|png|gif|webp)$/i.test(filenameRaw))) {
                        const imgIndex = images.length;
                        images.push({
                            src: attachment.url,
                            alt: filenameRaw,
                            filename: filenameRaw,
                            mimeType: attachment.mimeType
                        });
                        return (
                            <InlineImageTrigger 
                                key={i} 
                                src={attachment.url} 
                                alt={filenameRaw} 
                                mimeType={attachment.mimeType}
                                onClick={() => {
                                    setGalleryIndex(imgIndex);
                                    setGalleryOpen(true);
                                }} 
                            />
                        );
                    } else {
                        // Fallback para arquivos não imagem ou não encontrados
                        return (
                            <div key={i} className="inline-flex items-center gap-2 px-2 py-1 bg-base-200 rounded border border-base-300 mx-1">
                                <FileIcon fileName={filenameRaw} />
                                <span className="text-xs font-medium">{filenameRaw}</span>
                            </div>
                        );
                    }
                }
                // Renderiza texto normal (pode ser expandido para suportar negrito, links, etc.)
                return <span key={i} className="whitespace-pre-wrap">{part}</span>;
            });
        };

        // Parser de ADF (Estrutura JSON do Jira)
        const parseADF = (node: ADFNode, keyPrefix: string): React.ReactNode => {
            if (node.type === 'text') return <span key={keyPrefix}>{node.text}</span>;
            
            if (node.type === 'paragraph') {
                return (
                    <p key={keyPrefix} className="mb-2 leading-relaxed">
                        {node.content?.map((child, i) => parseADF(child, `${keyPrefix}-${i}`))}
                    </p>
                );
            }
            
            // Expansão futura: Adicionar suporte a 'media', 'bulletList', etc.
            return null;
        };

        // Seleção de estratégia de parsing
        if (typeof content === 'string') {
            elements = parseMarkdown(content);
        } else if (content && typeof content === 'object' && content.type === 'doc') {
            elements = content.content?.map((node, i) => parseADF(node, `root-${i}`)) || [];
        }

        return { parsedElements: elements, extractedImages: images };
    }, [content, attachments]);

    return (
        <div className={`jira-content-renderer ${className}`}>
            <div className="prose prose-sm max-w-none text-base-content break-words">
                {parsedElements}
            </div>

            {/* Galeria desacoplada do fluxo de texto */}
            <JiraGallery 
                images={extractedImages} 
                isOpen={galleryOpen} 
                initialIndex={galleryIndex} 
                onClose={() => setGalleryOpen(false)} 
            />
        </div>
    );
};