import React, { useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JiraImage } from '../jira/JiraImage';

interface JiraRichContentProps {
    html: string;
    className?: string;
}

/**
 * Componente para renderizar conteúdo rico do Jira (HTML) com interceptação de imagens.
 * Substitui tags <img> com classe "jira-image" ou URLs do Jira por componentes JiraImage
 * que carregam imagens com autenticação adequada.
 */
export const JiraRichContent: React.FC<JiraRichContentProps> = ({ html, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRootsRef = useRef<Map<HTMLElement, Root>>(new Map());

    useEffect(() => {
        if (!containerRef.current || !html) return;

        const container = containerRef.current;
        
        // Observer para detectar quando imagens são adicionadas ao DOM
        const observer = new MutationObserver(() => {
            // Encontrar todas as imagens do Jira que ainda não foram processadas
            const jiraImages = container.querySelectorAll<HTMLImageElement>(
                'img.jira-image:not(.jira-image-processed), img[data-jira-url]:not(.jira-image-processed)'
            );
            
            jiraImages.forEach((img) => {
                // Marcar como processada
                img.classList.add('jira-image-processed');
                
                // Obter atributos da imagem
                const src = img.getAttribute('src') || '';
                const alt = img.getAttribute('alt') || '';
                const dataJiraUrl = img.getAttribute('data-jira-url') || undefined;
                const width = img.getAttribute('width') || undefined;
                const height = img.getAttribute('height') || undefined;
                const imgClassName = img.getAttribute('class') || '';
                
                // Criar wrapper para o componente React
                const wrapper = document.createElement('div');
                wrapper.className = 'jira-image-react-wrapper';
                wrapper.style.display = 'inline-block';
                if (width) wrapper.style.width = width.includes('px') ? width : `${width}px`;
                if (height) wrapper.style.height = height.includes('px') ? height : `${height}px`;
                
                // Substituir imagem pelo wrapper
                img.parentNode?.replaceChild(wrapper, img);
                
                // Renderizar componente React no wrapper
                const root = createRoot(wrapper);
                root.render(
                    <JiraImage
                        src={src}
                        alt={alt}
                        data-jira-url={dataJiraUrl}
                        width={width}
                        height={height}
                        className={imgClassName.replace('jira-image-processed', '').trim()}
                    />
                );
                
                // Armazenar root para cleanup
                imageRootsRef.current.set(wrapper, root);
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
        });

        // Processar imagens já existentes
        const initialImages = container.querySelectorAll<HTMLImageElement>(
            'img.jira-image, img[data-jira-url]'
        );
        initialImages.forEach((img) => {
            if (!img.classList.contains('jira-image-processed')) {
                // Disparar processamento
                const event = new Event('DOMNodeInserted');
                img.dispatchEvent(event);
            }
        });

        return () => {
            observer.disconnect();
            // Cleanup: desmontar todos os roots React
            imageRootsRef.current.forEach((root, element) => {
                root.unmount();
                imageRootsRef.current.delete(element);
            });
        };
    }, [html]);

    return (
        <div
            ref={containerRef}
            className={`jira-rich-content prose prose-sm max-w-none dark:prose-invert ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};


