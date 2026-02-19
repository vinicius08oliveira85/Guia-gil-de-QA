import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '.5rem',
    paddingRight: '.5rem',
  },
  animate: (isExpanded: boolean) => ({
    gap: isExpanded ? '.5rem' : 0,
    paddingLeft: isExpanded ? '.75rem' : '.5rem',
    paddingRight: isExpanded ? '.75rem' : '.5rem',
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: 'spring' as const, bounce: 0, duration: 0.6 };

export interface ExpansibleButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
  isExpanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Botão que mostra apenas o ícone quando recolhido e expande animadamente para exibir o texto ao lado.
 */
export const ExpansibleButton: React.FC<ExpansibleButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  className,
  ariaLabel,
  title,
  isExpanded,
  onExpandedChange,
}) => {
  const handleClick = () => {
    onExpandedChange?.(!isExpanded);
    onClick();
  };

  return (
    <motion.button
      title={title}
      type="button"
      variants={buttonVariants}
      initial={false}
      animate="animate"
      custom={isExpanded}
      transition={transition}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      aria-pressed={isExpanded}
      className={cn(
        'relative flex items-center rounded-full py-1.5 text-xs font-semibold transition-colors duration-300',
        'text-base-content/70 hover:bg-base-200 hover:text-base-content disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.span
            variants={spanVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

ExpansibleButton.displayName = 'ExpansibleButton';
