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
    const reactId = React.useId();
    const inputId = id || `input-${reactId.replace(/[:]/g, '')}`;
    
    const variantClasses = {
      default: 'input-bordered bg-base-100',
      outlined: 'input-bordered bg-base-100',
      filled: 'border border-base-300 bg-base-200',
    };

    const baseInputClasses = cn(
      'input w-full',
      'text-base-content placeholder:text-base-content/50',
      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
      'transition',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      error && 'input-error focus:ring-error/20',
      success && 'input-success focus:ring-success/20',
      leftIcon ? 'pl-10' : undefined,
      rightIcon ? 'pr-10' : undefined,
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-base-content/70 mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 pointer-events-none">
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 pointer-events-none">
              {rightIcon}
            </div>
          )}
          
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
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
            className="mt-1.5 text-sm text-error flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-base-content/70"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

