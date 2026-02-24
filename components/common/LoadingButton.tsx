import React from 'react';
import { Spinner } from './Spinner';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner small />
          {loadingText || 'Carregando...'}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
