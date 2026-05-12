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
  const [isHovered, setIsHovered] = React.useState(false);
  const isLabelVisible = isHovered;

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
      custom={isLabelVisible}
      transition={transition}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      aria-pressed={isExpanded}
      className={cn(
        'btn btn-ghost relative flex min-h-[44px] min-w-[44px] items-center justify-center gap-0 overflow-visible rounded-full py-1.5 text-xs font-semibold sm:justify-start',
        'text-[color-mix(in_srgb,var(--foreground)_68%,transparent)]',
        'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'border-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(var(--p))]',
        className
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <AnimatePresence initial={false}>
        {isLabelVisible && (
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
