import React, { useMemo } from 'react';
import { marked } from 'marked';
import { sanitizeHTML } from '../../utils/sanitize';
import { cn } from '../../utils/cn';

export interface SafeMarkdownProps {
  /** Markdown ou texto simples (fallback com `white-space: pre-wrap` se o parse falhar). */
  source: string;
  className?: string;
}

/**
 * Renderiza Markdown com HTML sanitizado (listas, negrito, etc.).
 * Para texto sem Markdown válido, faz fallback seguro preservando quebras de linha.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ source, className }) => {
  const raw = source ?? '';

  const html = useMemo(() => {
    if (!raw.trim()) return '';
    try {
      return sanitizeHTML(marked(raw, { gfm: true, breaks: true }) as string);
    } catch {
      return '';
    }
  }, [raw]);

  if (!raw.trim()) return null;

  if (!html) {
    return (
      <div className={cn('text-sm text-base-content whitespace-pre-wrap break-words', className)}>
        {raw}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-base-content break-words [&_p]:my-1.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
