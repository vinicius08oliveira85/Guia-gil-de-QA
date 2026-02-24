import React from 'react';
import { HelpTooltip } from './HelpTooltip';
import { Button } from './Button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
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
  description,
  action,
  secondaryAction,
  tip,
  tips,
  helpContent,
  helpText,
  illustration,
}) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ícone ou ilustração */}
      <motion.div
        className="mb-6"
        aria-hidden="true"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {illustration ? (
          <div className="text-6xl">{illustration}</div>
        ) : typeof icon === 'string' ? (
          <div className="text-6xl">{icon}</div>
        ) : (
          icon
        )}
      </motion.div>

      {/* Título */}
      <motion.div
        className="flex items-center gap-2 mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-base-content">
          {title}
        </h3>
        {helpContent && <HelpTooltip title={helpContent.title} content={helpContent.content} />}
      </motion.div>

      {/* Descrição */}
      {description && (
        <motion.p
          className="text-base-content/70 max-w-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {description}
        </motion.p>
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
        className="flex gap-3 flex-wrap justify-center"
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
