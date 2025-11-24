import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-white/5 text-text-secondary border-white/10',
    success: 'bg-success/15 text-success font-semibold border-success/30',
    warning: 'bg-warning/15 text-warning-dark border-warning/30',
    error: 'bg-danger/15 text-danger border-danger/30',
    info: 'bg-info/15 text-info border-info/30'
  };

  const sizeClasses = {
    sm: 'chip-compact text-[0.68rem]',
    md: 'h-7 px-2 text-[0.72rem]',
    lg: 'h-8 px-3 text-[0.8rem]'
  };

  return (
    <span
      className={`badge-chip whitespace-nowrap truncate font-semibold transition-transform duration-200 hover:scale-105 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </span>
  );
};

