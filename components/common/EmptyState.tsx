import React from 'react';
import { HelpTooltip } from './HelpTooltip';
import { Button } from './Button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  /** Descrição principal (alias: message, para compatibilidade) */
  description?: string;
  message?: string;
  /** Lista de sugestões exibida abaixo da descrição (ex.: modal de relatório de falhas) */
  suggestions?: string[];
  /** Reduz padding e tamanhos para caber em painéis (ex.: modal Planejamento) */
  compact?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tip?: string;
  tips?: string[];
  helpContent?: {
    title: string;
    content: string;
  };
  helpText?: string;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description: descriptionProp,
  message,
  suggestions,
  compact = false,
  action,
  secondaryAction,
  tip,
  tips,
  helpContent,
  helpText,
  illustration,
}) => {
  const description = descriptionProp ?? message;
  const wrapperClass = compact
    ? 'flex flex-col items-center justify-center py-2 px-2 text-center'
    : 'flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto';
  const iconWrapperClass = compact ? 'mb-1' : 'mb-6';
  const iconSizeClass = compact ? 'text-2xl' : 'text-6xl';
  const titleWrapperClass = compact
    ? 'flex items-center gap-2 mb-0.5'
    : 'flex items-center gap-2 mb-3';
  const titleClass = compact
    ? 'text-xs font-semibold tracking-tight text-base-content'
    : 'text-xl sm:text-2xl font-semibold tracking-tight text-base-content';
  const descClass = compact
    ? 'text-base-content/70 max-w-md mb-0 text-xs'
    : 'text-base-content/70 max-w-md mb-6';

  return (
    <motion.div
      className={wrapperClass}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: compact ? 8 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: compact ? 0.2 : 0.4 }}
    >
      {/* Ícone ou ilustração */}
      <motion.div
        className={iconWrapperClass}
        aria-hidden="true"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.2 }}
      >
        {illustration ? (
          <div className={iconSizeClass}>{illustration}</div>
        ) : typeof icon === 'string' ? (
          <div className={iconSizeClass}>{icon}</div>
        ) : (
          icon
        )}
      </motion.div>

      {/* Título */}
      <motion.div
        className={titleWrapperClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: compact ? 0.1 : 0.2 }}
      >
        <h3 className={titleClass}>{title}</h3>
        {helpContent && <HelpTooltip title={helpContent.title} content={helpContent.content} />}
      </motion.div>

      {/* Descrição */}
      {description && (
        <motion.p
          className={descClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {description}
        </motion.p>
      )}

      {/* Sugestões (lista) */}
      {suggestions && suggestions.length > 0 && (
        <motion.ul
          className="text-sm text-base-content/70 max-w-md mb-6 space-y-1 text-left list-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {suggestions.map((s, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
              {s}
            </li>
          ))}
        </motion.ul>
      )}

      {/* Dica única */}
      {tip && (
        <motion.div
          className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-base-content leading-relaxed">
            💡 <strong>Dica:</strong> {tip}
          </p>
        </motion.div>
      )}

      {/* Texto de ajuda */}
      {helpText && (
        <motion.p
          className="text-xs text-base-content/70 max-w-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {helpText}
        </motion.p>
      )}

      {/* Ações */}
      <motion.div
        className="flex flex-wrap justify-center"
        style={{ gap: '0.75rem' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {action && (
          <Button
            variant={action.variant === 'secondary' ? 'outline' : 'default'}
            onClick={action.onClick}
            className="min-h-[44px]"
            aria-label={action.label}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="min-h-[44px]"
            aria-label={secondaryAction.label}
          >
            {secondaryAction.label}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};
