import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface CopySectionButtonProps {
  text: string;
  sectionName: string;
  className?: string;
}

/**
 * Botão para copiar seção específica do relatório
 */
export const CopySectionButton: React.FC<CopySectionButtonProps> = ({
  text,
  sectionName,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${sectionName} copiado!`);
    } catch (error) {
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        btn btn-xs btn-ghost
        ${copied ? '!bg-success !text-success-content' : ''}
        ${className}
      `}
      aria-label={`Copiar ${sectionName}`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Copiado!</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copiar</span>
        </>
      )}
    </button>
  );
};

