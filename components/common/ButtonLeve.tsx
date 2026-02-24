import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonLeveProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Botão Leve Saúde - Componente de botão seguindo a identidade visual
 *
 * Variantes:
 * - primary: Botão principal (verde #109685)
 * - secondary: Botão secundário com borda
 * - ghost: Botão transparente apenas com texto
 *
 * Tamanhos:
 * - sm: Pequeno
 * - md: Médio (padrão)
 * - lg: Grande
 */
export const ButtonLeve = React.memo<ButtonLeveProps>(
  ({
    variant = 'primary',
    size = 'md',
    children,
    fullWidth = false,
    className = '',
    disabled,
    ...props
  }) => {
    const baseClass =
      variant === 'primary'
        ? 'btn-primary-leve'
        : variant === 'secondary'
          ? 'btn-secondary-leve'
          : 'btn-ghost-leve';

    const sizeClass =
      size === 'sm' ? 'text-sm px-4 py-2' : size === 'lg' ? 'text-lg px-6 py-3' : '';

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        className={`${baseClass} ${sizeClass} ${widthClass} ${className}`}
        disabled={disabled}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ButtonLeve.displayName = 'ButtonLeve';
