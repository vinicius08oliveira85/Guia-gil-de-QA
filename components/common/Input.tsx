import React from 'react';
import { cn } from '../../utils/windows12Styles';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
}

/**
 * Componente Input melhorado com feedback visual
 * 
 * @example
 * ```tsx
 * <Input 
 *   label="Nome do Projeto"
 *   placeholder="Digite o nome..."
 *   error="Campo obrigatório"
 *   leftIcon={<Search />}
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    success, 
    helperText, 
    leftIcon, 
    rightIcon,
    variant = 'default',
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const variantClasses = {
      default: 'bg-surface-input border-surface-border',
      outlined: 'bg-transparent border-2 border-surface-border',
      filled: 'bg-surface-hover border-surface-border',
    };

    const baseInputClasses = cn(
      'w-full px-3 py-2 rounded-lg',
      'text-text-primary placeholder:text-text-secondary/60',
      'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
      'transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      error && 'border-danger focus:ring-danger/50',
      success && 'border-success focus:ring-success/50',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={baseInputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />
          
          {rightIcon && !error && !success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {rightIcon}
            </div>
          )}
          
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger pointer-events-none">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-danger flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-text-secondary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

