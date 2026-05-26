import React from 'react';
import { cn } from '../../utils/cn';
import { documentsAnalysisBodyClass } from './documentsNeuUi';

export interface DocumentAnalysisBodyProps {
  /** HTML já sanitizado (ex.: retorno de `sanitizeHTML` após `analyzeDocumentContent`). */
  html: string;
  className?: string;
}

/**
 * Container de leitura para análise de documento gerada pela IA.
 */
export const DocumentAnalysisBody: React.FC<DocumentAnalysisBodyProps> = ({ html, className }) => {
  return (
    <div
      className={cn(documentsAnalysisBodyClass, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
