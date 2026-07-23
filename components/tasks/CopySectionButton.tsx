import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface CopySectionButtonProps {
  text: string;
  sectionName: string;
  className?: string;
}

export const CopySectionButton: React.FC<CopySectionButtonProps> = ({
  text,
  sectionName,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${sectionName} copiado!`);
    } catch {
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={copied ? '!bg-success !text-success-content' : ''}
      aria-label={`Copiar ${sectionName}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
    </Button>
  );
};
