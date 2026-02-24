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
}

/**
 * SectionHeader
 * Padrão v0-like para cabeçalhos de seção: eyebrow opcional + título + descrição.
 * Inclui animação sutil e respeita prefers-reduced-motion.
 */
export const SectionHeader = React.memo<SectionHeaderProps>(
  ({ eyebrow, title, description, align = 'center', as = 'h2', className, compact = false }) => {
    const reduceMotion = useReducedMotion();
    const isCenter = align === 'center';
    const Heading = as;

    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-64px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn('max-w-3xl', isCenter ? 'mx-auto text-center' : 'text-left', className)}
      >
        {eyebrow && (
          <div className={cn(isCenter ? 'flex justify-center' : 'flex justify-start')}>
            <span
              className={cn(
                'badge badge-outline border-primary/30 text-primary bg-primary/10',
                compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3'
              )}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <Heading
          className={cn(
            'font-bold tracking-tight text-base-content',
            compact ? 'text-2xl md:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl',
            eyebrow ? (compact ? 'mt-2' : 'mt-4') : 'mt-0'
          )}
        >
          {title}
        </Heading>

        {description && (
          <p
            className={cn(
              'text-base-content/70 leading-relaxed',
              compact ? 'mt-2 text-sm' : 'mt-4 text-lg sm:text-xl'
            )}
          >
            {description}
          </p>
        )}
      </motion.div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';
