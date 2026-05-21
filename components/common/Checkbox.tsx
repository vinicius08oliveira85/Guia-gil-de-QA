import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
  /** Variante visual: default (verde), brand (laranja), highlight (roxo) */
  variant?: 'default' | 'brand' | 'highlight';
}

/**
 * Checkbox estilizado seguindo a identidade visual do projeto.
 * 
 * Exibe um ícone de check em container arredondado com fundo colorido quando marcado.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, variant = 'default', className, id, disabled, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || `checkbox-${reactId.replace(/[:]/g, '')}`;

    const variantStyles = {
      default: {
        checked: 'bg-success/15 border-success/40 ring-1 ring-success/30',
        icon: 'text-success',
        hover: 'hover:border-success/50 hover:bg-success/5',
      },
      brand: {
        checked: 'bg-[color-mix(in_srgb,var(--brand-cta)_15%,transparent)] border-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)]',
        icon: 'text-[var(--brand-cta)]',
        hover: 'hover:border-[color-mix(in_srgb,var(--brand-cta)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-cta)_5%,transparent)]',
      },
      highlight: {
        checked: 'bg-[color-mix(in_srgb,var(--brand-highlight)_15%,transparent)] border-[color-mix(in_srgb,var(--brand-highlight)_40%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--brand-highlight)_30%,transparent)]',
        icon: 'text-[var(--brand-highlight)]',
        hover: 'hover:border-[color-mix(in_srgb,var(--brand-highlight)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-highlight)_5%,transparent)]',
      },
    };

    const styles = variantStyles[variant];

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-base-300/60 bg-base-100 transition-all duration-150',
            !disabled && styles.hover,
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-error/50'
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            disabled={disabled}
            className="peer sr-only"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined}
            {...props}
          />
          {/* Box checked state */}
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-[5px] opacity-0 transition-all duration-150',
              'peer-checked:opacity-100',
              styles.checked
            )}
            aria-hidden="true"
          >
            <Check className={cn('h-4 w-4', styles.icon)} strokeWidth={3} />
          </span>
          {/* Unchecked border highlight on focus */}
          <span
            className="absolute inset-0 rounded-[5px] ring-2 ring-transparent transition-all peer-focus-visible:ring-[var(--brand-cta)]/30"
            aria-hidden="true"
          />
        </label>

        {(label || description || error) && (
          <div className="flex flex-col gap-0.5 pt-0.5">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'cursor-pointer text-sm font-medium text-base-content',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {label}
              </label>
            )}
            {description && !error && (
              <p id={`${inputId}-desc`} className="text-xs text-base-content/60">
                {description}
              </p>
            )}
            {error && (
              <p id={`${inputId}-error`} className="text-xs text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
