import React, { useState } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copiar',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const { handleSuccess } = useErrorHandler();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      handleSuccess('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      handleSuccess('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-3 py-1 text-sm bg-surface border border-surface-border rounded hover:bg-surface-hover transition-colors ${className}`}
      title={copied ? 'Copiado!' : 'Copiar'}
    >
      {copied ? '✓' : '📋'}
      <span>{copied ? 'Copiado!' : label}</span>
    </button>
  );
};

