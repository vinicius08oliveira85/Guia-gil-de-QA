import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

type SectionHeaderAlign = 'left' | 'center';
type SectionHeaderHeading = 'h1' | 'h2' | 'h3';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: SectionHeaderAlign;
  as?: SectionHeaderHeading;
  className?: string;
  /** Reduz título, margens e descrição para alinhar ao padrão das abas (ex.: ProjectView). */
  compact?: boolean;
  /**
   * Quando true, não aplica `max-w-3xl` — use em layouts flex (ex.: cabeçalho de projeto)
   * para o título ocupar a largura disponível sem conflito de classes Tailwind.
   */
  fullWidth?: boolean;
}

/**
 * SectionHeader
 * Padrão v0-like para cabeçalhos de seção: eyebrow opcional + título + descrição.
 * Inclui animação sutil e respeita prefers-reduced-motion.
 */
export const SectionHeader = React.memo<SectionHeaderProps>(({
  eyebrow,
  title,
  description,
  align = 'center',
  as = 'h2',
  className,
  compact = false,
  fullWidth = false,
}) => {
  const reduceMotion = useReducedMotion();
  const isCenter = align === 'center';
  const Heading = as;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'min-w-0 w-full',
        !fullWidth && 'max-w-3xl',
        isCenter ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && (
        <div className={cn(isCenter ? 'flex justify-center' : 'flex justify-start')}>
          <span className={cn(
            'badge badge-outline border-primary/30 text-primary bg-primary/10',
            compact ? 'px-2.5 py-0.5 text-[11px] leading-tight' : 'px-4 py-3'
          )}>
            {eyebrow}
          </span>
        </div>
      )}

      <Heading className={cn(
        'font-heading font-semibold tracking-tight text-balance text-base-content',
        compact
          ? 'text-[clamp(1.2rem,2.5vw,1.75rem)] leading-snug md:text-[clamp(1.3rem,2vw,1.9rem)]'
          : 'text-[clamp(1.75rem,4vw,3rem)] sm:text-[clamp(2rem,3.5vw,3.5rem)] md:text-[clamp(2.25rem,3vw,4rem)]',
        eyebrow ? (compact ? 'mt-1' : 'mt-4') : 'mt-0',
        'transition-colors duration-200'
      )}>
        {title}
      </Heading>

      {description && (
        <p className={cn(
          'font-body text-balance text-base-content/70',
          compact ? 'mt-1 text-sm leading-snug' : 'mt-4 text-lg leading-relaxed sm:text-xl'
        )}>
          {description}
        </p>
      )}
    </motion.div>
  );
});

SectionHeader.displayName = 'SectionHeader';


