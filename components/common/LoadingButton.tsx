import React from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  type = 'button',
  ...props
}) => {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      className={cn(className, isLoading && 'cursor-wait opacity-90')}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner size="sm" />
          <span>{loadingText ?? 'Carregando…'}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
