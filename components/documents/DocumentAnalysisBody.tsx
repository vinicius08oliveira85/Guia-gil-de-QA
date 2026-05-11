import React from 'react';
import { cn } from '../../utils/cn';

export interface DocumentAnalysisBodyProps {
  /** HTML já sanitizado (ex.: retorno de `sanitizeHTML` após `analyzeDocumentContent`). */
  html: string;
  className?: string;
}

/**
 * Container de leitura para análise de documento gerada pela IA.
 * Mesma base tipográfica que descrições Jira/tarefas (`JiraRichContent`): listas, negrito, espaçamento interno.
 */
export const DocumentAnalysisBody: React.FC<DocumentAnalysisBodyProps> = ({ html, className }) => {
  return (
    <div
      className={cn(
        'document-analysis-body jira-rich-content prose prose-sm max-w-none text-base-content break-words',
        'rounded-xl border border-base-300 bg-base-200/50 px-4 py-5 sm:px-6 sm:py-6 shadow-inner',
        'prose-headings:font-heading prose-headings:text-base-content prose-headings:scroll-mt-4',
        'prose-h2:border-b prose-h2:border-base-300/80 prose-h2:pb-2 prose-h2:mb-3',
        'prose-h3:border-b prose-h3:border-base-200 prose-h3:pb-1.5 prose-h3:mb-2',
        'prose-p:mb-3 prose-p:leading-relaxed prose-p:text-base-content/90',
        'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3 prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3',
        'prose-li:my-1.5 prose-strong:font-bold prose-strong:text-base-content',
        '[&_a]:text-primary [&_a]:underline-offset-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
