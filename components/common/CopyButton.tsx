import React, { useState } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { cn } from '../../utils/cn';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copiar',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const { handleSuccess } = useErrorHandler();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      handleSuccess('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
      type="button"
      onClick={handleCopy}
      className={cn(
        'leve-neu-pill inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold',
        'text-base-content/72 transition-[box-shadow,color] duration-200',
        'hover:text-primary',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className
      )}
      title={copied ? 'Copiado!' : 'Copiar'}
      aria-label={copied ? 'Copiado' : label}
    >
      {copied ? '✓' : '📋'}
      <span>{copied ? 'Copiado!' : label}</span>
    </button>
  );
};
