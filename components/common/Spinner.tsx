import React from 'react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Atalho equivalente a `size="sm"` (compatível com usos existentes). */
  small?: boolean;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', small, className }) => {
  const resolved = small ? 'sm' : size;
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
  };

  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent text-primary',
        sizeClasses[resolved],
        className
      )}
      role="status"
      aria-label="Carregando"
    />
  );
};
