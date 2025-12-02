import React from 'react';
import { ButtonLeve } from './ButtonLeve';

interface InfoCardLeveProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Card de Informação Leve Saúde - Componente de card para informações
 * 
 * Variantes:
 * - default: Card padrão com fundo branco
 * - info: Card informativo com fundo suave verde
 */
export const InfoCardLeve = React.memo<InfoCardLeveProps>(({
  title,
  children,
  variant = 'default',
  actionLabel,
  onAction,
  className = '',
}) => {
  const cardClass = variant === 'info' 
    ? 'card-info-leve' 
    : 'card-leve';
  
  return (
    <div className={`${cardClass} ${className}`}>
      <h4 className="card-title">{title}</h4>
      <div className="card-text">
        {children}
      </div>
      {actionLabel && onAction && (
        <div className="mt-4">
          <ButtonLeve variant="ghost" onClick={onAction}>
            {actionLabel}
          </ButtonLeve>
        </div>
      )}
    </div>
  );
});

InfoCardLeve.displayName = 'InfoCardLeve';

