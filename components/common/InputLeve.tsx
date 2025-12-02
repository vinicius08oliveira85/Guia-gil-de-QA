import React from 'react';

export type InputState = 'default' | 'error' | 'success';

interface InputLeveProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  state?: InputState;
  fullWidth?: boolean;
}

/**
 * Input Leve Saúde - Componente de input seguindo a identidade visual
 * 
 * Estados:
 * - default: Estado normal
 * - error: Estado de erro (borda vermelha)
 * - success: Estado de sucesso (borda verde)
 */
export const InputLeve = React.memo<InputLeveProps>(({
  label,
  error,
  helperText,
  state = 'default',
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const stateClass = state === 'error' 
    ? 'error' 
    : state === 'success' 
    ? 'success' 
    : '';
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <div className={`${widthClass}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="label-leve"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-leve ${stateClass} ${widthClass} ${className}`}
        aria-invalid={state === 'error'}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className="text-sm text-red-600 mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          id={`${inputId}-helper`}
          className="text-sm text-gray-600 mt-1"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

InputLeve.displayName = 'InputLeve';

