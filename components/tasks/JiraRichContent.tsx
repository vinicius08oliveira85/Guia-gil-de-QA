import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JiraImage } from '../jira/JiraImage';
import { JiraContentSanitizer, SanitizationConfig } from '../../utils/jiraContentSanitizer';

interface JiraRichContentProps {
  html: string;
  className?: string;
  /** Configuração de sanitização */
  sanitizationConfig?: SanitizationConfig;
}

/**
 * Componente para renderizar conteúdo rico do Jira (HTML) com interceptação de imagens.
 * Usa JiraContentSanitizer para processar e sanitizar conteúdo de forma segura.
 * Substitui tags <img> com classe "jira-image" ou URLs do Jira por componentes JiraImage
 * que carregam imagens com autenticação adequada.
 */
export const JiraRichContent: React.FC<JiraRichContentProps> = ({
  html,
  className = '',
  sanitizationConfig = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRootsRef = useRef<Map<HTMLElement, Root>>(new Map());

  // Evita re-sanitizar conteúdo rico pesado em cada render.
  const sanitized = useMemo(
    () =>
      JiraContentSanitizer.sanitize(html, {
        allowImages: true,
        allowLinks: true,
        allowFormatting: true,
        processJiraImages: true,
        ...sanitizationConfig,
      }),
    [
      html,
      sanitizationConfig.allowFormatting,
      sanitizationConfig.allowImages,
      sanitizationConfig.allowLinks,
      sanitizationConfig.processJiraImages,
      sanitizationConfig.jiraUrl,
      sanitizationConfig.jiraAttachments,
    ]
  );

  useLayoutEffect(() => {
    if (!containerRef.current || !sanitized.html) return;

    const container = containerRef.current;
    const jiraImages = container.querySelectorAll<HTMLImageElement>('img.jira-image, img[data-jira-url]');

    jiraImages.forEach(img => {
      if (img.closest('[data-jira-image-react-root="true"]')) {
        return;
      }

      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const dataJiraUrl = img.getAttribute('data-jira-url') || undefined;
      const width = img.getAttribute('width') || undefined;
      const height = img.getAttribute('height') || undefined;
      const imgClassName = img.getAttribute('class') || '';

      const wrapper = document.createElement('div');
      wrapper.className = 'jira-image-react-wrapper';
      wrapper.style.display = 'inline-block';
      wrapper.setAttribute('data-jira-image-react-root', 'true');
      if (width) wrapper.style.width = width.includes('px') ? width : `${width}px`;
      if (height) wrapper.style.height = height.includes('px') ? height : `${height}px`;

      img.parentNode?.replaceChild(wrapper, img);

      const root = createRoot(wrapper);
      root.render(
        <JiraImage
          src={src}
          alt={alt}
          data-jira-url={dataJiraUrl}
          width={width}
          height={height}
          className={imgClassName.trim()}
        />
      );

      imageRootsRef.current.set(wrapper, root);
    });

    return () => {
      imageRootsRef.current.forEach((root, element) => {
        root.unmount();
      });
      imageRootsRef.current.clear();
    };
  }, [sanitized.html]);

  return (
    <div
      ref={containerRef}
      className={`jira-rich-content prose prose-sm max-w-none dark:prose-invert prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-strong:font-bold prose-ul:my-3 prose-ol:my-3 prose-li:mb-1.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized.html }}
    />
  );
};
