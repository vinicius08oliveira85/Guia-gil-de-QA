import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from 'usehooks-ts';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: 'separator';
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (id: string | null) => void;
  /** Conteúdo opcional renderizado antes das abas, dentro do mesmo container pill. */
  leadingContent?: React.ReactNode;
  /** Chamado quando o usuário clica fora do container (para recolher leadingContent expansível, etc.). */
  onOutsideClick?: () => void;
  /** Badge numérico ancorado a um ícone de aba (ex.: notificações). */
  tabBadge?: { tabId: string; count: number };
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '.5rem',
    paddingRight: '.5rem',
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '.5rem' : 0,
    paddingLeft: isSelected ? '.75rem' : '.5rem',
    paddingRight: isSelected ? '.75rem' : '.5rem',
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: 'spring', bounce: 0, duration: 0.6 };

/**
 * Componente ExpandableTabs com efeito de expansão animado
 *
 * @example
 * ```tsx
 * <ExpandableTabs
 *   tabs={[
 *     { title: "Settings", icon: Settings },
 *     { title: "Notifications", icon: Bell }
 *   ]}
 *   activeColor="text-blue-500"
 * />
 * ```
 */
export const ExpandableTabs: React.FC<ExpandableTabsProps> = ({
  tabs,
  className,
  activeColor = 'text-primary',
  onChange,
  leadingContent,
  onOutsideClick,
  tabBadge,
}) => {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(outsideClickRef as React.RefObject<HTMLElement>, () => {
    setSelected(null);
    onChange?.(null);
    onOutsideClick?.();
  });

  const handleSelect = (index: number, id: string) => {
    setSelected(index);
    onChange?.(id);
  };

  const Separator = () => (
    <div
      className="mx-0.5 h-[20px] w-px bg-[color-mix(in_srgb,var(--foreground)_14%,transparent)]"
      aria-hidden="true"
    />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        'flex flex-wrap items-center gap-1.5 overflow-visible rounded-[var(--radius)] border p-0.5 shadow-sm backdrop-blur-md',
        'border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]',
        'bg-[color-mix(in_srgb,var(--background)_72%,transparent)]',
        'transition-[background-color,border-color,box-shadow] duration-300 ease-out',
        className
      )}
    >
      {leadingContent}
      {leadingContent != null && (
        <div className="mx-0.5 h-[20px] w-px bg-base-200" aria-hidden="true" />
      )}
      {tabs.map((tab, index) => {
        if (tab.type === 'separator') {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isExpanded = hoveredIndex === index;
        const showTabBadge = tabBadge && tabBadge.tabId === tab.id && tabBadge.count > 0;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isExpanded}
            onClick={() => handleSelect(index, tab.id)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            transition={transition}
            className={cn(
              'relative z-[1] flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center gap-0',
              showTabBadge && 'overflow-visible',
              'overflow-visible rounded-full border border-transparent bg-transparent px-2 text-xs font-semibold outline-none',
              'transition-[background-color,box-shadow,color] duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(var(--p))]',
              'sm:min-w-0 sm:justify-start sm:gap-1 sm:px-2.5',
              selected === index
                ? cn('bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]', activeColor)
                : cn(
                    'text-[color-mix(in_srgb,var(--foreground)_68%,transparent)]',
                    'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]',
                    'hover:ring-2 hover:ring-[color-mix(in_oklch,oklch(var(--p))_28%,transparent)]'
                  )
            )}
            aria-label={tab.title}
            aria-pressed={selected === index}
            type="button"
          >
            <Icon size={18} />
            {showTabBadge && (
              <span
                className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-0.5 text-[0.6rem] font-bold leading-none text-error-content shadow-sm"
                aria-hidden
              >
                {tabBadge.count > 9 ? '9+' : tabBadge.count}
              </span>
            )}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
};

ExpandableTabs.displayName = 'ExpandableTabs';
