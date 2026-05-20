import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface NewProjectCardProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Card tracejado para criar novo projeto na grade do dashboard — design moderno com animações.
 */
export const NewProjectCard: React.FC<NewProjectCardProps> = ({
  onClick,
  className,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'group relative flex h-full min-h-[13rem] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl sm:min-h-[17rem] sm:gap-4',
      'border-2 border-dashed border-base-300/70 bg-gradient-to-br from-base-100/50 via-transparent to-base-100/30',
      'p-5 text-center transition-all duration-300 ease-out sm:p-6',
      'hover:border-[color-mix(in_srgb,var(--brand-cta)_50%,transparent)]',
      'hover:bg-gradient-to-br hover:from-[color-mix(in_srgb,var(--brand-cta)_4%,transparent)] hover:via-transparent hover:to-[color-mix(in_srgb,var(--brand-highlight)_3%,transparent)]',
      'hover:shadow-[0_8px_30px_-12px_color-mix(in_srgb,var(--brand-cta)_20%,transparent)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_50%,transparent)] focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-base-300/70 disabled:hover:bg-transparent disabled:hover:shadow-none',
      className
    )}
    aria-label="Criar novo projeto"
  >
    {/* Decorative gradient blobs */}
    <div 
      className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.15] group-disabled:group-hover:opacity-0"
      style={{ background: `radial-gradient(circle, var(--brand-cta) 0%, transparent 70%)` }}
      aria-hidden
    />
    <div 
      className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.12] group-disabled:group-hover:opacity-0"
      style={{ background: `radial-gradient(circle, var(--brand-highlight) 0%, transparent 70%)` }}
      aria-hidden
    />

    {/* Icon container with animated ring */}
    <div className="relative">
      {/* Outer animated ring */}
      <div 
        className={cn(
          'absolute inset-0 rounded-full opacity-0 transition-all duration-500',
          'group-hover:opacity-100 group-hover:scale-110 group-disabled:group-hover:opacity-0 group-disabled:group-hover:scale-100'
        )}
        style={{ 
          background: `conic-gradient(from 0deg, var(--brand-cta), var(--brand-highlight), var(--brand-cta))`,
          filter: 'blur(8px)'
        }}
        aria-hidden
      />
      
      {/* Main icon circle */}
      <span
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16',
          'bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-cta)_15%,transparent)] to-[color-mix(in_srgb,var(--brand-highlight)_10%,transparent)]',
          'ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_25%,transparent)]',
          'transition-all duration-300 ease-out',
          'group-hover:scale-105 group-hover:ring-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)]',
          'group-hover:shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--brand-cta)_40%,transparent)]',
          'motion-reduce:transform-none'
        )}
        aria-hidden
      >
        <Plus 
          className={cn(
            'h-7 w-7 text-[var(--brand-cta)] transition-all duration-300 sm:h-8 sm:w-8',
            'group-hover:scale-110 group-hover:rotate-90',
            'motion-reduce:transform-none'
          )} 
          strokeWidth={2} 
        />
      </span>
    </div>

    {/* Text content */}
    <div className="flex flex-col items-center gap-1.5">
      <span className={cn(
        'font-heading text-sm font-bold text-base-content/70 transition-colors duration-300 sm:text-base',
        'group-hover:text-[var(--brand-text-strong)]'
      )}>
        Novo Projeto
      </span>
      <span className={cn(
        'flex items-center gap-1.5 text-[10px] font-medium text-base-content/45 sm:text-[11px]',
        'opacity-0 transition-all duration-300',
        'group-hover:opacity-100'
      )}>
        <Sparkles className="h-3 w-3" aria-hidden />
        Clique para começar
      </span>
    </div>
  </button>
);
